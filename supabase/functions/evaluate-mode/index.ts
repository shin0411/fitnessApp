// Supabase Edge Function: evaluate-mode
// Schedule: daily at midnight JST via pg_cron
// Evaluates mode (normal/bad/rest/saiyan) for all users based on daily_activity

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const today = new Date().toISOString().split('T')[0];

  const { data: activities } = await supabase
    .from('daily_activity')
    .select('*')
    .eq('date', today);

  if (!activities?.length) return new Response('no activities today', { status: 200 });

  for (const activity of activities) {
    const userId: string = activity.user_id;

    let mode = 'normal';
    if (
      activity.screen_time_minutes > 360 ||
      (activity.sleep_minutes && activity.sleep_minutes < 300)
    ) {
      mode = 'bad';
    } else if (activity.active_minutes > 180) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const { data: prev } = await supabase
        .from('daily_activity')
        .select('active_minutes')
        .eq('user_id', userId)
        .eq('date', yesterday)
        .single();
      if (prev && prev.active_minutes > 60) mode = 'rest';
    }

    const { data: recentIgnores } = await supabase
      .from('mode_override_log')
      .select('user_ignored, saiyan_triggered')
      .eq('user_id', userId)
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(7);

    const consecutiveIgnores =
      recentIgnores?.filter((l) => l.user_ignored && !l.saiyan_triggered).length ?? 0;

    if (mode !== 'normal' && consecutiveIgnores >= 6) {
      mode = 'saiyan';
    }

    await supabase.from('mode_override_log').upsert(
      {
        user_id: userId,
        date: today,
        system_mode: mode,
        user_ignored: false,
        consecutive_ignores: mode !== 'normal' ? consecutiveIgnores + 1 : 0,
        saiyan_triggered: mode === 'saiyan',
      },
      { onConflict: 'user_id,date' }
    );

    await supabase
      .from('daily_activity')
      .update({ current_mode: mode })
      .eq('user_id', userId)
      .eq('date', today);
  }

  return new Response(
    JSON.stringify({ processed: activities.length }),
    { headers: { 'content-type': 'application/json' } }
  );
});

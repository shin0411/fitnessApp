// Supabase Edge Function: calculate-aes
// Schedule: daily at 23:00 JST via pg_cron
// Computes AI Effort Score (0-1000) for all users and optionally generates Claude comments

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const { data: profiles } = await supabase.from('profiles').select('id');
  if (!profiles) return new Response('no profiles', { status: 200 });

  const results: string[] = [];

  for (const { id: userId } of profiles) {
    const [workoutRes, quizRes, mealRes, activityRes] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('finished_at, physical_xp_earned')
        .eq('user_id', userId)
        .gte('finished_at', thirtyDaysAgo)
        .not('finished_at', 'is', null),
      supabase
        .from('quiz_sessions')
        .select('correct_count, total_questions')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo),
      supabase
        .from('meal_logs')
        .select('logged_at')
        .eq('user_id', userId)
        .gte('logged_at', thirtyDaysAgo),
      supabase
        .from('daily_activity')
        .select('sleep_minutes, screen_time_minutes, active_minutes')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo),
    ]);

    const workoutDays = new Set(
      workoutRes.data?.map((w) => w.finished_at?.split('T')[0])
    ).size;
    const totalWorkoutXp = workoutRes.data?.reduce(
      (acc, w) => acc + (w.physical_xp_earned ?? 0),
      0
    ) ?? 0;

    const totalQ = quizRes.data?.length ?? 0;
    const quizAccuracy =
      totalQ > 0
        ? quizRes.data!.reduce(
            (acc, q) => acc + q.correct_count / q.total_questions,
            0
          ) / totalQ
        : 0;

    const mealDays = new Set(mealRes.data?.map((m) => m.logged_at?.split('T')[0])).size;

    const actDays = activityRes.data?.length ?? 1;
    const avgSleep =
      activityRes.data?.reduce((acc, a) => acc + (a.sleep_minutes ?? 0), 0) /
        actDays ?? 0;
    const avgScreen =
      activityRes.data?.reduce((acc, a) => acc + a.screen_time_minutes, 0) /
        actDays ?? 0;

    const aes = Math.min(
      Math.round(
        (workoutDays / 30) * 200 +
          Math.min(totalWorkoutXp / 1000, 1) * 150 +
          (avgSleep / 420) * 150 +
          (1 - Math.min(avgScreen / 360, 1)) * 150 +
          quizAccuracy * 100 +
          (mealDays / 30) * 100 +
          50
      ),
      1000
    );

    let aiComment = '';
    if (aes >= 800 && CLAUDE_API_KEY) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 80,
            messages: [
              {
                role: 'user',
                content: `今月の努力スコア${aes}/1000点。ワークアウト${workoutDays}日/30日。30文字以内で日本語の励ましコメントを返してください。余分な説明不要。`,
              },
            ],
          }),
        });
        const json = await res.json();
        aiComment = json.content?.[0]?.text ?? '';
      } catch (_e) {
        // silently skip
      }
    }

    const { data: existingScores } = await supabase
      .from('global_effort_scores')
      .select('user_id, aes_score')
      .eq('score_date', today)
      .order('aes_score', { ascending: false });

    const sortedWithNew = [
      ...(existingScores?.filter((s) => s.user_id !== userId) ?? []),
      { user_id: userId, aes_score: aes },
    ].sort((a, b) => b.aes_score - a.aes_score);

    const rank = sortedWithNew.findIndex((s) => s.user_id === userId) + 1;

    await supabase.from('global_effort_scores').upsert(
      {
        user_id: userId,
        score_date: today,
        aes_score: aes,
        daily_rank: rank,
        weekly_rank: rank,
        monthly_rank: rank,
        ai_comment: aiComment,
      },
      { onConflict: 'user_id,score_date' }
    );

    results.push(`${userId}: ${aes}pts rank#${rank}`);
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { 'content-type': 'application/json' },
  });
});

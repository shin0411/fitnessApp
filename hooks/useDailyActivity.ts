import { useState, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { Mode, DailyActivity } from '../types';

function evaluateMode(sleepMinutes: number, screenTimeMinutes: number, activeMinutes: number): Mode {
  if (screenTimeMinutes > 360 || sleepMinutes < 300) return 'bad';
  if (activeMinutes > 180) return 'rest';
  return 'normal';
}

export function useDailyActivity() {
  const profile = useUserStore((s) => s.profile);
  const setMode = useUserStore((s) => s.setMode);
  const [todayActivity, setTodayActivity] = useState<DailyActivity | null>(null);
  const [checkinDone, setCheckinDone] = useState(false);

  const loadTodayActivity = useCallback(async () => {
    if (!profile?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .single();

    if (data) {
      setTodayActivity(data as DailyActivity);
      setCheckinDone(true);
      setMode(data.current_mode as Mode);
    } else {
      setCheckinDone(false);
    }
  }, [profile?.id, setMode]);

  async function submitCheckin(
    sleepHours: number,
    screenTimeHours: number,
    activeMinutes: number
  ) {
    if (!profile?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const sleepMinutes = Math.round(sleepHours * 60);
    const screenTimeMinutes = Math.round(screenTimeHours * 60);
    const mode = evaluateMode(sleepMinutes, screenTimeMinutes, activeMinutes);

    const activity = {
      user_id: profile.id,
      date: today,
      step_count: 0,
      active_minutes: activeMinutes,
      screen_time_minutes: screenTimeMinutes,
      sleep_minutes: sleepMinutes,
      sleep_quality:
        sleepHours >= 7 ? 'good' : sleepHours >= 5 ? 'fair' : 'poor',
      current_mode: mode,
    };

    await supabase.from('daily_activity').upsert(activity, {
      onConflict: 'user_id,date',
    });

    setTodayActivity(activity as DailyActivity);
    setCheckinDone(true);
    setMode(mode);

    if (mode !== 'normal') {
      const { data: existingLog } = await supabase
        .from('mode_override_log')
        .select('consecutive_ignores')
        .eq('user_id', profile.id)
        .eq('date', today)
        .single();

      const consecutiveIgnores = (existingLog?.consecutive_ignores ?? 0) + 1;
      const saiyanTriggered = consecutiveIgnores >= 7;

      await supabase.from('mode_override_log').upsert(
        {
          user_id: profile.id,
          date: today,
          system_mode: mode,
          user_ignored: false,
          consecutive_ignores: consecutiveIgnores,
          saiyan_triggered: saiyanTriggered,
        },
        { onConflict: 'user_id,date' }
      );

      if (saiyanTriggered) setMode('saiyan');
    }
  }

  return { todayActivity, checkinDone, loadTodayActivity, submitCheckin };
}

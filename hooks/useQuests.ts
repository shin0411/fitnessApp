import { useState, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { DAILY_QUESTS } from '../modules/quests/definitions';
import { useLevels } from './useLevels';
import { LevelType, UserQuestProgress } from '../types';

export function useQuests() {
  const profile = useUserStore((s) => s.profile);
  const { addXp } = useLevels();
  const [questProgress, setQuestProgress] = useState<UserQuestProgress[]>([]);

  const loadProgress = useCallback(async () => {
    if (!profile?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('user_quest_progress')
      .select('*')
      .eq('user_id', profile.id)
      .eq('assigned_date', today);
    if (data) setQuestProgress(data as UserQuestProgress[]);
  }, [profile?.id]);

  const progressMap: Record<string, UserQuestProgress> = Object.fromEntries(
    questProgress.map((p) => [p.quest_id, p])
  );

  async function incrementQuest(questId: string, amount = 1) {
    if (!profile?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const quest = DAILY_QUESTS.find((q) => q.id === questId);
    if (!quest) return;

    const existing = progressMap[questId];
    if (existing?.completed) return;

    const required = (quest.condition_value?.count as number) ?? 1;
    const current = existing?.progress ?? 0;
    const newProgress = Math.min(current + amount, required);
    const completed = newProgress >= required;

    await supabase.from('user_quest_progress').upsert(
      {
        user_id: profile.id,
        quest_id: questId,
        progress: newProgress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        assigned_date: today,
      },
      { onConflict: 'user_id,quest_id,assigned_date' }
    );

    if (completed && !existing?.completed) {
      await addXp(quest.level_type as LevelType, quest.xp_reward);
    }
    await loadProgress();
  }

  return { questProgress, progressMap, loadProgress, incrementQuest };
}

/**
 * QuestEngine - daily quest progress tracking and completion detection.
 */
import { Quest, UserQuestProgress } from '../../types';
import { DAILY_QUESTS, WEEKLY_QUESTS } from './definitions';

export const ALL_QUESTS = [...DAILY_QUESTS, ...WEEKLY_QUESTS] as Quest[];

export interface QuestUpdateResult {
  questId: string;
  previousProgress: number;
  newProgress: number;
  required: number;
  justCompleted: boolean;
  xpReward: number;
}

/**
 * Calculates the new progress for a quest given an increment.
 */
export function calculateQuestProgress(
  quest: Omit<Quest, 'expires_at'>,
  currentProgress: number,
  increment: number
): QuestUpdateResult {
  const required = (quest.condition_value?.count as number) ?? 1;
  const newProgress = Math.min(currentProgress + increment, required);
  const wasCompleted = currentProgress >= required;
  const justCompleted = !wasCompleted && newProgress >= required;
  return {
    questId: quest.id,
    previousProgress: currentProgress,
    newProgress,
    required,
    justCompleted,
    xpReward: justCompleted ? quest.xp_reward : 0,
  };
}

/**
 * Returns the completion percentage for a quest.
 */
export function questCompletionPercent(
  quest: Omit<Quest, 'expires_at'>,
  progress: UserQuestProgress | undefined
): number {
  const required = (quest.condition_value?.count as number) ?? 1;
  const current = progress?.progress ?? 0;
  return Math.min(current / required, 1) * 100;
}

/**
 * Filters quests by type.
 */
export function getDailyQuests(): Omit<Quest, 'expires_at'>[] {
  return DAILY_QUESTS;
}

export function getWeeklyQuests(): Omit<Quest, 'expires_at'>[] {
  return WEEKLY_QUESTS;
}

/**
 * Level engine - XP calculation, level-up detection, title lookup
 * Re-exports from xp.ts for convenience and adds engine utilities.
 */
export {
  xpForLevel,
  levelFromXp,
  xpToNextLevel,
  getTitleForLevel,
  calcComprehensiveXp,
  MAX_LEVEL,
} from './xp';

import { levelFromXp, xpToNextLevel } from './xp';

export interface LevelUpResult {
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  xpGained: number;
}

/**
 * Calculates whether an XP addition triggers a level-up.
 */
export function checkLevelUp(
  currentTotalXp: number,
  xpToAdd: number
): LevelUpResult {
  const previousLevel = levelFromXp(currentTotalXp);
  const newTotalXp = currentTotalXp + xpToAdd;
  const newLevel = levelFromXp(newTotalXp);
  return {
    leveledUp: newLevel > previousLevel,
    previousLevel,
    newLevel,
    xpGained: xpToAdd,
  };
}

/**
 * Returns a percentage progress to the next level (0–1).
 */
export function levelProgress(totalXp: number): number {
  const info = xpToNextLevel(totalXp);
  if (info.required === 0) return 1;
  return Math.min(info.current / info.required, 1);
}

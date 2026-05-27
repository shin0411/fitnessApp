import { LevelType } from '@/types';

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.8));
}

export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export function getLevelFromTotalXp(totalXp: number): number {
  let level = 1;
  let accumulated = 0;
  while (level < 999) {
    const needed = xpForLevel(level);
    if (accumulated + needed > totalXp) break;
    accumulated += needed;
    level++;
  }
  return level;
}

export function getXpProgress(totalXp: number): { level: number; currentXp: number; neededXp: number; percentage: number } {
  let level = 1;
  let accumulated = 0;
  while (level < 999) {
    const needed = xpForLevel(level);
    if (accumulated + needed > totalXp) break;
    accumulated += needed;
    level++;
  }
  const currentXp = totalXp - accumulated;
  const neededXp = xpForLevel(level);
  const percentage = Math.min((currentXp / neededXp) * 100, 100);
  return { level, currentXp, neededXp, percentage };
}

export function calcPhysicalXp(sets: { weight: number | null; reps: number | null }[]): number {
  let xp = 0;
  for (const set of sets) {
    xp += 10;
    if (set.weight && set.weight > 0) {
      xp += Math.floor(set.weight / 10);
    }
    if (set.reps && set.reps > 10) {
      xp += Math.floor((set.reps - 10) * 0.5);
    }
  }
  return xp;
}

export function calcQuizXp(difficulty: number, correct: number, total: number, avgSeconds: number): number {
  const baseXp = difficulty * 10 * correct;
  const speedBonus = avgSeconds < 5 ? 1.5 : avgSeconds < 10 ? 1.2 : 1.0;
  const accuracyBonus = correct === total ? 1.3 : 1.0;
  return Math.floor(baseXp * speedBonus * accuracyBonus);
}

export const LEVEL_TITLES: Record<LevelType, Record<number, string>> = {
  physical: {
    1: '見習い',
    5: 'トレーニー',
    10: 'アスリート',
    20: 'チャンピオン',
    50: 'エリート',
    100: 'レジェンド',
    200: '超人',
    500: '神話級',
    999: '究極の戦士',
  },
  beauty: {
    1: '見習い',
    5: 'ビューティスト',
    10: 'グルーミング達人',
    20: 'スタイリスト',
    50: 'ビューティエキスパート',
    100: 'アイコン',
    200: '美の探求者',
    500: '美神',
    999: '究極の美',
  },
  knowledge: {
    1: '見習い',
    5: '学習者',
    10: '知識人',
    20: 'スカラー',
    50: 'エキスパート',
    100: '博士',
    200: '賢者',
    500: '知の神',
    999: '全知',
  },
  comprehensive: {
    1: 'ビギナー',
    5: 'アドベンチャラー',
    10: 'ウォリアー',
    20: 'ナイト',
    50: 'パラゴン',
    100: 'チャンピオン',
    200: 'グランドマスター',
    500: 'レジェンダリー',
    999: 'ゴッド',
  },
};

export function getTitleForLevel(levelType: LevelType, level: number): string {
  const titles = LEVEL_TITLES[levelType];
  const thresholds = Object.keys(titles).map(Number).sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (level >= threshold) return titles[threshold];
  }
  return '見習い';
}

export function calcComprehensiveXp(physicalXp: number, beautyXp: number, knowledgeXp: number): number {
  return Math.floor(physicalXp * 0.4 + beautyXp * 0.3 + knowledgeXp * 0.3);
}

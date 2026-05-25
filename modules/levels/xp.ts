export const MAX_LEVEL = 999;

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.8));
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && totalXp >= xpForLevel(level + 1)) {
    level++;
  }
  return level;
}

export function xpToNextLevel(totalXp: number): { current: number; required: number; level: number } {
  const level = levelFromXp(totalXp);
  if (level >= MAX_LEVEL) return { current: 0, required: 0, level: MAX_LEVEL };
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  return {
    current: totalXp - currentLevelXp,
    required: nextLevelXp - currentLevelXp,
    level,
  };
}

const PHYSICAL_TITLES: [number, string][] = [
  [1, '見習いトレーニー'],
  [11, '一般トレーニー'],
  [31, 'ブロンズリフター'],
  [61, 'シルバーリフター'],
  [101, 'ゴールドリフター'],
  [201, 'プラチナリフター'],
  [401, 'ダイヤモンドリフター'],
  [701, 'マスターリフター'],
  [901, 'レジェンドリフター'],
  [999, '肉体の頂点'],
];

const BEAUTY_TITLES: [number, string][] = [
  [1, '美容初心者'],
  [11, 'スキンケア実践者'],
  [31, 'ブロンズビューティー'],
  [61, 'シルバービューティー'],
  [101, 'ゴールドビューティー'],
  [201, 'プラチナビューティー'],
  [401, 'ダイヤモンドビューティー'],
  [701, 'マスタービューティー'],
  [901, 'レジェンドビューティー'],
  [999, '美の頂点'],
];

const KNOWLEDGE_TITLES: [number, string][] = [
  [1, '知識の芽生え'],
  [11, '学習者'],
  [31, 'ブロンズスカラー'],
  [61, 'シルバースカラー'],
  [101, 'ゴールドスカラー'],
  [201, 'プラチナスカラー'],
  [401, 'ダイヤモンドスカラー'],
  [701, 'マスタースカラー'],
  [901, 'レジェンドスカラー'],
  [999, '知の頂点'],
];

const COMPREHENSIVE_TITLES: [number, string][] = [
  [1, '成長の始まり'],
  [11, '修行者'],
  [31, 'ブロンズ覆者'],
  [61, 'シルバー覆者'],
  [101, 'ゴールド覆者'],
  [201, 'プラチナ覆者'],
  [401, 'ダイヤモンド覆者'],
  [701, 'マスター覆者'],
  [901, 'レジェンド覆者'],
  [999, '無双'],
];

function getTitle(level: number, titles: [number, string][]): string {
  let title = titles[0][1];
  for (const [threshold, name] of titles) {
    if (level >= threshold) title = name;
  }
  return title;
}

export function getTitleForLevel(level: number, levelType: string): string {
  switch (levelType) {
    case 'physical': return getTitle(level, PHYSICAL_TITLES);
    case 'beauty': return getTitle(level, BEAUTY_TITLES);
    case 'knowledge': return getTitle(level, KNOWLEDGE_TITLES);
    default: return getTitle(level, COMPREHENSIVE_TITLES);
  }
}

export function calcComprehensiveXp(physicalXp: number, beautyXp: number, knowledgeXp: number): number {
  return Math.floor(physicalXp * 0.4 + beautyXp * 0.3 + knowledgeXp * 0.3);
}

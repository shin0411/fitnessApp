export const QUIZ_DIFFICULTY_CONFIG: Record<number, { label: string; timeLimitSeconds: number }> = {
  1: { label: '保育園', timeLimitSeconds: 30 },
  2: { label: '保育園', timeLimitSeconds: 30 },
  3: { label: '小学低学年', timeLimitSeconds: 25 },
  4: { label: '小学低学年', timeLimitSeconds: 25 },
  5: { label: '小学低学年', timeLimitSeconds: 25 },
  6: { label: '小学高学年', timeLimitSeconds: 20 },
  7: { label: '小学高学年', timeLimitSeconds: 20 },
  8: { label: '小学高学年', timeLimitSeconds: 20 },
  9: { label: '中学', timeLimitSeconds: 15 },
  10: { label: '中学', timeLimitSeconds: 15 },
  11: { label: '中学', timeLimitSeconds: 15 },
  12: { label: '高校', timeLimitSeconds: 12 },
  13: { label: '高校', timeLimitSeconds: 12 },
  14: { label: '高校', timeLimitSeconds: 12 },
  15: { label: '大学教養', timeLimitSeconds: 10 },
  16: { label: '大学教養', timeLimitSeconds: 10 },
  17: { label: '大学教養', timeLimitSeconds: 10 },
  18: { label: '大学院・専門', timeLimitSeconds: 8 },
  19: { label: '大学院・専門', timeLimitSeconds: 8 },
  20: { label: '専門家', timeLimitSeconds: 5 },
};

export function calcQuizXp(
  difficulty: number,
  isCorrect: boolean,
  responseSeconds: number,
  timeLimitSeconds: number,
  comboCount: number
): number {
  if (!isCorrect) return 0;

  let xp = difficulty * 10;

  if (responseSeconds <= timeLimitSeconds * 0.5) {
    xp = Math.floor(xp * 1.5);
  }

  const combo = Math.min(comboCount, 3);
  if (combo > 1) {
    xp = xp * combo;
  }

  return xp;
}

export function calcSessionBonus(totalQuestions: number, correctCount: number): number {
  if (totalQuestions > 0 && correctCount === totalQuestions) {
    return 100;
  }
  return 0;
}

export function difficultyFromKnowledgeLevel(level: number): number {
  return Math.min(20, Math.max(1, Math.ceil(level / 50)));
}

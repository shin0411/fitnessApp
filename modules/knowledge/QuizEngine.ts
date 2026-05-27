/**
 * QuizEngine - difficulty mapping, XP calculation, combo system.
 * Re-exports from xp.ts and adds session management helpers.
 */
export {
  QUIZ_DIFFICULTY_CONFIG,
  calcQuizXp,
  calcSessionBonus,
  difficultyFromKnowledgeLevel,
} from './xp';

import { calcQuizXp, calcSessionBonus, difficultyFromKnowledgeLevel, QUIZ_DIFFICULTY_CONFIG } from './xp';

export interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  xpEarned: number;
  responseSeconds: number;
  combo: number;
}

export interface SessionSummary {
  totalQuestions: number;
  correctCount: number;
  totalXp: number;
  bonusXp: number;
  finalXp: number;
  accuracy: number;
}

/**
 * Calculate XP for a single answer and return structured result.
 */
export function evaluateAnswer(
  questionId: string,
  difficulty: number,
  isCorrect: boolean,
  responseSeconds: number,
  timeLimitSeconds: number,
  currentCombo: number
): QuizResult {
  const newCombo = isCorrect ? currentCombo + 1 : 0;
  const xp = calcQuizXp(difficulty, isCorrect, responseSeconds, timeLimitSeconds, newCombo);
  return { questionId, isCorrect, xpEarned: xp, responseSeconds, combo: newCombo };
}

/**
 * Summarize a completed quiz session.
 */
export function summarizeSession(
  results: QuizResult[]
): SessionSummary {
  const totalQuestions = results.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalXp = results.reduce((sum, r) => sum + r.xpEarned, 0);
  const bonusXp = calcSessionBonus(totalQuestions, correctCount);
  return {
    totalQuestions,
    correctCount,
    totalXp,
    bonusXp,
    finalXp: totalXp + bonusXp,
    accuracy: totalQuestions > 0 ? correctCount / totalQuestions : 0,
  };
}

/**
 * Get time limit in seconds for a given knowledge level.
 */
export function getTimeLimitForLevel(knowledgeLevel: number): number {
  const difficulty = difficultyFromKnowledgeLevel(knowledgeLevel);
  return QUIZ_DIFFICULTY_CONFIG[difficulty]?.timeLimitSeconds ?? 15;
}

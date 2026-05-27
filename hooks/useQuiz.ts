import { useState, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { useQuizStore } from '../store/quizStore';
import { supabase } from '../lib/supabase';
import { QuizQuestion, QuizSession } from '../types';
import { japaneseQuestions } from '../modules/knowledge/questions/japanese';
import { mathQuestions } from '../modules/knowledge/questions/math';
import { englishQuestions } from '../modules/knowledge/questions/english';
import { socialQuestions } from '../modules/knowledge/questions/social';
import {
  calcQuizXp,
  calcSessionBonus,
  difficultyFromKnowledgeLevel,
  QUIZ_DIFFICULTY_CONFIG,
} from '../modules/knowledge/xp';

const ALL_QUESTIONS: QuizQuestion[] = [
  ...japaneseQuestions,
  ...mathQuestions,
  ...englishQuestions,
  ...socialQuestions,
].map((q, i) => ({ ...q, id: `local_${i}` })) as QuizQuestion[];

export function useQuiz() {
  const profile = useUserStore((s) => s.profile);
  const { sessions, setSessions } = useQuizStore();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [combo, setCombo] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setSessions(data as QuizSession[]);
  }, [profile?.id]);

  function loadQuestions(subject: string, knowledgeLevel: number) {
    const difficulty = difficultyFromKnowledgeLevel(knowledgeLevel);
    const pool =
      subject === 'all' ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.subject === subject);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setSelectedChoice(null);
    setAnswered(false);
    setCombo(0);
    setSessionXp(0);
    setCorrectCount(0);
    setSessionDone(false);
    setStartTime(Date.now());
    return { questions: shuffled, difficulty };
  }

  function answerQuestion(choiceIndex: number, knowledgeLevel: number): number {
    if (answered || questions.length === 0) return 0;
    const q = questions[currentIdx];
    const difficulty = difficultyFromKnowledgeLevel(knowledgeLevel);
    const timeLimitSeconds = QUIZ_DIFFICULTY_CONFIG[difficulty]?.timeLimitSeconds ?? 15;
    const responseSeconds = (Date.now() - startTime) / 1000;
    const isCorrect = choiceIndex === q.correct_index;
    const newCombo = isCorrect ? combo + 1 : 0;
    const xp = calcQuizXp(q.difficulty, isCorrect, responseSeconds, timeLimitSeconds, newCombo);

    setSelectedChoice(choiceIndex);
    setAnswered(true);
    setCombo(newCombo);
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setSessionXp((x) => x + xp);
    }
    return xp;
  }

  function goNext(): boolean {
    if (currentIdx + 1 >= questions.length) {
      setSessionDone(true);
      return false;
    }
    setCurrentIdx((i) => i + 1);
    setSelectedChoice(null);
    setAnswered(false);
    setStartTime(Date.now());
    return true;
  }

  async function saveSession(
    subject: string,
    difficulty: number,
    totalXp: number
  ): Promise<void> {
    if (!profile?.id || totalXp <= 0) return;
    await supabase.from('quiz_sessions').insert({
      user_id: profile.id,
      subject,
      difficulty_used: difficulty,
      total_questions: questions.length,
      correct_count: correctCount,
      avg_response_seconds: 10,
      xp_earned: totalXp,
    });
    await loadSessions();
  }

  const getFinalXp = () => {
    const bonus = calcSessionBonus(questions.length, correctCount);
    return sessionXp + bonus;
  };

  return {
    questions,
    currentIdx,
    selectedChoice,
    answered,
    combo,
    sessionXp,
    correctCount,
    sessionDone,
    sessions,
    loadSessions,
    loadQuestions,
    answerQuestion,
    goNext,
    saveSession,
    getFinalXp,
    currentQuestion: questions[currentIdx] ?? null,
  };
}

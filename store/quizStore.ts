import { create } from 'zustand';
import { QuizSession } from '../types';

interface QuizState {
  sessions: QuizSession[];
  setSessions: (sessions: QuizSession[]) => void;
  addSession: (session: QuizSession) => void;
  totalCorrect: number;
  totalQuestions: number;
  updateStats: (correct: number, total: number) => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  sessions: [],
  totalCorrect: 0,
  totalQuestions: 0,
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
  updateStats: (correct, total) =>
    set((state) => ({
      totalCorrect: state.totalCorrect + correct,
      totalQuestions: state.totalQuestions + total,
    })),
}));

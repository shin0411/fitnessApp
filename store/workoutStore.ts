import { create } from 'zustand';
import { WorkoutSession, WorkoutSet, Exercise } from '../types';

interface WorkoutState {
  exercises: Exercise[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  activeSets: WorkoutSet[];
  setExercises: (exercises: Exercise[]) => void;
  setSessions: (sessions: WorkoutSession[]) => void;
  startSession: (session: WorkoutSession) => void;
  addSet: (set: WorkoutSet) => void;
  endSession: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  exercises: [],
  sessions: [],
  activeSession: null,
  activeSets: [],
  setExercises: (exercises) => set({ exercises }),
  setSessions: (sessions) => set({ sessions }),
  startSession: (session) => set({ activeSession: session, activeSets: [] }),
  addSet: (newSet) => set((state) => ({ activeSets: [...state.activeSets, newSet] })),
  endSession: () => set({ activeSession: null, activeSets: [] }),
}));

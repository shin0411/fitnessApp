import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { WorkoutSession, WorkoutSet, Exercise } from '../types';

export function useWorkout() {
  const profile = useUserStore((s) => s.profile);
  const {
    exercises,
    sessions,
    activeSession,
    activeSets,
    setExercises,
    setSessions,
    startSession,
    addSet,
    endSession,
  } = useWorkoutStore();

  async function loadExercises() {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', profile.id)
      .order('name');
    if (data) setExercises(data as Exercise[]);
  }

  async function loadSessions() {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .order('started_at', { ascending: false })
      .limit(20);
    if (data) setSessions(data as WorkoutSession[]);
  }

  async function createExercise(name: string, muscleGroup?: string): Promise<Exercise | null> {
    if (!profile?.id) return null;
    const { data } = await supabase
      .from('exercises')
      .insert({ user_id: profile.id, name, muscle_group: muscleGroup ?? null })
      .select()
      .single();
    if (data) {
      setExercises([...exercises, data as Exercise]);
      return data as Exercise;
    }
    return null;
  }

  async function beginSession(title?: string): Promise<WorkoutSession | null> {
    if (!profile?.id) return null;
    const { data } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: profile.id,
        title: title ?? `ワークアウト ${new Date().toLocaleDateString('ja-JP')}`,
      })
      .select()
      .single();
    if (data) {
      startSession(data as WorkoutSession);
      return data as WorkoutSession;
    }
    return null;
  }

  async function logSet(
    exerciseId: string,
    setNumber: number,
    weight?: number,
    reps?: number,
    durationSeconds?: number
  ): Promise<WorkoutSet | null> {
    if (!activeSession) return null;
    const { data } = await supabase
      .from('workout_sets')
      .insert({
        session_id: activeSession.id,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight: weight ?? null,
        reps: reps ?? null,
        duration_seconds: durationSeconds ?? null,
      })
      .select()
      .single();
    if (data) {
      addSet(data as WorkoutSet);
      return data as WorkoutSet;
    }
    return null;
  }

  async function finishSession(xpEarned: number): Promise<void> {
    if (!activeSession) return;
    await supabase
      .from('workout_sessions')
      .update({
        finished_at: new Date().toISOString(),
        physical_xp_earned: xpEarned,
      })
      .eq('id', activeSession.id);
    endSession();
  }

  return {
    exercises,
    sessions,
    activeSession,
    activeSets,
    loadExercises,
    loadSessions,
    createExercise,
    beginSession,
    logSet,
    finishSession,
  };
}

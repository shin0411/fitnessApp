import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useWorkoutStore } from '../../store/workoutStore';
import { useLevels } from '../../hooks/useLevels';
import { supabase } from '../../lib/supabase';
import { Exercise, WorkoutSession } from '../../types';
import { AchievementToast } from '../../components/AchievementToast';

function calcPhysicalXp(totalSets: number, totalVolume: number, durationMinutes: number): number {
  return Math.min(Math.floor(totalSets * 15 + totalVolume * 0.01 + durationMinutes * 2), 500);
}

export default function WorkoutLogScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const { exercises, activeSession, activeSets, setExercises, startSession, addSet, endSession } = useWorkoutStore();
  const { addXp } = useLevels();

  const [newExerciseName, setNewExerciseName] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', xp: 0 });

  useEffect(() => {
    if (profile?.id) {
      supabase.from('exercises').select('*').eq('user_id', profile.id).then(({ data }) => {
        if (data) setExercises(data as Exercise[]);
      });
    }
  }, [profile?.id]);

  async function handleAddExercise() {
    if (!newExerciseName.trim() || !profile?.id) return;
    const { data } = await supabase.from('exercises').insert({
      user_id: profile.id,
      name: newExerciseName.trim(),
    }).select().single();
    if (data) {
      setExercises([...exercises, data as Exercise]);
      setNewExerciseName('');
    }
  }

  async function handleStartSession() {
    if (!profile?.id) return;
    const { data } = await supabase.from('workout_sessions').insert({
      user_id: profile.id,
      title: `ワークアウト ${new Date().toLocaleDateString('ja-JP')}`,
    }).select().single();
    if (data) startSession(data as WorkoutSession);
  }

  async function handleAddSet() {
    if (!activeSession || !selectedExercise) return;
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    const setNum = activeSets.filter((s) => s.exercise_id === selectedExercise.id).length + 1;

    const { data } = await supabase.from('workout_sets').insert({
      session_id: activeSession.id,
      exercise_id: selectedExercise.id,
      set_number: setNum,
      weight: w,
      reps: r,
    }).select().single();

    if (data) {
      addSet(data as never);
      setWeight('');
      setReps('');
    }
  }

  async function handleFinishSession() {
    if (!activeSession) return;
    const durationMin = Math.round((Date.now() - new Date(activeSession.started_at).getTime()) / 60000);
    const totalVolume = activeSets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0);
    const xpEarned = calcPhysicalXp(activeSets.length, totalVolume, durationMin);

    await supabase.from('workout_sessions').update({
      finished_at: new Date().toISOString(),
      physical_xp_earned: xpEarned,
    }).eq('id', activeSession.id);

    const { leveledUp, newLevel } = await addXp('physical', xpEarned);
    endSession();

    setToast({
      visible: true,
      message: leveledUp ? `フィジカル Lv.${newLevel} にレベルアップ！` : 'ワークアウト完了！',
      xp: xpEarned,
    });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
    >
      <Text style={[styles.title, { color: theme.text }]}>ワークアウト記録</Text>

      {!activeSession ? (
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: '#FF6B35' }]}
          onPress={handleStartSession}
        >
          <Text style={styles.startBtnText}>セッション開始</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.sessionCard, { backgroundColor: theme.surface, borderColor: '#FF6B35' + '60' }]}>
          <Text style={[styles.sessionTitle, { color: theme.text }]}>{activeSession.title}</Text>
          <Text style={[styles.setCount, { color: theme.textSecondary }]}>{activeSets.length} セット記録済み</Text>

          <Text style={[styles.sectionLabel, { color: theme.text }]}>種目を選択</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseScroll}>
            {exercises.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                style={[
                  styles.exChip,
                  {
                    borderColor: selectedExercise?.id === ex.id ? '#FF6B35' : theme.border,
                    backgroundColor: selectedExercise?.id === ex.id ? '#FF6B3520' : theme.background,
                  },
                ]}
                onPress={() => setSelectedExercise(ex)}
              >
                <Text style={[styles.exChipText, { color: selectedExercise?.id === ex.id ? '#FF6B35' : theme.text }]}>
                  {ex.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.setRow}>
            <TextInput
              style={[styles.setInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="重量 kg"
              placeholderTextColor={theme.textSecondary}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.setInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="回数"
              placeholderTextColor={theme.textSecondary}
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.addSetBtn, { backgroundColor: '#FF6B35', opacity: selectedExercise ? 1 : 0.5 }]}
              onPress={handleAddSet}
              disabled={!selectedExercise}
            >
              <Text style={styles.addSetBtnText}>追加</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.finishBtn, { backgroundColor: theme.success }]}
            onPress={handleFinishSession}
          >
            <Text style={styles.finishBtnText}>完了 / XP獲得</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: theme.text }]}>種目を追加</Text>
      <View style={styles.addExRow}>
        <TextInput
          style={[styles.addExInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="例: ベンチプレス"
          placeholderTextColor={theme.textSecondary}
          value={newExerciseName}
          onChangeText={setNewExerciseName}
        />
        <TouchableOpacity style={[styles.addExBtn, { backgroundColor: theme.primary }]} onPress={handleAddExercise}>
          <Text style={styles.addExBtnText}>追加</Text>
        </TouchableOpacity>
      </View>

      <AchievementToast
        visible={toast.visible}
        message={toast.message}
        xpGained={toast.xp}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 56 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
  startBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sessionCard: { padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 20 },
  sessionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  setCount: { fontSize: 13, marginBottom: 14 },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  exerciseScroll: { marginBottom: 14 },
  exChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginRight: 8 },
  exChipText: { fontSize: 13, fontWeight: '600' },
  setRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  setInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 15 },
  addSetBtn: { height: 44, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  addSetBtnText: { color: '#fff', fontWeight: '700' },
  finishBtn: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  finishBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  addExRow: { flexDirection: 'row', gap: 10 },
  addExInput: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  addExBtn: { height: 46, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center' },
  addExBtnText: { color: '#fff', fontWeight: '700' },
});

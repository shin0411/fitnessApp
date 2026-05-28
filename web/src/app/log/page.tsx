'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Exercise, WorkoutSession, WorkoutSet } from '@/types';
import { calcPhysicalXp } from '@/lib/levels';

type SessionWithSets = WorkoutSession & {
  sets: (WorkoutSet & { exercise?: Exercise })[]
};

export default function LogPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<SessionWithSets[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [sessionSets, setSessionSets] = useState<(WorkoutSet & { exercise?: Exercise })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New exercise form
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');
  const [showNewExForm, setShowNewExForm] = useState(false);

  // Set form
  const [selectedExId, setSelectedExId] = useState('');
  const [setWeight, setSetWeight] = useState('');
  const [setReps, setSetReps] = useState('');

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);

    const { data: exData } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (exData) setExercises(exData);

    const { data: sessData } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10);
    if (sessData) {
      const sessWithSets: SessionWithSets[] = await Promise.all(
        sessData.map(async (s: WorkoutSession) => {
          const { data: setsData } = await supabase
            .from('workout_sets')
            .select('*, exercise:exercises(*)')
            .eq('session_id', s.id)
            .order('set_number');
          return { ...s, sets: setsData ?? [] };
        })
      );
      setSessions(sessWithSets);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startSession = async () => {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('workout_sessions')
      .insert({ user_id: userId, title: 'ワークアウト', started_at: new Date().toISOString(), physical_xp_earned: 0 })
      .select()
      .single();
    if (data) {
      setActiveSession(data);
      setSessionSets([]);
      setElapsed(0);
      setTimerActive(true);
    }
  };

  const addSet = async () => {
    if (!activeSession || !selectedExId) return;
    setSaving(true);
    const supabase = createClient();
    const setNumber = sessionSets.length + 1;
    const { data } = await supabase
      .from('workout_sets')
      .insert({
        session_id: activeSession.id,
        exercise_id: selectedExId,
        set_number: setNumber,
        weight: setWeight ? parseFloat(setWeight) : null,
        reps: setReps ? parseInt(setReps) : null,
        is_personal_record: false,
      })
      .select('*, exercise:exercises(*)')
      .single();
    if (data) {
      setSessionSets((prev) => [...prev, data]);
      setSetWeight('');
      setSetReps('');
    }
    setSaving(false);
  };

  const finishSession = async () => {
    if (!activeSession) return;
    setSaving(true);
    const supabase = createClient();
    const xp = calcPhysicalXp(sessionSets.map((s) => ({ weight: s.weight, reps: s.reps })));
    await supabase
      .from('workout_sessions')
      .update({
        finished_at: new Date().toISOString(),
        physical_xp_earned: xp,
        title: `ワークアウト (${sessionSets.length}セット)`,
      })
      .eq('id', activeSession.id);

    // Update user's physical XP
    const { data: lvl } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', activeSession.user_id)
      .eq('level_type', 'physical')
      .single();
    if (lvl) {
      await supabase
        .from('user_levels')
        .update({ total_xp: (lvl.total_xp ?? 0) + xp })
        .eq('user_id', activeSession.user_id)
        .eq('level_type', 'physical');
    }

    setActiveSession(null);
    setSessionSets([]);
    setTimerActive(false);
    setElapsed(0);
    setSaving(false);
    await fetchData();
  };

  const addExercise = async () => {
    if (!userId || !newExName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('exercises')
      .insert({ user_id: userId, name: newExName.trim(), muscle_group: newExMuscle || null })
      .select()
      .single();
    if (data) {
      setExercises((prev) => [...prev, data]);
      setNewExName('');
      setNewExMuscle('');
      setShowNewExForm(false);
      setSelectedExId(data.id);
    }
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: theme.textSecondary }}>読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: '0 0 20px' }}>💪 筋トレ記録</h1>

      {/* Active Session */}
      {activeSession ? (
        <div
          style={{
            backgroundColor: theme.surface,
            border: `2px solid ${theme.primary}`,
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', color: theme.textSecondary }}>セッション進行中</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: theme.primary, fontFamily: 'monospace' }}>
                {formatTime(elapsed)}
              </div>
            </div>
            <Button onClick={finishSession} loading={saving} variant="primary" size="sm">
              完了 (+{calcPhysicalXp(sessionSets.map((s) => ({ weight: s.weight, reps: s.reps })))} XP)
            </Button>
          </div>

          {/* Set form */}
          <div
            style={{
              backgroundColor: theme.bg,
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '14px',
            }}
          >
            <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedExId}
                onChange={(e) => setSelectedExId(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: '120px' }}
              >
                <option value="">エクササイズを選択</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}{ex.muscle_group ? ` (${ex.muscle_group})` : ''}</option>
                ))}
              </select>
              <button
                onClick={() => setShowNewExForm(!showNewExForm)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: `${theme.primary}22`,
                  color: theme.primary,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                + 新規
              </button>
            </div>

            {showNewExForm && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <input
                  placeholder="エクササイズ名"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: '120px' }}
                />
                <input
                  placeholder="部位 (任意)"
                  value={newExMuscle}
                  onChange={(e) => setNewExMuscle(e.target.value)}
                  style={{ ...inputStyle, width: '100px' }}
                />
                <Button onClick={addExercise} loading={saving} size="sm">追加</Button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="number"
                placeholder="重量 (kg)"
                value={setWeight}
                onChange={(e) => setSetWeight(e.target.value)}
                style={{ ...inputStyle, width: '100px' }}
              />
              <input
                type="number"
                placeholder="回数"
                value={setReps}
                onChange={(e) => setSetReps(e.target.value)}
                style={{ ...inputStyle, width: '80px' }}
              />
              <Button onClick={addSet} loading={saving} size="sm" disabled={!selectedExId}>
                セット追加
              </Button>
            </div>
          </div>

          {/* Sets list */}
          {sessionSets.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: theme.textSecondary, marginBottom: '8px' }}>
                記録したセット ({sessionSets.length})
              </div>
              {sessionSets.map((set) => (
                <div
                  key={set.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: `${theme.primary}10`,
                    borderRadius: '8px',
                    marginBottom: '6px',
                    fontSize: '13px',
                    color: theme.text,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {set.exercise?.name ?? 'Unknown'} — セット {set.set_number}
                  </span>
                  <span style={{ color: theme.textSecondary }}>
                    {set.weight != null ? `${set.weight}kg` : '—'} × {set.reps != null ? `${set.reps}回` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: '24px' }}>
          <Button onClick={startSession} size="lg" style={{ width: '100%' }}>
            💪 ワークアウトを開始
          </Button>
        </div>
      )}

      {/* History */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>過去のワークアウト</h2>
      {sessions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: theme.textSecondary,
            padding: '40px 20px',
            backgroundColor: theme.surface,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💪</div>
          まだワークアウトの記録がありません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map((sess) => (
            <div
              key={sess.id}
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: theme.text }}>{sess.title ?? 'ワークアウト'}</div>
                  <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {new Date(sess.started_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: theme.accent,
                    backgroundColor: `${theme.accent}22`,
                    padding: '4px 10px',
                    borderRadius: '8px',
                  }}
                >
                  +{sess.physical_xp_earned} XP
                </span>
              </div>
              {sess.sets.length > 0 && (
                <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                  {sess.sets.length}セット完了 —{' '}
                  {[...new Set(sess.sets.map((s) => s.exercise?.name))].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

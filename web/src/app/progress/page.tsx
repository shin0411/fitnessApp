'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserLevel, WorkoutSession, QuizSession, Streak } from '@/types';
import { getLevelFromTotalXp, getTitleForLevel, getXpProgress } from '@/lib/levels';
import { XPBar } from '@/components/ui/XPBar';

export default function ProgressPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [levels, setLevels] = useState<UserLevel[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [{ data: lvls }, { data: ws }, { data: qs }, { data: st }] = await Promise.all([
        supabase.from('user_levels').select('*').eq('user_id', user.id),
        supabase.from('workout_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(20),
        supabase.from('quiz_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('streaks').select('*').eq('user_id', user.id),
      ]);

      if (lvls) setLevels(lvls);
      if (ws) setWorkoutSessions(ws);
      if (qs) setQuizSessions(qs);
      if (st) setStreaks(st);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const totalWorkoutXp = workoutSessions.reduce((a, s) => a + s.physical_xp_earned, 0);
  const totalQuizXp = quizSessions.reduce((a, s) => a + s.xp_earned, 0);

  const levelMap: Record<string, UserLevel> = {};
  levels.forEach((l) => { levelMap[l.level_type] = l; });

  const levelTypeInfos = [
    { type: 'physical', label: '身体', emoji: '💪' },
    { type: 'beauty', label: '美容', emoji: '✨' },
    { type: 'knowledge', label: '知識', emoji: '📚' },
    { type: 'comprehensive', label: '総合', emoji: '🌟' },
  ];

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
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: '0 0 20px' }}>📈 成長記録</h1>

      {/* Level overview */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>レベルサマリー</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {levelTypeInfos.map(({ type, label, emoji }) => {
            const lvl = levelMap[type];
            if (!lvl) return null;
            const level = getLevelFromTotalXp(lvl.total_xp);
            const title = getTitleForLevel(lvl.level_type, level);
            const { currentXp, neededXp, percentage } = getXpProgress(lvl.total_xp);
            return (
              <div
                key={type}
                style={{
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{emoji}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>{label}</div>
                      <div style={{ fontSize: '11px', color: theme.textSecondary }}>{title}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: theme.primary }}>Lv.{level}</div>
                    <div style={{ fontSize: '11px', color: theme.textSecondary }}>{lvl.total_xp.toLocaleString()} XP総計</div>
                  </div>
                </div>
                <XPBar currentXp={currentXp} neededXp={neededXp} percentage={percentage} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Streaks */}
      {streaks.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>🔥 ストリーク</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {streaks.map((s) => (
              <div
                key={`${s.user_id}-${s.streak_type}`}
                style={{
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '10px',
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: theme.textSecondary, marginBottom: '4px' }}>{s.streak_type}</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: theme.primary }}>{s.streak_days}</div>
                <div style={{ fontSize: '11px', color: theme.textSecondary }}>日連続</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>ワークアウト回数</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: theme.primary }}>{workoutSessions.length}</div>
          <div style={{ fontSize: '12px', color: theme.textSecondary }}>+{totalWorkoutXp.toLocaleString()} XP</div>
        </div>
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>クイズ回数</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: theme.primary }}>{quizSessions.length}</div>
          <div style={{ fontSize: '12px', color: theme.textSecondary }}>+{totalQuizXp.toLocaleString()} XP</div>
        </div>
      </div>

      {/* Recent activity */}
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>最近の活動</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          ...workoutSessions.slice(0, 5).map((s) => ({
            id: s.id,
            type: 'workout' as const,
            title: s.title ?? 'ワークアウト',
            xp: s.physical_xp_earned,
            date: s.started_at,
          })),
          ...quizSessions.slice(0, 5).map((s) => ({
            id: s.id,
            type: 'quiz' as const,
            title: `クイズ: ${s.subject}`,
            xp: s.xp_earned,
            date: s.created_at ?? '',
          })),
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)
          .map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{item.type === 'workout' ? '💪' : '📚'}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>{item.title}</div>
                  <div style={{ fontSize: '11px', color: theme.textSecondary }}>
                    {new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: theme.accent }}>+{item.xp} XP</span>
            </div>
          ))}
        {workoutSessions.length === 0 && quizSessions.length === 0 && (
          <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '20px', fontSize: '13px' }}>
            まだ活動記録がありません
          </div>
        )}
      </div>
    </AppLayout>
  );
}

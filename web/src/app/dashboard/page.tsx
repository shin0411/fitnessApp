'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { LevelCard } from '@/components/ui/LevelCard';
import { QuestList } from '@/components/ui/QuestList';
import { UserLevel, Profile, UserQuestProgress, Streak } from '@/types';
import { getTitleForLevel, getLevelFromTotalXp } from '@/lib/levels';

const modeLabels: Record<string, string> = {
  normal: '通常',
  bad: '不調',
  rest: 'レスト',
  saiyan: 'サイヤン',
};

const modeEmojis: Record<string, string> = {
  normal: '💪',
  bad: '😔',
  rest: '🛌',
  saiyan: '🔥',
};

const defaultLevels = [
  { user_id: '', level_type: 'physical' as const, level: 1, total_xp: 0, current_title: '見習い' },
  { user_id: '', level_type: 'beauty' as const, level: 1, total_xp: 0, current_title: '見習い' },
  { user_id: '', level_type: 'knowledge' as const, level: 1, total_xp: 0, current_title: '見習い' },
  { user_id: '', level_type: 'comprehensive' as const, level: 1, total_xp: 0, current_title: '見習い' },
];

export default function DashboardPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [levels, setLevels] = useState<UserLevel[]>(defaultLevels);
  const [quests, setQuests] = useState<UserQuestProgress[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) setProfile(profileData);

      // Fetch levels
      const { data: levelsData } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id);

      if (levelsData && levelsData.length > 0) {
        // Ensure all 4 level types are present
        const levelTypes = ['physical', 'beauty', 'knowledge', 'comprehensive'];
        const merged = levelTypes.map((lt) => {
          const existing = levelsData.find((l) => l.level_type === lt);
          if (existing) {
            return {
              ...existing,
              current_title: getTitleForLevel(lt as UserLevel['level_type'], getLevelFromTotalXp(existing.total_xp)),
            };
          }
          return {
            user_id: user.id,
            level_type: lt as UserLevel['level_type'],
            level: 1,
            total_xp: 0,
            current_title: '見習い',
          };
        });
        setLevels(merged);
      }

      // Fetch quests
      const today = new Date().toISOString().split('T')[0];
      const { data: questsData } = await supabase
        .from('user_quest_progress')
        .select('*, quest:quests(*)')
        .eq('user_id', user.id)
        .eq('assigned_date', today)
        .limit(3);
      if (questsData) setQuests(questsData);

      // Fetch streak
      const { data: streakData } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('streak_type', 'workout')
        .single();
      if (streakData) setStreak(streakData);

      setLoading(false);
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚔️</div>
            <p style={{ color: theme.textSecondary, fontSize: '14px' }}>データを読み込み中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: theme.text, margin: 0 }}>
          おかえりなさい、{profile?.username ?? '冠者'}！
        </h1>
        <p style={{ fontSize: '14px', color: theme.textSecondary, margin: '4px 0 0' }}>
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '10px',
            padding: '14px 18px',
            flex: '1',
            minWidth: '140px',
          }}
        >
          <div style={{ fontSize: '11px', color: theme.textSecondary, marginBottom: '4px' }}>ストリーク</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: theme.primary }}>
            {streak?.streak_days ?? 0}
            <span style={{ fontSize: '14px', fontWeight: 400, color: theme.textSecondary, marginLeft: '4px' }}>日</span>
          </div>
        </div>
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '10px',
            padding: '14px 18px',
            flex: '1',
            minWidth: '140px',
          }}
        >
          <div style={{ fontSize: '11px', color: theme.textSecondary, marginBottom: '4px' }}>モード</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: theme.text }}>
            {modeEmojis['normal']} {modeLabels['normal']}
          </div>
        </div>
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '10px',
            padding: '14px 18px',
            flex: '1',
            minWidth: '140px',
          }}
        >
          <div style={{ fontSize: '11px', color: theme.textSecondary, marginBottom: '4px' }}>达成クエスト</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#22c55e' }}>
            {quests.filter((q) => q.completed).length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: theme.textSecondary, marginLeft: '2px' }}>/</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: theme.textSecondary }}>{quests.length}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>クイックアクション</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/log" style={{ textDecoration: 'none', flex: '1', minWidth: '120px' }}>
            <div
              style={{
                backgroundColor: theme.primary,
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>💪</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: theme.bg }}>筋トレ記録</div>
            </div>
          </Link>
          <Link href="/quiz" style={{ textDecoration: 'none', flex: '1', minWidth: '120px' }}>
            <div
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>📚</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>クイズ</div>
            </div>
          </Link>
          <Link href="/analyze" style={{ textDecoration: 'none', flex: '1', minWidth: '120px' }}>
            <div
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>写真診断</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Level Cards */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>レベルステータス</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          {levels.map((lvl) => (
            <LevelCard key={lvl.level_type} userLevel={lvl} />
          ))}
        </div>
      </div>

      {/* Daily Quests */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>今日のクエスト</h2>
        {quests.length === 0 ? (
          <div
            style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              color: theme.textSecondary,
              fontSize: '14px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            今日のクエストはまだ割り当てられていません
          </div>
        ) : (
          <QuestList quests={quests} />
        )}
      </div>
    </AppLayout>
  );
}

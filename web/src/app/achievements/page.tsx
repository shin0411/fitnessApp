'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Achievement, UserAchievement } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  workout: '筋トレ',
  quiz: '知識',
  beauty: '美容',
  nutrition: '栄養',
  streak: '継続',
  social: 'ソーシャル',
};

export default function AchievementsPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [{ data: achData }, { data: uaData }] = await Promise.all([
        supabase.from('achievements').select('*').order('xp_reward'),
        supabase.from('user_achievements').select('*').eq('user_id', user.id),
      ]);

      if (achData) setAchievements(achData);
      if (uaData) setEarned(new Set(uaData.map((ua: UserAchievement) => ua.achievement_id)));
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)];
  const filtered = selectedCategory === 'all'
    ? achievements
    : achievements.filter((a) => a.category === selectedCategory);

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: theme.textSecondary }}>読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  const earnedCount = achievements.filter((a) => earned.has(a.id)).length;

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: 0 }}>🏆 実績</h1>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: theme.primary }}>
            {earnedCount}/{achievements.length}
          </div>
          <div style={{ fontSize: '11px', color: theme.textSecondary }}>解除済み</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ width: '100%', height: '8px', backgroundColor: theme.border, borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: achievements.length > 0 ? `${(earnedCount / achievements.length) * 100}%` : '0%',
              height: '100%',
              backgroundColor: theme.accent,
              borderRadius: '4px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: selectedCategory === cat ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
              backgroundColor: selectedCategory === cat ? `${theme.primary}20` : theme.bg,
              color: selectedCategory === cat ? theme.primary : theme.textSecondary,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: selectedCategory === cat ? 700 : 400,
            }}
          >
            {cat === 'all' ? 'すべて' : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Achievements grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '40px', fontSize: '14px' }}>
          実績がありません
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtered.map((ach) => {
            const isEarned = earned.has(ach.id);
            return (
              <div
                key={ach.id}
                style={{
                  backgroundColor: theme.surface,
                  border: `1px solid ${isEarned ? theme.accent : theme.border}`,
                  borderRadius: '12px',
                  padding: '16px',
                  opacity: isEarned ? 1 : 0.6,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isEarned && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      fontSize: '16px',
                    }}
                  >
                    ✅
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '28px', filter: isEarned ? 'none' : 'grayscale(100%)' }}>
                    {ach.icon || '🏅'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text, marginBottom: '2px' }}>
                      {ach.name}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '6px' }}>
                      {ach.description}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        color: theme.accent,
                        fontWeight: 700,
                        backgroundColor: `${theme.accent}20`,
                        padding: '2px 8px',
                        borderRadius: '8px',
                      }}
                    >
                      +{ach.xp_reward} XP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {achievements.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: theme.textSecondary,
            padding: '60px 20px',
            fontSize: '14px',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
          ゲームを進めて実績を解除しよう！
        </div>
      )}
    </AppLayout>
  );
}

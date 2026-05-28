'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore, themes } from '@/store/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Profile, UserLevel, ThemeName } from '@/types';
import { getTitleForLevel, getLevelFromTotalXp } from '@/lib/levels';

const themeInfo: { name: ThemeName; label: string; emoji: string }[] = [
  { name: 'simple', label: 'シンプル', emoji: '⚪' },
  { name: 'kawaii', label: 'かわいい', emoji: '🌸' },
  { name: 'cool', label: 'クール', emoji: '⚡' },
  { name: 'beautiful', label: 'ビューティフル', emoji: '✨' },
];

export default function ProfilePage() {
  const { theme, themeName, setTheme } = useThemeStore();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [levels, setLevels] = useState<UserLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) {
        setProfile(profileData);
        setUsername(profileData.username ?? '');
      }

      const { data: levelsData } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id);
      if (levelsData) setLevels(levelsData);

      setLoading(false);
    };
    fetchData();
  }, [router]);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ username: username.trim(), theme: themeName })
      .eq('id', profile.id);
    setSaving(false);
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
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
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: '0 0 20px' }}>👤 プロフィール</h1>

      {/* Profile Card */}
      <div
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: `${theme.primary}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            {profile?.username?.[0]?.toUpperCase() ?? '👤'}
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text }}>
              {profile?.username ?? 'アノニマス'}
            </div>
            {profile?.invite_code && (
              <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                招待コード: <span style={{ fontFamily: 'monospace', color: theme.primary }}>{profile.invite_code}</span>
              </div>
            )}
          </div>
        </div>

        {/* Username edit */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '6px' }}>
            ユーザー名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              color: theme.text,
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <Button onClick={saveProfile} loading={saving} size="sm">
          保存
        </Button>
      </div>

      {/* Theme selector */}
      <div
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 16px' }}>🎨 テーマ</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {themeInfo.map((t) => {
            const tc = themes[t.name];
            const isActive = themeName === t.name;
            return (
              <button
                key={t.name}
                onClick={() => setTheme(t.name)}
                style={{
                  padding: '14px',
                  backgroundColor: tc.bg,
                  border: isActive ? `2px solid ${tc.primary}` : `1px solid ${tc.border}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{t.emoji}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: tc.text }}>{t.label}</div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  {[tc.primary, tc.accent, tc.surface].map((c, i) => (
                    <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: c, border: `1px solid ${tc.border}` }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Level summary */}
      {levels.length > 0 && (
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 14px' }}>🏆 レベルサマリー</h2>
          {levels.map((lvl) => {
            const level = getLevelFromTotalXp(lvl.total_xp);
            const title = getTitleForLevel(lvl.level_type, level);
            const labelMap: Record<string, string> = { physical: '身体', beauty: '美容', knowledge: '知識', comprehensive: '総合' };
            const emojiMap: Record<string, string> = { physical: '💪', beauty: '✨', knowledge: '📚', comprehensive: '🌟' };
            return (
              <div
                key={lvl.level_type}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>{emojiMap[lvl.level_type]}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>{labelMap[lvl.level_type]}</div>
                    <div style={{ fontSize: '11px', color: theme.textSecondary }}>{title}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: theme.primary }}>Lv.{level}</div>
                  <div style={{ fontSize: '11px', color: theme.textSecondary }}>{lvl.total_xp.toLocaleString()} XP</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sign out */}
      <Button onClick={signOut} variant="danger" style={{ width: '100%' }}>
        サインアウト
      </Button>
    </AppLayout>
  );
}

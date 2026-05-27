'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalEffortScore } from '@/types';

type RankEntry = GlobalEffortScore & { profile?: { username: string | null } };

const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [myRank, setMyRank] = useState<RankEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('global_effort_scores')
        .select('*, profile:profiles(username)')
        .eq('score_date', today)
        .order('aes_score', { ascending: false })
        .limit(20);

      if (data) {
        setRankings(data);
        const myEntry = data.find((r: RankEntry) => r.user_id === user.id);
        if (myEntry) setMyRank(myEntry);
      }
      setLoading(false);
    };
    fetchData();
  }, [router]);

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
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: '0 0 6px' }}>🌟 ランキング</h1>
      <p style={{ fontSize: '13px', color: theme.textSecondary, margin: '0 0 20px' }}>
        {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}の日次ランキング
      </p>

      {/* My rank */}
      {myRank && (
        <div
          style={{
            backgroundColor: `${theme.primary}20`,
            border: `2px solid ${theme.primary}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '2px' }}>あなたのランク</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: theme.primary }}>#{myRank.daily_rank}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '2px' }}>AESスコア</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: theme.text }}>{myRank.aes_score}</div>
          </div>
        </div>
      )}

      {/* Rankings */}
      {rankings.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: theme.textSecondary,
            padding: '60px 20px',
            backgroundColor: theme.surface,
            borderRadius: '14px',
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌟</div>
          <div style={{ fontSize: '14px' }}>今日のランキングデータはまだありません。</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>ワークアウトやクイズでスコアを稼いでランクインしよう！</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rankings.map((entry, index) => {
            const isMe = entry.user_id === userId;
            return (
              <div
                key={entry.user_id}
                style={{
                  backgroundColor: isMe ? `${theme.primary}15` : theme.surface,
                  border: `1px solid ${isMe ? theme.primary : theme.border}`,
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {/* Rank */}
                <div
                  style={{
                    width: '40px',
                    textAlign: 'center',
                    fontSize: index < 3 ? '22px' : '16px',
                    fontWeight: 800,
                    color: index < 3 ? 'inherit' : theme.textSecondary,
                    flexShrink: 0,
                  }}
                >
                  {index < 3 ? RANK_EMOJIS[index] : `#${index + 1}`}
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: `${theme.primary}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  👤
                </div>

                {/* Name & comment */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: isMe ? 700 : 600, color: theme.text }}>
                    {entry.profile?.username ?? '冠者'}
                    {isMe && <span style={{ fontSize: '11px', color: theme.primary, marginLeft: '6px' }}>(You)</span>}
                  </div>
                  {entry.ai_comment && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: theme.textSecondary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.ai_comment}
                    </div>
                  )}
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: index < 3 ? theme.accent : theme.text }}>
                    {entry.aes_score}
                  </div>
                  <div style={{ fontSize: '10px', color: theme.textSecondary }}>AES</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

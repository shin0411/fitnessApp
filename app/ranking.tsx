import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';

interface RankEntry {
  user_id: string;
  aes_score: number;
  daily_rank: number;
  ai_comment: string | null;
  profiles: { username: string | null };
}

export default function RankingScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [myRank, setMyRank] = useState<RankEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, [profile?.id]);

  async function loadRankings() {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('global_effort_scores')
      .select('user_id, aes_score, daily_rank, ai_comment, profiles(username)')
      .eq('score_date', today)
      .order('aes_score', { ascending: false })
      .limit(50);

    if (data) {
      const ranked = data.map((r, i) => ({
        ...(r as unknown as RankEntry),
        daily_rank: i + 1,
      }));
      setRankings(ranked);
      if (profile?.id) {
        setMyRank(ranked.find((r) => r.user_id === profile.id) ?? null);
      }
    }
    setLoading(false);
  }

  function rankEmoji(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: theme.primary }]}>← 戻る</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>グローバルランキング</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>
        今日のAIエフォートスコア（0ー1000点）
      </Text>

      {myRank && (
        <View style={[styles.myRankCard, { backgroundColor: theme.primary + '18', borderColor: theme.primary }]}>
          <Text style={[styles.myRankLabel, { color: theme.textSecondary }]}>あなたの順位</Text>
          <Text style={[styles.myRankNum, { color: theme.primary }]}>
            {rankEmoji(myRank.daily_rank)} {myRank.daily_rank}位
          </Text>
          <Text style={[styles.myScore, { color: theme.text }]}>
            {Math.round(myRank.aes_score)} / 1000点
          </Text>
          {myRank.ai_comment && (
            <Text style={[styles.aiComment, { color: theme.textSecondary }]}>
              💬 {myRank.ai_comment}
            </Text>
          )}
        </View>
      )}

      {!myRank && !loading && (
        <View style={[styles.noRankCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.noRankText, { color: theme.textSecondary }]}>
            今日のスコアはまだ計算されていません。{'\n'}
            アクティビティを記録するとランキングに参加できます。
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>トップ50</Text>
      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
      ) : rankings.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          まだランキングデータがありません
        </Text>
      ) : (
        rankings.map((r) => {
          const isMe = r.user_id === profile?.id;
          return (
            <View
              key={r.user_id}
              style={[
                styles.rankRow,
                {
                  backgroundColor: isMe ? theme.primary + '12' : theme.surface,
                  borderColor: isMe ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={[styles.rankNum, { color: r.daily_rank <= 3 ? '#FFD700' : theme.textSecondary }]}>
                {rankEmoji(r.daily_rank)}
              </Text>
              <Text style={[styles.rankName, { color: isMe ? theme.primary : theme.text }]}>
                {(r.profiles as any)?.username ?? 'ユーザー'}
                {isMe ? ' （あなた）' : ''}
              </Text>
              <Text style={[styles.rankScore, { color: theme.primary }]}>
                {Math.round(r.aes_score)}pts
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 20 },
  myRankCard: { padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 20, alignItems: 'center' },
  myRankLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  myRankNum: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  myScore: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  aiComment: { fontSize: 12, lineHeight: 18, textAlign: 'center', fontStyle: 'italic' },
  noRankCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  noRankText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  empty: { fontSize: 14, textAlign: 'center', paddingTop: 20 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  rankNum: { width: 32, fontSize: 16, fontWeight: '700' },
  rankName: { flex: 1, fontSize: 14, fontWeight: '600' },
  rankScore: { fontSize: 14, fontWeight: '800' },
});

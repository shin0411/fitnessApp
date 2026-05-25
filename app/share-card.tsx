import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useUserStore } from '../store/userStore';
import { useLevels } from '../hooks/useLevels';
import { xpToNextLevel } from '../modules/levels/xp';
import { supabase } from '../lib/supabase';
import { LevelType } from '../types';

const LEVEL_COLORS: Record<LevelType, string> = {
  physical: '#FF6B35',
  beauty: '#FF8FAB',
  knowledge: '#4ECDC4',
  comprehensive: '#FFD700',
};

const LEVEL_EMOJIS: Record<LevelType, string> = {
  physical: '💪',
  beauty: '✨',
  knowledge: '🧠',
  comprehensive: '🔥',
};

const LEVEL_LABELS: Record<LevelType, string> = {
  physical: 'フィジカル',
  beauty: 'ビューティー',
  knowledge: 'ナレッジ',
  comprehensive: '総合',
};

export default function ShareCardScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const currentMode = useUserStore((s) => s.currentMode);
  const { levels } = useLevels();
  const [aesScore, setAesScore] = useState<number | null>(null);
  const [aesRank, setAesRank] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('global_effort_scores')
      .select('aes_score, daily_rank')
      .eq('user_id', profile.id)
      .eq('score_date', today)
      .single()
      .then(({ data }) => {
        if (data) {
          setAesScore(data.aes_score);
          setAesRank(data.daily_rank);
        }
      });
  }, [profile?.id]);

  function buildShareText() {
    const physical = levels['physical'];
    const beauty = levels['beauty'];
    const knowledge = levels['knowledge'];
    const comp = levels['comprehensive'];
    const username = profile?.username ?? 'トレーナー';

    const modeLabel =
      currentMode === 'saiyan' ? '⚡サイヤ人モード'
      : currentMode === 'bad' ? '📱修行中'
      : currentMode === 'rest' ? '💤回復中'
      : '✅グッドコンディション';

    return [
      '🎮 FitnessRPG 成長記録 🎮',
      '',
      `👤 ${username}`,
      modeLabel,
      '',
      physical ? `💪 フィジカル Lv.${physical.level} - ${physical.current_title}` : '',
      beauty ? `✨ ビューティー Lv.${beauty.level} - ${beauty.current_title}` : '',
      knowledge ? `🧠 ナレッジ Lv.${knowledge.level} - ${knowledge.current_title}` : '',
      comp ? `🔥 総合 Lv.${comp.level} - ${comp.current_title}` : '',
      '',
      aesScore != null ? `📊 今日のAIエフォートスコア: ${Math.round(aesScore)}/1000${aesRank ? ` (#${aesRank})` : ''}` : '',
      '',
      '毎日レベルアップ中！ #FitnessRPG',
    ].filter(Boolean).join('\n');
  }

  async function handleShare() {
    setSharing(true);
    try {
      await Share.share({ message: buildShareText() });
    } catch (_e) {
      // user cancelled
    }
    setSharing(false);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: theme.primary }]}>← 戻る</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>成長記録カード</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>
        レベルとスコアをSNSでシェア
      </Text>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '60' }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          {profile?.username ?? 'トレーナー'} の記録
        </Text>

        {aesScore != null && (
          <View style={[styles.aesBadge, { backgroundColor: '#FFD70020', borderColor: '#FFD700' }]}>
            <Text style={[styles.aesScore, { color: '#FFD700' }]}>{Math.round(aesScore)}</Text>
            <Text style={[styles.aesLabel, { color: '#FFD700' }]}>AESスコア{aesRank ? ` #${aesRank}` : ''}</Text>
          </View>
        )}

        {(['comprehensive', 'physical', 'beauty', 'knowledge'] as const).map((lt) => {
          const lv = levels[lt];
          if (!lv) return null;
          const prog = xpToNextLevel(lv.total_xp);
          const color = LEVEL_COLORS[lt];
          const pct = prog.required > 0 ? Math.min((prog.current / prog.required) * 100, 100) : 100;

          return (
            <View key={lt} style={styles.levelRow}>
              <Text style={styles.levelEmoji}>{LEVEL_EMOJIS[lt]}</Text>
              <View style={styles.levelInfo}>
                <View style={styles.levelTopRow}>
                  <Text style={[styles.levelLabel, { color: theme.textSecondary }]}>{LEVEL_LABELS[lt]}</Text>
                  <Text style={[styles.levelNum, { color }]}>Lv.{lv.level}</Text>
                </View>
                <Text style={[styles.levelTitle, { color: theme.text }]} numberOfLines={1}>{lv.current_title}</Text>
                <View style={[styles.barBg, { backgroundColor: theme.border }]}>
                  <View style={[styles.barFill, { backgroundColor: color, width: `${pct}%` }]} />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.shareBtn, { backgroundColor: theme.primary }]}
        onPress={handleShare}
        disabled={sharing}
      >
        {sharing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.shareBtnText}>📲 シェアする</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        SNSやメッセージアプリでシェアできます
      </Text>
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
  card: { borderRadius: 24, borderWidth: 1.5, padding: 20, marginBottom: 24, gap: 14 },
  cardTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  aesBadge: {
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },
  aesScore: { fontSize: 34, fontWeight: '900', lineHeight: 38 },
  aesLabel: { fontSize: 11, fontWeight: '700' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  levelInfo: { flex: 1 },
  levelTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  levelLabel: { fontSize: 11, fontWeight: '600' },
  levelNum: { fontSize: 13, fontWeight: '800' },
  levelTitle: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  barBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  shareBtn: { height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  shareBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  hint: { fontSize: 12, textAlign: 'center' },
});

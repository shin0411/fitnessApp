import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useUserStore } from '../store/userStore';
import { useLevels } from '../hooks/useLevels';
import { supabase } from '../lib/supabase';
import { xpToNextLevel } from '../modules/levels/xp';

interface DayStat {
  date: string;
  physical_xp: number;
  knowledge_xp: number;
  beauty_xp: number;
}

const AXES = [
  { key: 'physical', label: 'フィジカル', color: '#FF6B35' },
  { key: 'beauty', label: 'ビューティー', color: '#FF8FAB' },
  { key: 'knowledge', label: 'ナレッジ', color: '#4ECDC4' },
  { key: 'comprehensive', label: '総合', color: '#FFD700' },
] as const;

export default function ProgressScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const { levels } = useLevels();
  const [weekStats, setWeekStats] = useState<DayStat[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalMeals, setTotalMeals] = useState(0);

  useEffect(() => {
    if (profile?.id) loadStats();
  }, [profile?.id]);

  async function loadStats() {
    if (!profile?.id) return;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [workoutRes, quizRes, analysisRes, mealRes] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('finished_at, physical_xp_earned')
        .eq('user_id', profile.id)
        .not('finished_at', 'is', null),
      supabase
        .from('quiz_sessions')
        .select('created_at, xp_earned')
        .eq('user_id', profile.id),
      supabase
        .from('photo_analyses')
        .select('created_at, xp_earned, analysis_type')
        .eq('user_id', profile.id)
        .gte('created_at', sevenDaysAgo),
      supabase
        .from('meal_logs')
        .select('logged_at')
        .eq('user_id', profile.id),
    ]);

    setTotalWorkouts(workoutRes.data?.length ?? 0);
    setTotalQuizzes(quizRes.data?.length ?? 0);
    setTotalMeals(mealRes.data?.length ?? 0);

    const dayMap: Record<string, DayStat> = {};
    const ensure = (d: string) => {
      if (!dayMap[d]) dayMap[d] = { date: d, physical_xp: 0, knowledge_xp: 0, beauty_xp: 0 };
    };

    workoutRes.data
      ?.filter((w) => w.finished_at && w.finished_at >= sevenDaysAgo)
      .forEach((w) => {
        const d = w.finished_at!.split('T')[0];
        ensure(d);
        dayMap[d].physical_xp += w.physical_xp_earned ?? 0;
      });

    quizRes.data
      ?.filter((q) => q.created_at >= sevenDaysAgo)
      .forEach((q) => {
        const d = q.created_at.split('T')[0];
        ensure(d);
        dayMap[d].knowledge_xp += q.xp_earned ?? 0;
      });

    analysisRes.data?.forEach((a) => {
      const d = a.created_at.split('T')[0];
      ensure(d);
      if (a.analysis_type === 'body') dayMap[d].physical_xp += a.xp_earned ?? 0;
      else dayMap[d].beauty_xp += a.xp_earned ?? 0;
    });

    setWeekStats(Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)));
  }

  const maxXp = Math.max(
    ...weekStats.flatMap((d) => [d.physical_xp, d.knowledge_xp, d.beauty_xp]),
    1
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: theme.primary }]}>← 戻る</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>成長グラフ</Text>

      <View style={styles.levelGrid}>
        {AXES.map(({ key, label, color }) => {
          const lv = levels[key];
          if (!lv) return null;
          const xpInfo = xpToNextLevel(lv.total_xp);
          const pct = xpInfo.required > 0 ? xpInfo.current / xpInfo.required : 1;
          return (
            <View
              key={key}
              style={[styles.levelCard, { backgroundColor: theme.surface, borderColor: color + '40' }]}
            >
              <Text style={[styles.levelLabel, { color: theme.textSecondary }]}>{label}</Text>
              <Text style={[styles.levelNum, { color }]}>Lv.{lv.level}</Text>
              <Text style={[styles.levelTitle, { color: theme.text }]} numberOfLines={1}>
                {lv.current_title}
              </Text>
              <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.xpBarFill,
                    { width: `${Math.min(pct * 100, 100)}%`, backgroundColor: color },
                  ]}
                />
              </View>
              <Text style={[styles.xpText, { color: theme.textSecondary }]}>
                {xpInfo.current.toLocaleString()} / {xpInfo.required.toLocaleString()} XP
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>過去7日間のXP獲得</Text>
      {weekStats.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>まだデータがありません</Text>
      ) : (
        <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {weekStats.map((day) => (
            <View key={day.date} style={styles.chartRow}>
              <Text style={[styles.chartDate, { color: theme.textSecondary }]}>
                {day.date.slice(5)}
              </Text>
              <View style={styles.barsCol}>
                {[
                  { xp: day.physical_xp, color: '#FF6B35' },
                  { xp: day.knowledge_xp, color: '#4ECDC4' },
                  { xp: day.beauty_xp, color: '#FF8FAB' },
                ].map((bar, i) => (
                  <View key={i} style={[styles.barTrack, { backgroundColor: theme.border }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${(bar.xp / maxXp) * 100}%`, backgroundColor: bar.color },
                      ]}
                    />
                  </View>
                ))}
              </View>
              <Text style={[styles.chartTotal, { color: theme.textSecondary }]}>
                {day.physical_xp + day.knowledge_xp + day.beauty_xp}
              </Text>
            </View>
          ))}
          <View style={styles.legend}>
            {[
              { label: 'フィジカル', color: '#FF6B35' },
              { label: 'ナレッジ', color: '#4ECDC4' },
              { label: 'ビューティー', color: '#FF8FAB' },
            ].map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>累計統計</Text>
      <View style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#FF6B35' }]}>{totalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>ワークアウト</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#4ECDC4' }]}>{totalQuizzes}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>クイズ回</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: theme.primary }]}>{totalMeals}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>食事記録</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  levelCard: { width: '47%', padding: 14, borderRadius: 14, borderWidth: 1.5 },
  levelLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  levelNum: { fontSize: 28, fontWeight: '900' },
  levelTitle: { fontSize: 11, marginBottom: 8 },
  xpBarBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  xpBarFill: { height: '100%', borderRadius: 2 },
  xpText: { fontSize: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  chartCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  chartDate: { width: 34, fontSize: 11 },
  barsCol: { flex: 1, gap: 3 },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  chartTotal: { width: 34, fontSize: 11, textAlign: 'right' },
  legend: { flexDirection: 'row', gap: 14, marginTop: 8, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11 },
  statsRow: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 30, fontWeight: '900' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1 },
});

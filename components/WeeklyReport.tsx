import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface DayStat {
  date: string;
  physical_xp: number;
  knowledge_xp: number;
  beauty_xp: number;
}

interface Props {
  stats: DayStat[];
  workoutCount: number;
  quizCount: number;
  mealCount: number;
}

export function WeeklyReport({ stats, workoutCount, quizCount, mealCount }: Props) {
  const theme = useTheme();
  const maxXp = Math.max(
    ...stats.flatMap((d) => [d.physical_xp, d.knowledge_xp, d.beauty_xp]),
    1
  );
  const totalXp = stats.reduce(
    (sum, d) => sum + d.physical_xp + d.knowledge_xp + d.beauty_xp,
    0
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>ウィークリーレポート</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#FF6B35' }]}>{workoutCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>ワークアウト</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#4ECDC4' }]}>{quizCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>クイズ回</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: theme.primary }]}>{mealCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>食事記録</Text>
        </View>
      </View>

      <Text style={[styles.totalXp, { color: theme.xpColor }]}>
        週計 {totalXp.toLocaleString()} XP 獲得
      </Text>

      {stats.length > 0 && (
        <View style={styles.chartArea}>
          {stats.map((day) => (
            <View key={day.date} style={styles.chartRow}>
              <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
                {day.date.slice(5)}
              </Text>
              <View style={styles.barsCol}>
                {[
                  { xp: day.physical_xp, color: '#FF6B35' },
                  { xp: day.knowledge_xp, color: '#4ECDC4' },
                  { xp: day.beauty_xp, color: '#FF8FAB' },
                ].map((bar, i) => (
                  <View
                    key={i}
                    style={[styles.barTrack, { backgroundColor: theme.border }]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(bar.xp / maxXp) * 100}%`,
                          backgroundColor: bar.color,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
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
                <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>
                  {l.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  statsRow: { flexDirection: 'row', marginBottom: 10 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '900' },
  statLabel: { fontSize: 11, marginTop: 2 },
  divider: { width: 1 },
  totalXp: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  chartArea: { gap: 6 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateLabel: { width: 32, fontSize: 10 },
  barsCol: { flex: 1, gap: 3 },
  barTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  legend: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { LevelType } from '../types';

interface Props {
  levelType: LevelType;
  level: number;
  title: string;
  currentXp: number;
  requiredXp: number;
  compact?: boolean;
}

const LEVEL_COLORS: Record<LevelType, string> = {
  physical: '#FF6B35',
  beauty: '#FF8FAB',
  knowledge: '#4ECDC4',
  comprehensive: '#FFD700',
};

const LEVEL_LABELS: Record<LevelType, string> = {
  physical: 'フィジカル',
  beauty: 'ビューティー',
  knowledge: 'ナレッジ',
  comprehensive: '総合',
};

export function LevelCard({ levelType, level, title, currentXp, requiredXp, compact }: Props) {
  const theme = useTheme();
  const color = LEVEL_COLORS[levelType];
  const progress = requiredXp > 0 ? Math.min(currentXp / requiredXp, 1) : 1;

  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.compactLabel, { color: theme.textSecondary }]}>{LEVEL_LABELS[levelType]}</Text>
        <Text style={[styles.compactLevel, { color }]}>Lv.{level}</Text>
        <View style={[styles.barBg, { backgroundColor: theme.border }]}>
          <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: color + '40' }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{LEVEL_LABELS[levelType]}</Text>
        <Text style={[styles.level, { color }]}>Lv.{level}</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <View style={[styles.barBg, { backgroundColor: theme.border }]}>
        <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.xpRow}>
        <Text style={[styles.xpText, { color: theme.textSecondary }]}>
          {currentXp.toLocaleString()} / {requiredXp.toLocaleString()} XP
        </Text>
        <Text style={[styles.xpText, { color }]}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: { fontSize: 12, fontWeight: '600' },
  level: { fontSize: 22, fontWeight: '800' },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  xpText: { fontSize: 11 },
  compact: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
  },
  compactLabel: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  compactLevel: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
});

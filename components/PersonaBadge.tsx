import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { BenchmarkPersona } from '../types';

interface Props {
  persona: BenchmarkPersona;
  userLevel: number;
  compact?: boolean;
}

export function PersonaBadge({ persona, userLevel, compact }: Props) {
  const theme = useTheme();
  const isAhead = userLevel >= persona.level;
  const accentColor = isAhead ? '#27AE60' : '#FF6B35';

  if (compact) {
    return (
      <View
        style={[
          styles.compact,
          { backgroundColor: theme.surface, borderColor: accentColor + '60' },
        ]}
      >
        <Text style={[styles.compactName, { color: theme.text }]}>{persona.display_name}</Text>
        <Text style={[styles.compactLevel, { color: accentColor }]}>Lv.{persona.level}</Text>
        <Text style={[styles.compactStatus, { color: accentColor }]}>
          {isAhead ? '超過✓' : '目標'}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: accentColor + '60' },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.archetype, { color: theme.textSecondary }]}>
            {persona.archetype}
          </Text>
          <Text style={[styles.name, { color: theme.text }]}>{persona.display_name}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {persona.description}
          </Text>
        </View>
        <View
          style={[
            styles.levelBadge,
            { backgroundColor: accentColor + '20', borderColor: accentColor },
          ]}
        >
          <Text style={[styles.levelBadgeText, { color: accentColor }]}>Lv.{persona.level}</Text>
          <Text style={[styles.statusText, { color: accentColor }]}>
            {isAhead ? '超過✓' : '目標'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1, marginRight: 12 },
  archetype: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  name: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  description: { fontSize: 12, lineHeight: 18 },
  levelBadge: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  levelBadgeText: { fontSize: 16, fontWeight: '900' },
  statusText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  compact: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 80,
  },
  compactName: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  compactLevel: { fontSize: 14, fontWeight: '900' },
  compactStatus: { fontSize: 10, fontWeight: '700', marginTop: 2 },
});

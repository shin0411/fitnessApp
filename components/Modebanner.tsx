import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Mode } from '../types';

interface Props {
  mode: Mode;
}

const MODE_CONFIG: Record<Mode, { emoji: string; label: string; color: string; bg: string }> = {
  normal: { emoji: '✅', label: 'グッドコンディション', color: '#27AE60', bg: '#27AE6020' },
  bad: { emoji: '📱', label: 'スマホ依存モード - XP×0.3', color: '#E74C3C', bg: '#E74C3C20' },
  rest: { emoji: '💤', label: '休息推奨 - XP×0.5', color: '#F39C12', bg: '#F39C1220' },
  saiyan: { emoji: '⚡', label: 'サイヤ人覚醒！XP×5', color: '#FFD700', bg: '#FFD70030' },
};

export function ModeBanner({ mode }: Props) {
  if (mode === 'normal') return null;
  const cfg = MODE_CONFIG[mode];

  return (
    <View style={[styles.banner, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
      <Text style={styles.emoji}>{cfg.emoji}</Text>
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 8,
  },
  emoji: { fontSize: 18 },
  label: { fontSize: 13, fontWeight: '700', flex: 1 },
});

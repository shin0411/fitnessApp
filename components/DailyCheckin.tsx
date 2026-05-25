import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const SLEEP_OPTIONS = [
  { label: '〤。4時間', hours: 3.5, emoji: '😵' },
  { label: '5〤6時間', hours: 5.5, emoji: '😴' },
  { label: '7〤8時間', hours: 7.5, emoji: '😊' },
  { label: '9時間〤', hours: 9.5, emoji: '😌' },
];

const SCREEN_OPTIONS = [
  { label: '〤2時間', hours: 1, emoji: '🌟' },
  { label: '2〤4時間', hours: 3, emoji: '👍' },
  { label: '4〤6時間', hours: 5, emoji: '⚠️' },
  { label: '6時間〤', hours: 7, emoji: '📱' },
];

interface Props {
  onSubmit: (sleepHours: number, screenTimeHours: number, activeMinutes: number) => void;
}

export function DailyCheckin({ onSubmit }: Props) {
  const theme = useTheme();
  const [sleep, setSleep] = useState<number | null>(null);
  const [screen, setScreen] = useState<number | null>(null);

  function handleSubmit() {
    if (sleep === null || screen === null) return;
    onSubmit(sleep, screen, 0);
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '40' }]}>
      <Text style={[styles.heading, { color: theme.text }]}>今日の記録 🌅</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>
        生活習慣を記録してモードを評価します
      </Text>

      <Text style={[styles.label, { color: theme.text }]}>昨夜の睡眠時間</Text>
      <View style={styles.optionRow}>
        {SLEEP_OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.hours}
            style={[
              styles.optionChip,
              {
                backgroundColor: sleep === o.hours ? theme.primary + '25' : theme.background,
                borderColor: sleep === o.hours ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setSleep(o.hours)}
          >
            <Text style={styles.optionEmoji}>{o.emoji}</Text>
            <Text style={[styles.optionText, { color: sleep === o.hours ? theme.primary : theme.textSecondary }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.text }]}>今日のスマホ使用時間</Text>
      <View style={styles.optionRow}>
        {SCREEN_OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.hours}
            style={[
              styles.optionChip,
              {
                backgroundColor: screen === o.hours ? theme.primary + '25' : theme.background,
                borderColor: screen === o.hours ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setScreen(o.hours)}
          >
            <Text style={styles.optionEmoji}>{o.emoji}</Text>
            <Text style={[styles.optionText, { color: screen === o.hours ? theme.primary : theme.textSecondary }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.submitBtn,
          {
            backgroundColor: sleep !== null && screen !== null ? theme.primary : theme.border,
          },
        ]}
        onPress={handleSubmit}
        disabled={sleep === null || screen === null}
      >
        <Text style={styles.submitText}>記録する</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 20 },
  heading: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  sub: { fontSize: 12, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  optionRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  optionChip: {
    flex: 1,
    minWidth: '22%',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  optionEmoji: { fontSize: 18, marginBottom: 2 },
  optionText: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  submitBtn: { height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface MacroRing {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit: string;
}

interface Props {
  calories: number;
  caloriesGoal: number;
  protein: number;
  proteinGoal: number;
  fat: number;
  fatGoal: number;
  carbs: number;
  carbsGoal: number;
}

function Ring({ label, value, goal, color, unit }: MacroRing) {
  const theme = useTheme();
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const size = 70;
  const stroke = 7;

  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ringBg, { width: size, height: size, borderRadius: size / 2, borderColor: theme.border, borderWidth: stroke }]}>
        <View style={[styles.ringFill, { borderColor: color, borderWidth: stroke, width: size, height: size, borderRadius: size / 2, opacity: pct }]} />
      </View>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringValue, { color }]}>{Math.round(value)}</Text>
        <Text style={[styles.ringUnit, { color: theme.textSecondary }]}>{unit}</Text>
      </View>
      <Text style={[styles.ringLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function MacroRings({ calories, caloriesGoal, protein, proteinGoal, fat, fatGoal, carbs, carbsGoal }: Props) {
  const theme = useTheme();
  const macros: MacroRing[] = [
    { label: 'カロリー', value: calories, goal: caloriesGoal, color: '#FF6B35', unit: 'kcal' },
    { label: 'タンパク質', value: protein, goal: proteinGoal, color: '#4ECDC4', unit: 'g' },
    { label: '脂質', value: fat, goal: fatGoal, color: '#FFD700', unit: 'g' },
    { label: '炭水化物', value: carbs, goal: carbsGoal, color: '#7B2FFF', unit: 'g' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>本日の栄養</Text>
      <View style={styles.row}>
        {macros.map((m) => (
          <Ring key={m.label} {...m} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  ringWrap: { alignItems: 'center' },
  ringBg: { justifyContent: 'center', alignItems: 'center' },
  ringFill: { position: 'absolute' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 0, bottom: 0, left: 0, right: 0 },
  ringValue: { fontSize: 14, fontWeight: '800' },
  ringUnit: { fontSize: 9 },
  ringLabel: { marginTop: 6, fontSize: 11 },
});

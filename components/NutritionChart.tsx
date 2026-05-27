import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface NutrientBar {
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
  fiber?: number;
  fiberGoal?: number;
  showTitle?: boolean;
}

function NutrientBar({ label, value, goal, color, unit }: NutrientBar) {
  const theme = useTheme();
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const overGoal = goal > 0 && value > goal;

  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${pct * 100}%`,
              backgroundColor: overGoal ? '#FF4560' : color,
            },
          ]}
        />
      </View>
      <Text style={[styles.barValue, { color: overGoal ? '#FF4560' : color }]}>
        {Math.round(value)}
        <Text style={[styles.barUnit, { color: theme.textSecondary }]}> / {Math.round(goal)} {unit}</Text>
      </Text>
    </View>
  );
}

export function NutritionChart({
  calories,
  caloriesGoal,
  protein,
  proteinGoal,
  fat,
  fatGoal,
  carbs,
  carbsGoal,
  fiber = 0,
  fiberGoal = 20,
  showTitle = true,
}: Props) {
  const theme = useTheme();

  const nutrients: NutrientBar[] = [
    { label: 'カロリー', value: calories, goal: caloriesGoal, color: '#FF6B35', unit: 'kcal' },
    { label: 'P タンパク', value: protein, goal: proteinGoal, color: '#4ECDC4', unit: 'g' },
    { label: 'F 脂質', value: fat, goal: fatGoal, color: '#FFD700', unit: 'g' },
    { label: 'C 炭水化', value: carbs, goal: carbsGoal, color: '#7B2FFF', unit: 'g' },
    { label: '食物繊維', value: fiber, goal: fiberGoal, color: '#27AE60', unit: 'g' },
  ];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {showTitle && (
        <Text style={[styles.title, { color: theme.text }]}>本日の栄養バランス</Text>
      )}
      {nutrients.map((n) => (
        <NutrientBar key={n.label} {...n} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: { width: 60, fontSize: 11, fontWeight: '600' },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { fontSize: 12, fontWeight: '700', width: 90, textAlign: 'right' },
  barUnit: { fontSize: 10, fontWeight: '400' },
});

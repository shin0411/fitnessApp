import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Exercise, WorkoutSet } from '../types';

interface Props {
  exercise: Exercise;
  sets: WorkoutSet[];
  isSelected?: boolean;
  onSelect?: (exercise: Exercise) => void;
  onAddSet?: () => void;
}

export function WorkoutCard({ exercise, sets, isSelected, onSelect, onAddSet }: Props) {
  const theme = useTheme();
  const totalVolume = sets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? theme.primary + '15' : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
      ]}
      onPress={() => onSelect?.(exercise)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: theme.text }]}>{exercise.name}</Text>
          {exercise.muscle_group ? (
            <Text style={[styles.muscle, { color: theme.textSecondary, backgroundColor: theme.border }]}>
              {exercise.muscle_group}
            </Text>
          ) : null}
        </View>
        {isSelected && onAddSet ? (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={onAddSet}
          >
            <Text style={styles.addBtnText}>+ セット</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {sets.length > 0 && (
        <View style={styles.setsContainer}>
          {sets.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.setRow,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.setNum, { color: theme.textSecondary }]}>Set {s.set_number}</Text>
              {s.weight != null && (
                <Text style={[styles.setVal, { color: theme.text }]}>{s.weight} kg</Text>
              )}
              {s.reps != null && (
                <Text style={[styles.setVal, { color: theme.text }]}>{s.reps} 回</Text>
              )}
              {s.is_personal_record && (
                <Text style={styles.prBadge}>PR</Text>
              )}
            </View>
          ))}
          {totalVolume > 0 && (
            <Text style={[styles.volume, { color: theme.textSecondary }]}>
              総ボリューム: {totalVolume.toLocaleString()} kg
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  muscle: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  setsContainer: { gap: 4 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  setNum: { fontSize: 12, width: 44 },
  setVal: { fontSize: 13, fontWeight: '600' },
  prBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
    backgroundColor: '#FFD70020',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  volume: { fontSize: 11, marginTop: 4, textAlign: 'right' },
});

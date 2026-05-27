import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  setNumber: number;
  onLog: (weight: number | null, reps: number | null) => void;
  disabled?: boolean;
  previousWeight?: number | null;
  previousReps?: number | null;
}

export function SetLogger({
  setNumber,
  onLog,
  disabled,
  previousWeight,
  previousReps,
}: Props) {
  const theme = useTheme();
  const [weight, setWeight] = useState(previousWeight?.toString() ?? '');
  const [reps, setReps] = useState(previousReps?.toString() ?? '');

  function handleLog() {
    const w = weight.trim() ? parseFloat(weight) : null;
    const r = reps.trim() ? parseInt(reps, 10) : null;
    onLog(w, r);
    setWeight('');
    setReps('');
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.setLabel, { color: theme.textSecondary }]}>
        Set {setNumber}
      </Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
        ]}
        placeholder="kg"
        placeholderTextColor={theme.textSecondary}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        editable={!disabled}
      />
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
        ]}
        placeholder="回数"
        placeholderTextColor={theme.textSecondary}
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        editable={!disabled}
      />
      <TouchableOpacity
        style={[
          styles.logBtn,
          { backgroundColor: theme.primary, opacity: disabled ? 0.5 : 1 },
        ]}
        onPress={handleLog}
        disabled={disabled}
      >
        <Text style={styles.logBtnText}>記録</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  setLabel: { fontSize: 12, width: 40, fontWeight: '600' },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  logBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
  },
  logBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

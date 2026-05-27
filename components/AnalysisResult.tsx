import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  analysisType: 'face' | 'body' | 'flexibility';
  scores: Record<string, number>;
  feedback: string;
  xpEarned: number;
  accentColor?: string;
}

const ANALYSIS_LABELS: Record<string, string> = {
  skin_condition: '肆の状態',
  symmetry: '左右対称性',
  vitality: '活力度',
  overall: '総合スコア',
  muscle_definition: '筋肉のカット',
  posture: '姿勢',
  body_balance: 'ボディバランス',
};

export function AnalysisResult({
  analysisType,
  scores,
  feedback,
  xpEarned,
  accentColor,
}: Props) {
  const theme = useTheme();
  const color = accentColor ?? theme.primary;
  const typeLabel =
    analysisType === 'face'
      ? '顔診断'
      : analysisType === 'body'
      ? '体型診断'
      : '柔軟性診断';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: color + '60' },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>{typeLabel}結果</Text>

      {Object.entries(scores).map(([key, val]) => (
        <View key={key} style={styles.scoreRow}>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
            {ANALYSIS_LABELS[key] ?? key}
          </Text>
          <View style={[styles.barBg, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.min(val, 100)}%`, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={[styles.scoreValue, { color }]}>{Math.round(val)}</Text>
        </View>
      ))}

      {feedback ? (
        <Text style={[styles.feedback, { color: theme.text }]}>{feedback}</Text>
      ) : null}

      <View style={[styles.xpPill, { backgroundColor: color + '20', borderColor: color }]}>
        <Text style={[styles.xpText, { color }]}>+{xpEarned} XP 獲得</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '800' },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: { width: 100, fontSize: 12 },
  barBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  scoreValue: { width: 30, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  feedback: { fontSize: 14, lineHeight: 22, marginTop: 4 },
  xpPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    marginTop: 4,
  },
  xpText: { fontSize: 14, fontWeight: '800' },
});

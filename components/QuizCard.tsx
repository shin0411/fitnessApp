import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { QuizQuestion } from '../types';

interface Props {
  question: QuizQuestion;
  selectedChoice: number | null;
  answered: boolean;
  timeLeft: number;
  timeLimitSeconds: number;
  combo: number;
  onChoiceSelect: (index: number) => void;
}

export function QuizCard({
  question,
  selectedChoice,
  answered,
  timeLeft,
  timeLimitSeconds,
  combo,
  onChoiceSelect,
}: Props) {
  const theme = useTheme();
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: timeLimitSeconds * 1000,
      useNativeDriver: false,
    }).start();
  }, [question.id]);

  const timerColor = timeLeft > 5 ? '#4ECDC4' : '#FF4560';

  return (
    <View style={styles.container}>
      {combo > 1 && (
        <Text style={[styles.combo, { color: '#FFD700' }]}>{combo} コンボ！</Text>
      )}

      <View style={styles.timerRow}>
        <View style={[styles.timerTrack, { backgroundColor: theme.border }]}>
          <Animated.View
            style={[
              styles.timerFill,
              {
                backgroundColor: timerColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
      </View>

      <View
        style={[
          styles.questionCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.questionText, { color: theme.text }]}>
          {question.question_text}
        </Text>
      </View>

      {question.choices.map((choice, idx) => {
        let bg = theme.surface;
        let border = theme.border;
        if (answered) {
          if (idx === question.correct_index) {
            bg = '#4ECDC420';
            border = '#4ECDC4';
          } else if (idx === selectedChoice) {
            bg = '#FF456020';
            border = '#FF4560';
          }
        } else if (selectedChoice === idx) {
          bg = '#4ECDC420';
          border = '#4ECDC4';
        }
        return (
          <TouchableOpacity
            key={idx}
            style={[styles.choiceBtn, { backgroundColor: bg, borderColor: border }]}
            onPress={() => onChoiceSelect(idx)}
            disabled={answered}
          >
            <Text style={[styles.choiceText, { color: theme.text }]}>{choice}</Text>
          </TouchableOpacity>
        );
      })}

      {answered && question.explanation ? (
        <View
          style={[
            styles.explanationCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.explanationText, { color: theme.textSecondary }]}>
            {question.explanation}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  combo: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 3 },
  timerText: { fontSize: 14, fontWeight: '700', width: 32, textAlign: 'right' },
  questionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  questionText: { fontSize: 17, fontWeight: '600', lineHeight: 26 },
  choiceBtn: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  choiceText: { fontSize: 15 },
  explanationCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  explanationText: { fontSize: 13, lineHeight: 20 },
});

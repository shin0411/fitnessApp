import React, { useEffect } from 'react';
import { Modal, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { LevelType } from '../types';

const AXIS_CONFIG: Record<LevelType, { color: string; emoji: string; label: string }> = {
  physical: { color: '#FF6B35', emoji: '💪', label: 'フィジカル' },
  beauty: { color: '#FF8FAB', emoji: '✨', label: 'ビューティー' },
  knowledge: { color: '#4ECDC4', emoji: '🧠', label: 'ナレッジ' },
  comprehensive: { color: '#FFD700', emoji: '🔥', label: '総合' },
};

interface Props {
  visible: boolean;
  levelType: LevelType;
  newLevel: number;
  newTitle: string;
  xpGained: number;
  onHide: () => void;
}

export function LevelUpModal({ visible, levelType, newLevel, newTitle, xpGained, onHide }: Props) {
  const theme = useTheme();
  const { color, emoji, label } = AXIS_CONFIG[levelType];

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.5);
  const cardOpacity = useSharedValue(0);
  const numberScale = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    backdropOpacity.value = withTiming(1, { duration: 200 });
    cardScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    cardOpacity.value = withTiming(1, { duration: 200 });
    numberScale.value = withDelay(
      150,
      withSequence(
        withSpring(1.4, { damping: 6, stiffness: 250 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      )
    );
    const t = setTimeout(() => {
      backdropOpacity.value = withTiming(0, { duration: 250 });
      cardOpacity.value = withTiming(0, { duration: 250 }, () => runOnJS(onHide)());
      cardScale.value = withTiming(0.85, { duration: 250 });
    }, 2800);
    return () => clearTimeout(t);
  }, [visible]);

  function dismiss() {
    backdropOpacity.value = withTiming(0, { duration: 250 });
    cardOpacity.value = withTiming(0, { duration: 250 }, () => runOnJS(onHide)());
    cardScale.value = withTiming(0.85, { duration: 250 });
  }

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));
  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="none">
      <TouchableOpacity style={styles.root} activeOpacity={1} onPress={dismiss}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
        <Animated.View
          style={[styles.card, { backgroundColor: theme.surface, borderColor: color }, cardStyle]}
        >
          <Text style={styles.bigEmoji}>{emoji}</Text>
          <Text style={[styles.levelUpLabel, { color }]}>LEVEL UP!</Text>
          <Text style={[styles.axisLabel, { color: theme.textSecondary }]}>{label}</Text>
          <Animated.Text style={[styles.levelNumber, { color }, numberStyle]}>
            Lv.{newLevel}
          </Animated.Text>
          <Text style={[styles.newTitle, { color: theme.text }]}>{newTitle}</Text>
          <Animated.View style={[styles.xpPill, { backgroundColor: color + '25', borderColor: color }]}>
            <Text style={[styles.xpText, { color }]}>+{xpGained} XP</Text>
          </Animated.View>
          <Text style={[styles.tapHint, { color: theme.textSecondary }]}>タップで閉じる</Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  card: {
    width: 280,
    borderRadius: 28,
    borderWidth: 2,
    padding: 28,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  bigEmoji: { fontSize: 52, marginBottom: 2 },
  levelUpLabel: { fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  axisLabel: { fontSize: 12, fontWeight: '600' },
  levelNumber: { fontSize: 64, fontWeight: '900', lineHeight: 72 },
  newTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  xpPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, marginTop: 6 },
  xpText: { fontSize: 15, fontWeight: '800' },
  tapHint: { fontSize: 11, marginTop: 8 },
});

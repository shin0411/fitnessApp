import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  visible: boolean;
  message: string;
  xpGained?: number;
  onHide?: () => void;
}

export function AchievementToast({ visible, message, xpGained, onHide }: Props) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 40, duration: 400, useNativeDriver: true }),
          ]).start(() => onHide?.());
        }, 2200);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: theme.surface, borderColor: theme.xpColor, opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.icon}>🏆</Text>
      <View>
        <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
        {xpGained ? (
          <Text style={[styles.xp, { color: theme.xpColor }]}>+{xpGained} XP</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  icon: { fontSize: 24 },
  message: { fontSize: 14, fontWeight: '600' },
  xp: { fontSize: 13, fontWeight: '800', marginTop: 2 },
});

import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Modal, View } from 'react-native';

interface Props {
  visible: boolean;
  onHide: () => void;
}

export function SaiyanBurst({ visible, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.08, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 0.97, duration: 500, useNativeDriver: true }),
        ]),
        { iterations: 4 }
      ).start();
    });

    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => onHide());
    }, 3800);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="none">
      <Animated.View style={[styles.root, { opacity }]}>
        <Animated.View style={[styles.content, { transform: [{ scale }, { scale: pulseScale }] }]}>
          <Text style={styles.bolt}>⚡</Text>
          <Text style={styles.title}>サイヤ人覚醒！</Text>
          <Text style={styles.subtitle}>SAIYAN MODE UNLOCKED</Text>
          <View style={styles.multiplierBadge}>
            <Text style={styles.multiplierText}>XP ×5.0</Text>
          </View>
          <Text style={styles.desc}>24時間限定！全XPが5倍に！</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', gap: 8 },
  bolt: { fontSize: 72 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 2,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: { fontSize: 13, fontWeight: '700', color: '#FFA500', letterSpacing: 3 },
  multiplierBadge: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: '#FFD70030',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  multiplierText: { fontSize: 28, fontWeight: '900', color: '#FFD700' },
  desc: { marginTop: 8, fontSize: 14, color: '#FFF3B0', fontWeight: '600' },
});

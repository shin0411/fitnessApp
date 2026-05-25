import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { Achievement } from '../types';

const AXIS_COLOR: Record<string, string> = {
  physical: '#FF6B35',
  beauty: '#FF8FAB',
  knowledge: '#4ECDC4',
  comprehensive: '#FFD700',
  social: '#A78BFA',
};

export default function AchievementsScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAchievements();
  }, [profile?.id]);

  async function loadAchievements() {
    const [achRes, earnedRes] = await Promise.all([
      supabase.from('achievements').select('*').order('category'),
      profile?.id
        ? supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', profile.id)
        : Promise.resolve({ data: [] as { achievement_id: string }[] }),
    ]);
    if (achRes.data) setAchievements(achRes.data as Achievement[]);
    if (earnedRes.data) {
      setEarned(new Set(earnedRes.data.map((e) => e.achievement_id)));
    }
  }

  const categories = [...new Set(achievements.map((a) => a.category))];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: theme.primary }]}>← 戻る</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>実績</Text>
      <Text style={[styles.summary, { color: theme.textSecondary }]}>
        {earned.size} / {achievements.length} 解除
      </Text>

      {categories.map((cat) => (
        <View key={cat}>
          <Text style={[styles.catTitle, { color: theme.text }]}>{cat}</Text>
          <View style={styles.grid}>
            {achievements
              .filter((a) => a.category === cat)
              .map((a) => {
                const isEarned = earned.has(a.id);
                const color = AXIS_COLOR[a.level_type] ?? theme.primary;
                return (
                  <View
                    key={a.id}
                    style={[
                      styles.achCard,
                      {
                        backgroundColor: isEarned ? color + '18' : theme.surface,
                        borderColor: isEarned ? color : theme.border,
                        opacity: isEarned ? 1 : 0.55,
                      },
                    ]}
                  >
                    <Text style={styles.achIcon}>{a.icon}</Text>
                    <Text
                      style={[styles.achName, { color: isEarned ? color : theme.textSecondary }]}
                      numberOfLines={2}
                    >
                      {a.name}
                    </Text>
                    <Text
                      style={[styles.achDesc, { color: theme.textSecondary }]}
                      numberOfLines={3}
                    >
                      {a.description}
                    </Text>
                    {isEarned ? (
                      <Text style={[styles.achXp, { color }]}>+{a.xp_reward} XP</Text>
                    ) : (
                      <Text style={[styles.achLocked, { color: theme.textSecondary }]}>🔒</Text>
                    )}
                  </View>
                );
              })}
          </View>
        </View>
      ))}

      {achievements.length === 0 && (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>実績を読み込み中...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  summary: { fontSize: 14, marginBottom: 20 },
  catTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  achCard: { width: '47%', padding: 12, borderRadius: 14, borderWidth: 1.5 },
  achIcon: { fontSize: 28, marginBottom: 6 },
  achName: { fontSize: 13, fontWeight: '700', marginBottom: 4, lineHeight: 18 },
  achDesc: { fontSize: 11, lineHeight: 16, marginBottom: 6 },
  achXp: { fontSize: 12, fontWeight: '700' },
  achLocked: { fontSize: 14 },
  empty: { fontSize: 14, textAlign: 'center', paddingTop: 40 },
});

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useLevels } from '../../hooks/useLevels';
import { LevelCard } from '../../components/LevelCard';
import { ModeBanner } from '../../components/Modebanner';
import { xpToNextLevel } from '../../modules/levels/xp';

export default function DashboardScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const currentMode = useUserStore((s) => s.currentMode);
  const { levels } = useLevels();
  const [refreshing, setRefreshing] = useState(false);

  const comprehensive = levels['comprehensive'];
  const compProgress = comprehensive ? xpToNextLevel(comprehensive.total_xp) : null;

  async function onRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>こんにちは</Text>
        <Text style={[styles.username, { color: theme.text }]}>{profile?.username ?? 'トレーナー'}</Text>
      </View>

      <ModeBanner mode={currentMode} />

      {comprehensive && compProgress && (
        <View style={[styles.compCard, { backgroundColor: theme.surface, borderColor: '#FFD700' + '50' }]}>
          <Text style={[styles.compLabel, { color: theme.textSecondary }]}>総合レベル</Text>
          <Text style={[styles.compLevel, { color: '#FFD700' }]}>Lv.{comprehensive.level}</Text>
          <Text style={[styles.compTitle, { color: theme.text }]}>{comprehensive.current_title}</Text>
          <View style={[styles.compBarBg, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.compBarFill,
                {
                  backgroundColor: '#FFD700',
                  width: compProgress.required > 0 ? `${Math.min((compProgress.current / compProgress.required) * 100, 100)}%` : '100%',
                },
              ]}
            />
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>軸別レベル</Text>
      <View style={styles.compactRow}>
        {(['physical', 'beauty', 'knowledge'] as const).map((lt) => {
          const lv = levels[lt];
          if (!lv) return null;
          const prog = xpToNextLevel(lv.total_xp);
          return (
            <LevelCard
              key={lt}
              levelType={lt}
              level={lv.level}
              title={lv.current_title}
              currentXp={prog.current}
              requiredXp={prog.required}
              compact
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 56 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 14 },
  username: { fontSize: 26, fontWeight: '900' },
  compCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 20,
    alignItems: 'center',
  },
  compLabel: { fontSize: 13, fontWeight: '600' },
  compLevel: { fontSize: 52, fontWeight: '900', lineHeight: 60 },
  compTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  compBarBg: { height: 10, borderRadius: 5, overflow: 'hidden', width: '100%' },
  compBarFill: { height: '100%', borderRadius: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  compactRow: { flexDirection: 'row', marginHorizontal: -4 },
});

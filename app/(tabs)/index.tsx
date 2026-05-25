import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useLevels } from '../../hooks/useLevels';
import { useQuests } from '../../hooks/useQuests';
import { useDailyActivity } from '../../hooks/useDailyActivity';
import { LevelCard } from '../../components/LevelCard';
import { ModeBanner } from '../../components/Modebanner';
import { QuestList } from '../../components/QuestList';
import { DailyCheckin } from '../../components/DailyCheckin';
import { AchievementToast } from '../../components/AchievementToast';
import { xpToNextLevel } from '../../modules/levels/xp';
import { DAILY_QUESTS } from '../../modules/quests/definitions';
import { supabase } from '../../lib/supabase';
import { Quest } from '../../types';

const DAILY_QUESTS_WITH_EXPIRES: Quest[] = DAILY_QUESTS.map((q) => ({
  ...q,
  expires_at: null,
}));

export default function DashboardScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const currentMode = useUserStore((s) => s.currentMode);
  const { levels, addXp } = useLevels();
  const { progressMap, loadProgress, incrementQuest } = useQuests();
  const { checkinDone, loadTodayActivity, submitCheckin } = useDailyActivity();
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', xp: 0 });

  useEffect(() => {
    loadProgress();
    loadTodayActivity();
  }, [loadProgress, loadTodayActivity]);

  const comprehensive = levels['comprehensive'];
  const compProgress = comprehensive ? xpToNextLevel(comprehensive.total_xp) : null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProgress(), loadTodayActivity()]);
    setRefreshing(false);
  }, [loadProgress, loadTodayActivity]);

  async function handleCheckin(sleepHours: number, screenTimeHours: number, activeMinutes: number) {
    await submitCheckin(sleepHours, screenTimeHours, activeMinutes);
  }

  async function logBeautyCare() {
    if (!profile?.id) return;
    const { error } = await supabase.from('beauty_care_logs').insert({
      user_id: profile.id,
      care_type: 'skincare',
      xp_earned: 30,
      details: { source: 'quick_log' },
    });
    if (error) { Alert.alert('エラー', '記録に失敗しました'); return; }
    const { leveledUp, newLevel } = await addXp('beauty', 30);
    await incrementQuest('daily_beauty_care');
    setToast({
      visible: true,
      message: leveledUp ? `ビューティー Lv.${newLevel}！` : 'スキンケア記録！',
      xp: 30,
    });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>こんにちは</Text>
        <Text style={[styles.username, { color: theme.text }]}>
          {profile?.username ?? 'トレーナー'}
        </Text>
      </View>

      <ModeBanner mode={currentMode} />

      {!checkinDone && <DailyCheckin onSubmit={handleCheckin} />}

      {comprehensive && compProgress && (
        <View
          style={[styles.compCard, { backgroundColor: theme.surface, borderColor: '#FFD700' + '50' }]}
        >
          <Text style={[styles.compLabel, { color: theme.textSecondary }]}>総合レベル</Text>
          <Text style={[styles.compLevel, { color: '#FFD700' }]}>Lv.{comprehensive.level}</Text>
          <Text style={[styles.compTitle, { color: theme.text }]}>{comprehensive.current_title}</Text>
          <View style={[styles.compBarBg, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.compBarFill,
                {
                  backgroundColor: '#FFD700',
                  width:
                    compProgress.required > 0
                      ? `${Math.min((compProgress.current / compProgress.required) * 100, 100)}%`
                      : '100%',
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

      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: '#FF8FAB20', borderColor: '#FF8FAB' }]}
          onPress={logBeautyCare}
        >
          <Text style={[styles.quickBtnText, { color: '#FF8FAB' }]}>💄 スキンケア</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.push('/progress')}
        >
          <Text style={[styles.quickBtnText, { color: theme.text }]}>📈 成長グラフ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.push('/achievements')}
        >
          <Text style={[styles.quickBtnText, { color: theme.text }]}>🏆 実績</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.push('/ranking')}
        >
          <Text style={[styles.quickBtnText, { color: theme.text }]}>🌍 ランキング</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.push('/guild')}
        >
          <Text style={[styles.quickBtnText, { color: theme.text }]}>⚔️ ギルド</Text>
        </TouchableOpacity>
      </View>

      <QuestList
        quests={DAILY_QUESTS_WITH_EXPIRES}
        progressMap={progressMap}
      />

      <AchievementToast
        visible={toast.visible}
        message={toast.message}
        xpGained={toast.xp}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
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
  compactRow: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 16 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickBtn: {
    width: '30%',
    flexGrow: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBtnText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});

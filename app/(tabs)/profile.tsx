import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useThemeStore } from '../../store/themeStore';
import { useLevels } from '../../hooks/useLevels';
import { supabase } from '../../lib/supabase';
import { ThemeName } from '../../types';

const THEMES: { id: ThemeName; label: string; desc: string }[] = [
  { id: 'simple', label: 'シンプル', desc: 'ホワイト・ミニマル' },
  { id: 'cool', label: 'クール', desc: 'ダーク・ネオン' },
  { id: 'kawaii', label: 'かわいい', desc: 'ピンク・パステル' },
  { id: 'beautiful', label: 'ビューティー', desc: 'ゴールド・エレガント' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const profileDetails = useUserStore((s) => s.profileDetails);
  const { levels } = useLevels();
  const { themeName, setTheme } = useThemeStore();

  async function handleLogout() {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  async function shareInviteCode() {
    if (!profile?.invite_code) return;
    await Share.share({
      message: `FitnessRPGで一緒に鍛えよう！私の招待コードは「${profile.invite_code}」です。登録時に入力すると双方に+500 XPがもらえます！`,
    });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
    >
      <Text style={[styles.title, { color: theme.text }]}>プロフィール</Text>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.username, { color: theme.text }]}>{profile?.username ?? '---'}</Text>
        {profileDetails?.mbti && (
          <Text style={[styles.mbti, { color: theme.primary }]}>{profileDetails.mbti}</Text>
        )}
        {profileDetails?.height_cm && profileDetails?.weight_kg && (
          <Text style={[styles.bodyInfo, { color: theme.textSecondary }]}>
            {profileDetails.height_cm}cm / {profileDetails.weight_kg}kg
          </Text>
        )}
        {profile?.invite_code && (
          <TouchableOpacity
            style={[styles.inviteRow, { backgroundColor: theme.primary + '20' }]}
            onPress={shareInviteCode}
          >
            <Text style={[styles.inviteLabel, { color: theme.textSecondary }]}>招待コード</Text>
            <Text style={[styles.inviteCode, { color: theme.primary }]}>{profile.invite_code}</Text>
            <Text style={[styles.inviteShare, { color: theme.primary }]}>シェア →</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>全レベル</Text>
      {(['physical', 'beauty', 'knowledge', 'comprehensive'] as const).map((lt) => {
        const lv = levels[lt];
        if (!lv) return null;
        return (
          <View key={lt} style={[styles.levelRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.levelType, { color: theme.textSecondary }]}>
              {lt === 'physical' ? 'フィジカル' : lt === 'beauty' ? 'ビューティー' : lt === 'knowledge' ? 'ナレッジ' : '総合'}
            </Text>
            <Text style={[styles.levelNum, { color: theme.primary }]}>Lv.{lv.level}</Text>
            <Text style={[styles.levelTitle, { color: theme.text }]}>{lv.current_title}</Text>
          </View>
        );
      })}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>テーマ</Text>
      {THEMES.map((t) => (
        <TouchableOpacity
          key={t.id}
          style={[styles.themeRow, { backgroundColor: theme.surface, borderColor: themeName === t.id ? theme.primary : theme.border }]}
          onPress={() => setTheme(t.id)}
        >
          <View>
            <Text style={[styles.themeLabel, { color: theme.text }]}>{t.label}</Text>
            <Text style={[styles.themeDesc, { color: theme.textSecondary }]}>{t.desc}</Text>
          </View>
          {themeName === t.id && <Text style={{ color: theme.primary }}>✓</Text>}
        </TouchableOpacity>
      ))}

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.push('/progress')}
        >
          <Text style={[styles.navBtnText, { color: theme.text }]}>📈 成長グラフ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.push('/achievements')}
        >
          <Text style={[styles.navBtnText, { color: theme.text }]}>🏆 実績一覧</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.editBtn, { borderColor: theme.border }]}
        onPress={() => router.push('/goal-setup')}
      >
        <Text style={[styles.editBtnText, { color: theme.text }]}>プロフィールを編集</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.logoutBtn, { borderColor: theme.error }]} onPress={handleLogout}>
        <Text style={[styles.logoutBtnText, { color: theme.error }]}>ログアウト</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
  card: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  username: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  mbti: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  bodyInfo: { fontSize: 14, marginBottom: 12 },
  inviteRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 8 },
  inviteLabel: { fontSize: 12 },
  inviteCode: { fontSize: 16, fontWeight: '800', flex: 1 },
  inviteShare: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  levelRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  levelType: { width: 80, fontSize: 12, fontWeight: '600' },
  levelNum: { fontSize: 18, fontWeight: '800', width: 60 },
  levelTitle: { flex: 1, fontSize: 13 },
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  themeLabel: { fontSize: 14, fontWeight: '700' },
  themeDesc: { fontSize: 12, marginTop: 2 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 10 },
  navBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  navBtnText: { fontSize: 13, fontWeight: '700' },
  editBtn: { height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  editBtnText: { fontSize: 15, fontWeight: '600' },
  logoutBtn: { height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  logoutBtnText: { fontSize: 15, fontWeight: '600' },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useThemeStore } from '../store/themeStore';
import { ThemeName } from '../types';
import { kawaii } from '../theme/themes/kawaii';
import { cool } from '../theme/themes/cool';
import { beautiful } from '../theme/themes/beautiful';
import { simple } from '../theme/themes/simple';

const THEMES: { name: ThemeName; label: string; description: string; colors: typeof simple }[] = [
  { name: 'simple', label: 'Simple', description: 'ミニマル・ホワイト基調', colors: simple },
  { name: 'kawaii', label: 'Kawaii', description: 'ピンク・パステル・ふんわり', colors: kawaii },
  { name: 'cool', label: 'Cool', description: 'ダーク・ネオン・シャープ', colors: cool },
  { name: 'beautiful', label: 'Beautiful', description: 'ゴールド・エレガント', colors: beautiful },
];

export default function ThemeSettingsScreen() {
  const theme = useTheme();
  const { themeName, setTheme } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.primary }]}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>テーマ設定</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {THEMES.map((t) => {
          const isSelected = themeName === t.name;
          return (
            <TouchableOpacity
              key={t.name}
              style={[
                styles.card,
                { backgroundColor: t.colors.surface, borderColor: isSelected ? t.colors.primary : t.colors.border, borderWidth: isSelected ? 2 : 1 },
              ]}
              onPress={() => setTheme(t.name)}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: t.colors.text }]}>{t.label}</Text>
                {isSelected && (
                  <Text style={[styles.checkmark, { color: t.colors.primary }]}>✓ 選択中</Text>
                )}
              </View>
              <Text style={[styles.cardDesc, { color: t.colors.textSecondary }]}>{t.description}</Text>
              <View style={styles.swatchRow}>
                <View style={[styles.swatch, { backgroundColor: t.colors.primary }]} />
                <View style={[styles.swatch, { backgroundColor: t.colors.secondary }]} />
                <View style={[styles.swatch, { backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border }]} />
                <View style={[styles.swatch, { backgroundColor: t.colors.xpColor }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  back: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  list: { padding: 20, paddingTop: 8, gap: 12 },
  card: { borderRadius: 16, padding: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 20, fontWeight: '700' },
  checkmark: { fontSize: 13, fontWeight: '700' },
  cardDesc: { fontSize: 13, marginBottom: 12 },
  swatchRow: { flexDirection: 'row', gap: 8 },
  swatch: { width: 28, height: 28, borderRadius: 8 },
});

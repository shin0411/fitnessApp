import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useLevels } from '../../hooks/useLevels';
import { supabase } from '../../lib/supabase';
import { callClaude } from '../../lib/claude';
import { FACE_ANALYSIS_PROMPT, BODY_ANALYSIS_PROMPT } from '../../lib/prompts/nutrition';
import { AchievementToast } from '../../components/AchievementToast';

const ANALYSIS_TYPES = [
  { id: 'face', label: '顔診断', prompt: FACE_ANALYSIS_PROMPT, color: '#FF8FAB', description: '肌状態・左右対称性・活力をAIが分析' },
  { id: 'body', label: '体型診断', prompt: BODY_ANALYSIS_PROMPT, color: '#FF6B35', description: '筋肉のカット・姿勢・バランスをAIが評価' },
];

export default function AnalyzeScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const { addXp } = useLevels();

  const [analysisType, setAnalysisType] = useState<'face' | 'body'>('face');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ scores: Record<string, number>; feedback: string; xp: number } | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', xp: 0 });

  const currentType = ANALYSIS_TYPES.find((t) => t.id === analysisType)!;

  async function pickAndAnalyze() {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!picked.canceled && picked.assets[0]) {
      await analyze(picked.assets[0].uri, picked.assets[0].base64 ?? '');
    }
  }

  async function cameraAndAnalyze() {
    const picked = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });
    if (!picked.canceled && picked.assets[0]) {
      await analyze(picked.assets[0].uri, picked.assets[0].base64 ?? '');
    }
  }

  async function analyze(uri: string, base64: string) {
    setImageUri(uri);
    setResult(null);
    setAnalyzing(true);
    try {
      const response = await callClaude(currentType.prompt, base64);
      const parsed = JSON.parse(response);
      const xp = parsed[analysisType === 'face' ? 'beauty_xp' : 'physical_xp'] ?? 50;
      setResult({ scores: parsed.scores ?? {}, feedback: parsed.feedback ?? '', xp });

      if (profile?.id) {
        await supabase.from('photo_analyses').insert({
          user_id: profile.id,
          analysis_type: analysisType,
          ai_response: parsed,
          scores: parsed.scores ?? {},
          xp_earned: xp,
          feedback: parsed.feedback ?? '',
          is_peer_review: false,
        });

        const levelType = analysisType === 'face' ? 'beauty' : 'physical';
        const { leveledUp, newLevel } = await addXp(levelType, xp);
        setToast({
          visible: true,
          message: leveledUp ? `Lv.${newLevel} にレベルアップ！` : 'AI診断完了！',
          xp,
        });
      }
    } catch (e) {
      Alert.alert('AI解析エラー', 'もう一度お試しください');
    }
    setAnalyzing(false);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
    >
      <Text style={[styles.title, { color: theme.text }]}>AI写真診断</Text>

      <View style={styles.typeRow}>
        {ANALYSIS_TYPES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.typeCard,
              {
                backgroundColor: analysisType === t.id ? t.color + '20' : theme.surface,
                borderColor: analysisType === t.id ? t.color : theme.border,
              },
            ]}
            onPress={() => { setAnalysisType(t.id as 'face' | 'body'); setResult(null); setImageUri(null); }}
          >
            <Text style={[styles.typeLabel, { color: analysisType === t.id ? t.color : theme.text }]}>{t.label}</Text>
            <Text style={[styles.typeDesc, { color: theme.textSecondary }]}>{t.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.cameraRow}>
        <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: currentType.color }]} onPress={cameraAndAnalyze}>
          <Text style={styles.cameraBtnText}>📷 撮影して診断</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]} onPress={pickAndAnalyze}>
          <Text style={[styles.cameraBtnText, { color: theme.text }]}>🖼 ライブラリから</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      )}

      {analyzing && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={currentType.color} size="large" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>AIが分析中...</Text>
        </View>
      )}

      {result && (
        <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: currentType.color + '60' }]}>
          <Text style={[styles.resultTitle, { color: theme.text }]}>診断結果</Text>
          {Object.entries(result.scores).map(([key, val]) => (
            <View key={key} style={styles.scoreRow}>
              <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>{key}</Text>
              <View style={[styles.scoreBarBg, { backgroundColor: theme.border }]}>
                <View style={[styles.scoreBarFill, { width: `${val}%`, backgroundColor: currentType.color }]} />
              </View>
              <Text style={[styles.scoreValue, { color: currentType.color }]}>{val}</Text>
            </View>
          ))}
          <Text style={[styles.feedback, { color: theme.text }]}>{result.feedback}</Text>
          <Text style={[styles.xpGained, { color: theme.xpColor }]}>+{result.xp} XP 獲得</Text>
        </View>
      )}

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
  title: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  typeLabel: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  typeDesc: { fontSize: 11, lineHeight: 16 },
  cameraRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  cameraBtn: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cameraBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  preview: { width: '100%', height: 260, borderRadius: 16, marginBottom: 16 },
  loadingRow: { alignItems: 'center', padding: 24, gap: 12 },
  loadingText: { fontSize: 14 },
  resultCard: { padding: 20, borderRadius: 18, borderWidth: 1.5 },
  resultTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  scoreLabel: { width: 100, fontSize: 12 },
  scoreBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  scoreValue: { width: 30, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  feedback: { fontSize: 14, lineHeight: 22, marginTop: 14, marginBottom: 8 },
  xpGained: { fontSize: 16, fontWeight: '800' },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { NUTRITION_ANALYSIS_PROMPT } from '../../lib/prompts/nutrition';
import { MacroRings } from '../../components/MacroRings';
import { AchievementToast } from '../../components/AchievementToast';
import { MealLog, FoodItem, NutritionData, MealType } from '../../types';

const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: '朝食' },
  { id: 'lunch', label: '昼食' },
  { id: 'dinner', label: '夕食' },
  { id: 'snack', label: '間食' },
];

const DEFAULT_GOALS = {
  calories_kcal: 2000,
  protein_g: 120,
  fat_g: 60,
  carbs_g: 250,
  fiber_g: 20,
};

export default function NutritionScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const { addXp } = useLevels();

  const [todayLogs, setTodayLogs] = useState<MealLog[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [aiItems, setAiItems] = useState<FoodItem[]>([]);
  const [uncertainItems, setUncertainItems] = useState<string[]>([]);
  const [aiAdvice, setAiAdvice] = useState('');
  const [manualItem, setManualItem] = useState('');
  const [manualItems, setManualItems] = useState<FoodItem[]>([]);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', xp: 0 });

  useEffect(() => {
    loadTodayLogs();
  }, []);

  async function loadTodayLogs() {
    if (!profile?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', profile.id)
      .gte('logged_at', `${today}T00:00:00`)
      .order('logged_at', { ascending: true });
    if (data) setTodayLogs(data as MealLog[]);
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      await analyzeImage(result.assets[0].base64 ?? '');
    }
  }

  async function takePhoto() {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      await analyzeImage(result.assets[0].base64 ?? '');
    }
  }

  async function analyzeImage(base64: string) {
    if (!base64) return;
    setAnalyzing(true);
    setAiItems([]);
    setNutrition(null);
    try {
      const response = await callClaude(NUTRITION_ANALYSIS_PROMPT, base64);
      const parsed = JSON.parse(response);
      setAiItems(parsed.items ?? []);
      setUncertainItems(parsed.uncertain_items ?? []);
      setNutrition(parsed.nutrition_estimate ?? null);
      setAiAdvice(parsed.advice ?? '');
    } catch (e) {
      Alert.alert('AI解析エラー', 'もう一度お試しください');
    }
    setAnalyzing(false);
  }

  function addManualItem() {
    const parts = manualItem.trim().split(/\s+/);
    const name = parts.slice(0, -1).join(' ') || manualItem.trim();
    const gramsStr = parts[parts.length - 1];
    const quantity_g = parseFloat(gramsStr) || 100;
    if (!name) return;
    setManualItems([...manualItems, { name, quantity_g }]);
    setManualItem('');
  }

  async function saveMealLog() {
    if (!profile?.id || !nutrition) return;
    setSaving(true);

    const xpEarned =
      30 + (nutrition.protein_g >= 25 ? 30 : 0) + (manualItems.length > 0 ? 10 : 0);

    await supabase.from('meal_logs').insert({
      user_id: profile.id,
      meal_type: selectedMealType,
      ai_recognized_items: aiItems,
      user_added_items: manualItems,
      final_nutrition: nutrition,
      physical_xp_earned: xpEarned,
    });

    const { leveledUp, newLevel } = await addXp('physical', xpEarned);
    await loadTodayLogs();

    setImageUri(null);
    setAiItems([]);
    setManualItems([]);
    setNutrition(null);
    setAiAdvice('');
    setSaving(false);
    setToast({
      visible: true,
      message: leveledUp ? `フィジカル Lv.${newLevel}！` : '食事を記録しました',
      xp: xpEarned,
    });
  }

  const totalNutrition = todayLogs.reduce(
    (acc, log) => {
      const n = log.final_nutrition;
      return {
        calories: acc.calories + (n?.calories ?? 0),
        protein_g: acc.protein_g + (n?.protein_g ?? 0),
        fat_g: acc.fat_g + (n?.fat_g ?? 0),
        carbs_g: acc.carbs_g + (n?.carbs_g ?? 0),
        fiber_g: acc.fiber_g + (n?.fiber_g ?? 0),
      };
    },
    { calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0, fiber_g: 0 }
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
    >
      <Text style={[styles.title, { color: theme.text }]}>食事・栄養管理</Text>

      <MacroRings
        calories={totalNutrition.calories}
        caloriesGoal={DEFAULT_GOALS.calories_kcal}
        protein={totalNutrition.protein_g}
        proteinGoal={DEFAULT_GOALS.protein_g}
        fat={totalNutrition.fat_g}
        fatGoal={DEFAULT_GOALS.fat_g}
        carbs={totalNutrition.carbs_g}
        carbsGoal={DEFAULT_GOALS.carbs_g}
      />

      <Text style={[styles.sectionTitle, { color: theme.text }]}>食事を記録する</Text>
      <View style={styles.mealTypeRow}>
        {MEAL_TYPES.map((mt) => (
          <TouchableOpacity
            key={mt.id}
            style={[styles.mealChip, { borderColor: selectedMealType === mt.id ? theme.primary : theme.border, backgroundColor: selectedMealType === mt.id ? theme.primary + '20' : theme.surface }]}
            onPress={() => setSelectedMealType(mt.id)}
          >
            <Text style={[styles.mealChipText, { color: selectedMealType === mt.id ? theme.primary : theme.textSecondary }]}>{mt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.cameraRow}>
        <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: theme.primary }]} onPress={takePhoto}>
          <Text style={styles.cameraBtnText}>📷 写真を撮る</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]} onPress={pickImage}>
          <Text style={[styles.cameraBtnText, { color: theme.text }]}>🖼 ライブラリ</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      )}

      {analyzing && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>AI解析中...</Text>
        </View>
      )}

      {aiItems.length > 0 && (
        <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.resultTitle, { color: theme.text }]}>AI認識結果</Text>
          {aiItems.map((item, i) => (
            <Text key={i} style={[styles.itemText, { color: theme.text }]}>
              {item.name} {item.quantity_g}g
              {item.confidence && item.confidence < 0.6 ? ' ⚠️' : ''}
            </Text>
          ))}
          {uncertainItems.length > 0 && (
            <Text style={[styles.uncertainText, { color: theme.warning }]}>
              量が不明: {uncertainItems.join('、')}
            </Text>
          )}
          {aiAdvice ? (
            <Text style={[styles.adviceText, { color: theme.textSecondary }]}>💡 {aiAdvice}</Text>
          ) : null}
        </View>
      )}

      {(aiItems.length > 0 || nutrition) && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>食材を追加（テキスト補足）</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            例: 「鶏むね肉 150」→ 名前 + グラム数で入力
          </Text>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="例: 鶏むね肉 150"
              placeholderTextColor={theme.textSecondary}
              value={manualItem}
              onChangeText={setManualItem}
            />
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={addManualItem}>
              <Text style={styles.addBtnText}>追加</Text>
            </TouchableOpacity>
          </View>
          {manualItems.map((item, i) => (
            <Text key={i} style={[styles.itemText, { color: theme.text }]}>+ {item.name} {item.quantity_g}g</Text>
          ))}

          {nutrition && (
            <View style={[styles.nutritionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.resultTitle, { color: theme.text }]}>栄養素サマリー</Text>
              <Text style={[styles.nutritionRow, { color: theme.text }]}>カロリー: {Math.round(nutrition.calories)} kcal</Text>
              <Text style={[styles.nutritionRow, { color: theme.text }]}>タンパク質: {Math.round(nutrition.protein_g)} g</Text>
              <Text style={[styles.nutritionRow, { color: theme.text }]}>脂質: {Math.round(nutrition.fat_g)} g</Text>
              <Text style={[styles.nutritionRow, { color: theme.text }]}>炭水化物: {Math.round(nutrition.carbs_g)} g</Text>
              <Text style={[styles.nutritionRow, { color: theme.text }]}>食物繊維: {Math.round(nutrition.fiber_g)} g</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.success }, saving && styles.btnDisabled]}
            onPress={saveMealLog}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? '...' : '食事を記録する'}</Text>
          </TouchableOpacity>
        </>
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
  title: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 16 },
  mealTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  mealChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  mealChipText: { fontSize: 13, fontWeight: '600' },
  cameraRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  cameraBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cameraBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  preview: { width: '100%', height: 200, borderRadius: 14, marginBottom: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  loadingText: { fontSize: 14 },
  resultCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  resultTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  itemText: { fontSize: 14, marginBottom: 4 },
  uncertainText: { fontSize: 12, marginTop: 6 },
  adviceText: { fontSize: 12, marginTop: 8, lineHeight: 18, fontStyle: 'italic' },
  hint: { fontSize: 12, marginBottom: 8 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  addBtn: { height: 44, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  nutritionCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 10, marginBottom: 4 },
  nutritionRow: { fontSize: 14, marginBottom: 4 },
  saveBtn: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});

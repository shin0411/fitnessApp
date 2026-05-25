import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { useUserStore } from '../store/userStore';

const MBTI_TYPES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
const BODY_TYPES = [
  { id: 'ectomorph', label: '細身型（エクトモーフ）' },
  { id: 'mesomorph', label: '筋肉型（メソモーフ）' },
  { id: 'endomorph', label: 'がっちり型（エンドモーフ）' },
];

export default function GoalSetupScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [mbti, setMbti] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!profile) return;
    setLoading(true);
    await supabase.from('profiles').update({ birth_date: birthDate || null, gender: gender || null, onboarding_completed: true }).eq('id', profile.id);
    if (height || weight || bodyType || mbti) {
      await supabase.from('profile_details').upsert({ user_id: profile.id, height_cm: height ? parseFloat(height) : null, weight_kg: weight ? parseFloat(weight) : null, body_type: bodyType || null, mbti: mbti || null });
    }
    setProfile({ ...profile, onboarding_completed: true });
    setLoading(false);
    router.replace('/(tabs)');
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.inner}>
      <Text style={[styles.title, { color: theme.text }]}>プロフィール設定</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>任意項目を入力するとAIがより正確なレベル診断を行います</Text>

      <Text style={[styles.label, { color: theme.text }]}>生年月日（任意）</Text>
      <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary} value={birthDate} onChangeText={setBirthDate} />

      <Text style={[styles.label, { color: theme.text }]}>性別（任意）</Text>
      <View style={styles.row}>
        {['male', 'female', 'other'].map((g) => (
          <TouchableOpacity key={g} style={[styles.chip, { borderColor: gender === g ? theme.primary : theme.border, backgroundColor: gender === g ? theme.primary + '20' : theme.surface }]} onPress={() => setGender(g)}>
            <Text style={[styles.chipText, { color: gender === g ? theme.primary : theme.textSecondary }]}>{g === 'male' ? '男性' : g === 'female' ? '女性' : 'その他'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.text }]}>身長 cm（任意）</Text>
      <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="例: 170" placeholderTextColor={theme.textSecondary} value={height} onChangeText={setHeight} keyboardType="numeric" />

      <Text style={[styles.label, { color: theme.text }]}>体重 kg（任意）</Text>
      <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="例: 65" placeholderTextColor={theme.textSecondary} value={weight} onChangeText={setWeight} keyboardType="numeric" />

      <Text style={[styles.label, { color: theme.text }]}>体型タイプ（任意）</Text>
      {BODY_TYPES.map((bt) => (
        <TouchableOpacity key={bt.id} style={[styles.optionRow, { borderColor: bodyType === bt.id ? theme.primary : theme.border, backgroundColor: bodyType === bt.id ? theme.primary + '15' : theme.surface }]} onPress={() => setBodyType(bt.id)}>
          <Text style={[styles.optionText, { color: bodyType === bt.id ? theme.primary : theme.text }]}>{bt.label}</Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.label, { color: theme.text }]}>MBTI（任意）</Text>
      <View style={styles.mbtiGrid}>
        {MBTI_TYPES.map((type) => (
          <TouchableOpacity key={type} style={[styles.mbtiChip, { borderColor: mbti === type ? theme.primary : theme.border, backgroundColor: mbti === type ? theme.primary + '20' : theme.surface }]} onPress={() => setMbti(type)}>
            <Text style={[styles.mbtiText, { color: mbti === type ? theme.primary : theme.textSecondary }]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }, loading && styles.btnDisabled]} onPress={handleSave} disabled={loading}>
        <Text style={styles.btnText}>{loading ? '...' : '始める！'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setProfile({ ...profile!, onboarding_completed: true }); router.replace('/(tabs)'); }}>
        <Text style={[styles.skip, { color: theme.textSecondary }]}>スキップして後で設定する</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 13, marginBottom: 28, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '600' },
  optionRow: { padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  optionText: { fontSize: 14, fontWeight: '500' },
  mbtiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  mbtiChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  mbtiText: { fontSize: 12, fontWeight: '700' },
  btn: { height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 28, marginBottom: 14 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  skip: { textAlign: 'center', fontSize: 13 },
});

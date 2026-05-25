import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';

export default function SignupScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password || !username) {
      Alert.alert('入力エラー', 'メールアドレス・パスワード・ユーザー名は必須です');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      setLoading(false);
      Alert.alert('登録エラー', error?.message ?? 'エラーが発生しました');
      return;
    }
    const userId = data.user.id;
    const generatedCode = `${username.toUpperCase().slice(0, 4)}${Math.floor(Math.random() * 9000 + 1000)}`;
    let invitedBy: string | null = null;
    if (inviteCode) {
      const { data: inviter } = await supabase.from('profiles').select('id').eq('invite_code', inviteCode.toUpperCase()).single();
      invitedBy = inviter?.id ?? null;
    }
    await supabase.from('profiles').insert({ id: userId, username, invite_code: generatedCode, invited_by: invitedBy, theme: 'simple', onboarding_completed: false });
    await supabase.from('user_levels').insert([
      { user_id: userId, level_type: 'physical', level: 1, total_xp: 0, current_title: '見習いトレーニー' },
      { user_id: userId, level_type: 'beauty', level: 1, total_xp: 0, current_title: '美容初心者' },
      { user_id: userId, level_type: 'knowledge', level: 1, total_xp: 0, current_title: '知識の芽生え' },
      { user_id: userId, level_type: 'comprehensive', level: 1, total_xp: 0, current_title: '成長の始まり' },
    ]);
    if (invitedBy) {
      const { data: inviterLevels } = await supabase.from('user_levels').select('*').eq('user_id', invitedBy);
      if (inviterLevels) {
        for (const lv of inviterLevels) {
          await supabase.from('user_levels').update({ total_xp: lv.total_xp + 500 }).eq('user_id', invitedBy).eq('level_type', lv.level_type);
        }
      }
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={[styles.logo, { color: theme.primary }]}>新規登録</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="ユーザー名 *" placeholderTextColor={theme.textSecondary} value={username} onChangeText={setUsername} />
        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="メールアドレス *" placeholderTextColor={theme.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="パスワード *（6文字以上）" placeholderTextColor={theme.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="招待コード（任意）" placeholderTextColor={theme.textSecondary} value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" />
        <Text style={[styles.hint, { color: theme.textSecondary }]}>招待コード入力で双方に +500 XP プレゼント！</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading}>
          <Text style={styles.btnText}>{loading ? '...' : 'アカウント作成'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.link, { color: theme.primary }]}>ログインに戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 28, paddingTop: 60 },
  logo: { fontSize: 30, fontWeight: '900', textAlign: 'center', marginBottom: 30 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: 12 },
  hint: { fontSize: 12, marginBottom: 20, textAlign: 'center' },
  btn: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  link: { textAlign: 'center', fontSize: 14, fontWeight: '600' },
});

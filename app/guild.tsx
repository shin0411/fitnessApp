import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';

interface Guild {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  max_members: number;
  member_count?: number;
}

interface GuildMember {
  user_id: string;
  role: string;
  profiles: { username: string | null };
}

export default function GuildScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);

  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadGuilds();
  }, [profile?.id]);

  async function loadGuilds() {
    setLoading(true);
    const [allRes, myRes] = await Promise.all([
      supabase.from('guilds').select('*').order('created_at', { ascending: false }).limit(20),
      profile?.id
        ? supabase
            .from('guild_members')
            .select('guild_id, guilds(*)')
            .eq('user_id', profile.id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    if (allRes.data) setGuilds(allRes.data as Guild[]);
    if (myRes.data?.guilds) {
      setMyGuild(myRes.data.guilds as unknown as Guild);
      await loadMembers((myRes.data.guilds as unknown as Guild).id);
    }
    setLoading(false);
  }

  async function loadMembers(guildId: string) {
    const { data } = await supabase
      .from('guild_members')
      .select('user_id, role, profiles(username)')
      .eq('guild_id', guildId);
    if (data) setMembers(data as unknown as GuildMember[]);
  }

  async function createGuild() {
    if (!newName.trim() || !profile?.id) return;
    const { data, error } = await supabase
      .from('guilds')
      .insert({ name: newName.trim(), description: newDesc.trim() || null, owner_id: profile.id })
      .select()
      .single();
    if (error) { Alert.alert('エラー', 'ギルドの作成に失敗しました'); return; }
    await supabase
      .from('guild_members')
      .insert({ guild_id: data.id, user_id: profile.id, role: 'owner' });
    setMyGuild(data as Guild);
    setView('list');
    await loadGuilds();
  }

  async function joinGuild(guildId: string) {
    if (!profile?.id || myGuild) return;
    const { error } = await supabase
      .from('guild_members')
      .insert({ guild_id: guildId, user_id: profile.id, role: 'member' });
    if (error) { Alert.alert('エラー', '加入に失敗しました'); return; }
    await loadGuilds();
  }

  async function leaveGuild() {
    if (!profile?.id || !myGuild) return;
    Alert.alert('ギルドを退出', '本当に退出しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '退出', style: 'destructive', onPress: async () => {
          await supabase
            .from('guild_members')
            .delete()
            .eq('guild_id', myGuild.id)
            .eq('user_id', profile.id);
          setMyGuild(null);
          setMembers([]);
          await loadGuilds();
        }
      }
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: theme.primary }]}>← 戻る</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>ギルド</Text>

      {myGuild && (
        <View style={[styles.myGuildCard, { backgroundColor: theme.primary + '18', borderColor: theme.primary }]}>
          <Text style={[styles.myGuildLabel, { color: theme.textSecondary }]}>所属ギルド</Text>
          <Text style={[styles.myGuildName, { color: theme.primary }]}>{myGuild.name}</Text>
          {myGuild.description && (
            <Text style={[styles.myGuildDesc, { color: theme.textSecondary }]}>{myGuild.description}</Text>
          )}
          <Text style={[styles.memberCount, { color: theme.textSecondary }]}>
            メンバー: {members.length} / {myGuild.max_members}
          </Text>
          <View style={styles.membersList}>
            {members.slice(0, 5).map((m) => (
              <Text key={m.user_id} style={[styles.memberName, { color: theme.text }]}>
                {m.role === 'owner' ? '👑 ' : '• '}{m.profiles?.username ?? 'ユーザー'}
              </Text>
            ))}
            {members.length > 5 && (
              <Text style={[styles.memberName, { color: theme.textSecondary }]}>
                他 {members.length - 5} 人...
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.leaveBtn, { borderColor: theme.error }]}
            onPress={leaveGuild}
          >
            <Text style={[styles.leaveBtnText, { color: theme.error }]}>退出する</Text>
          </TouchableOpacity>
        </View>
      )}

      {!myGuild && view === 'create' ? (
        <View style={[styles.createCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.createTitle, { color: theme.text }]}>新規ギルド作成</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="ギルド名"
            placeholderTextColor={theme.textSecondary}
            value={newName}
            onChangeText={setNewName}
            maxLength={30}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, height: 80 }]}
            placeholder="説明（任意）"
            placeholderTextColor={theme.textSecondary}
            value={newDesc}
            onChangeText={setNewDesc}
            multiline
            maxLength={100}
          />
          <View style={styles.createBtns}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={() => setView('list')}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: theme.primary }]}
              onPress={createGuild}
            >
              <Text style={styles.createBtnText}>作成</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : !myGuild ? (
        <TouchableOpacity
          style={[styles.createNewBtn, { backgroundColor: theme.primary }]}
          onPress={() => setView('create')}
        >
          <Text style={styles.createNewBtnText}>+ ギルドを作成</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>ギルド一覧</Text>
      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
      ) : guilds.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>ギルドがまだありません</Text>
      ) : (
        guilds.map((g) => (
          <View
            key={g.id}
            style={[styles.guildCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.guildInfo}>
              <Text style={[styles.guildName, { color: theme.text }]}>{g.name}</Text>
              {g.description && (
                <Text style={[styles.guildDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                  {g.description}
                </Text>
              )}
            </View>
            {!myGuild && g.owner_id !== profile?.id && (
              <TouchableOpacity
                style={[styles.joinBtn, { backgroundColor: theme.primary }]}
                onPress={() => joinGuild(g.id)}
              >
                <Text style={styles.joinBtnText}>参加</Text>
              </TouchableOpacity>
            )}
            {myGuild?.id === g.id && (
              <Text style={[styles.inGuild, { color: theme.primary }]}>✓ 所属中</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
  myGuildCard: { padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 20 },
  myGuildLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  myGuildName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  myGuildDesc: { fontSize: 13, marginBottom: 8 },
  memberCount: { fontSize: 12, marginBottom: 8 },
  membersList: { marginBottom: 12 },
  memberName: { fontSize: 13, marginBottom: 4 },
  leaveBtn: { height: 40, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  leaveBtnText: { fontSize: 13, fontWeight: '600' },
  createCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  createTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: { height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14, marginBottom: 10 },
  createBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  createBtn: { flex: 2, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  createNewBtn: { height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  createNewBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  empty: { fontSize: 14, textAlign: 'center', paddingTop: 20 },
  guildCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  guildInfo: { flex: 1 },
  guildName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  guildDesc: { fontSize: 12 },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  inGuild: { fontSize: 13, fontWeight: '600' },
});

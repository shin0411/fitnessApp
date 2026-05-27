'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Guild, GuildMember } from '@/types';

export default function GuildPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchData = async (uid: string) => {
    const supabase = createClient();

    // Check if user is in a guild
    const { data: memberData } = await supabase
      .from('guild_members')
      .select('*, guild:guilds(*)')
      .eq('user_id', uid)
      .single();

    if (memberData?.guild) {
      setMyGuild(memberData.guild);
      const { data: membersData } = await supabase
        .from('guild_members')
        .select('*, profile:profiles(username)')
        .eq('guild_id', memberData.guild.id);
      if (membersData) setMembers(membersData);
    } else {
      // Fetch public guilds
      const { data: guildsData } = await supabase
        .from('guilds')
        .select('*')
        .order('name')
        .limit(10);
      if (guildsData) setGuilds(guildsData);
    }
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      await fetchData(user.id);
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const createGuild = async () => {
    if (!userId || !newGuildName.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const { data: guild } = await supabase
      .from('guilds')
      .insert({ name: newGuildName.trim(), description: newGuildDesc || null, owner_id: userId })
      .select()
      .single();
    if (guild) {
      await supabase.from('guild_members').insert({ guild_id: guild.id, user_id: userId, role: 'owner' });
      setMyGuild(guild);
      setMembers([{ guild_id: guild.id, user_id: userId, role: 'owner' }]);
      setShowCreateForm(false);
    }
    setCreating(false);
  };

  const joinGuild = async (guildId: string) => {
    if (!userId) return;
    setJoining(true);
    const supabase = createClient();
    await supabase.from('guild_members').insert({ guild_id: guildId, user_id: userId, role: 'member' });
    await fetchData(userId);
    setJoining(false);
  };

  const leaveGuild = async () => {
    if (!userId || !myGuild) return;
    const supabase = createClient();
    await supabase.from('guild_members').delete().eq('guild_id', myGuild.id).eq('user_id', userId);
    setMyGuild(null);
    setMembers([]);
    await fetchData(userId);
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    backgroundColor: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: theme.textSecondary }}>読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  if (myGuild) {
    return (
      <AppLayout>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: '0 0 20px' }}>🛡️ ギルド</h1>
        <div
          style={{
            backgroundColor: theme.surface,
            border: `2px solid ${theme.primary}`,
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.primary, margin: '0 0 6px' }}>
            {myGuild.name}
          </h2>
          {myGuild.description && (
            <p style={{ fontSize: '13px', color: theme.textSecondary, margin: '0 0 16px' }}>{myGuild.description}</p>
          )}
          <div style={{ fontSize: '13px', color: theme.textSecondary }}>メンバー数: {members.length}人</div>
        </div>

        <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>メンバー</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {members.map((m) => (
            <div
              key={m.user_id}
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: `${theme.primary}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                  }}
                >
                  👤
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>
                    {(m as GuildMember & { profile?: { username?: string } }).profile?.username ?? 'ユーザー'}
                  </div>
                  <div style={{ fontSize: '11px', color: theme.textSecondary }}>{m.role}</div>
                </div>
              </div>
              {m.user_id === myGuild.owner_id && (
                <span style={{ fontSize: '12px', color: theme.accent, fontWeight: 700 }}>オーナー</span>
              )}
            </div>
          ))}
        </div>

        <Button onClick={leaveGuild} variant="danger" size="sm">
          ギルドを退出する
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: 0 }}>🛡️ ギルド</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
          {showCreateForm ? 'キャンセル' : '作成'}
        </Button>
      </div>

      {showCreateForm && (
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 14px' }}>新しいギルドを作成</h2>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>ギルド名 *</label>
            <input
              type="text"
              value={newGuildName}
              onChange={(e) => setNewGuildName(e.target.value)}
              placeholder="ギルド名を入力"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>説明 (任意)</label>
            <input
              type="text"
              value={newGuildDesc}
              onChange={(e) => setNewGuildDesc(e.target.value)}
              placeholder="ギルドの説明"
              style={inputStyle}
            />
          </div>
          <Button onClick={createGuild} loading={creating} size="sm" disabled={!newGuildName.trim()}>
            ギルドを作成
          </Button>
        </div>
      )}

      <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>ギルド一覧</h2>
      {guilds.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: theme.textSecondary,
            padding: '40px',
            fontSize: '14px',
            backgroundColor: theme.surface,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🛡️</div>
          まだギルドがありません。最初のギルドを作りましょう！
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {guilds.map((g) => (
            <div
              key={g.id}
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: theme.text }}>{g.name}</div>
                {g.description && (
                  <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>{g.description}</div>
                )}
              </div>
              <Button onClick={() => joinGuild(g.id)} loading={joining} size="sm" variant="secondary">
                加入
              </Button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

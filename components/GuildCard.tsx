import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface GuildMember {
  user_id: string;
  username: string;
  level: number;
  contribution: number;
}

interface Guild {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  total_xp: number;
  rank?: number;
  members?: GuildMember[];
}

interface Props {
  guild: Guild;
  isCurrentUserGuild?: boolean;
  onPress?: () => void;
  onLeave?: () => void;
}

export function GuildCard({ guild, isCurrentUserGuild, onPress, onLeave }: Props) {
  const theme = useTheme();
  const accentColor = isCurrentUserGuild ? theme.primary : theme.textSecondary;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: isCurrentUserGuild ? theme.primary + '60' : theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleArea}>
          {guild.rank != null && (
            <Text style={[styles.rank, { color: '#FFD700' }]}>#{guild.rank}</Text>
          )}
          <Text style={[styles.name, { color: theme.text }]}>{guild.name}</Text>
          {isCurrentUserGuild && (
            <View style={[styles.memberBadge, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.memberBadgeText, { color: theme.primary }]}>在籍中</Text>
            </View>
          )}
        </View>
        <Text style={[styles.xp, { color: theme.xpColor }]}>
          {guild.total_xp.toLocaleString()} XP
        </Text>
      </View>

      {guild.description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {guild.description}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={[styles.memberCount, { color: theme.textSecondary }]}>
          メンバー {guild.member_count}名
        </Text>
        {isCurrentUserGuild && onLeave && (
          <TouchableOpacity
            style={[styles.leaveBtn, { borderColor: theme.error }]}
            onPress={onLeave}
          >
            <Text style={[styles.leaveBtnText, { color: theme.error }]}>退出</Text>
          </TouchableOpacity>
        )}
      </View>

      {guild.members && guild.members.length > 0 && (
        <View style={styles.membersArea}>
          {guild.members.slice(0, 3).map((m) => (
            <View
              key={m.user_id}
              style={[
                styles.memberRow,
                { backgroundColor: theme.background },
              ]}
            >
              <Text style={[styles.memberName, { color: theme.text }]}>
                {m.username}
              </Text>
              <Text style={[styles.memberLevel, { color: accentColor }]}>
                Lv.{m.level}
              </Text>
              <Text style={[styles.contribution, { color: theme.xpColor }]}>
                +{m.contribution.toLocaleString()} XP
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleArea: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  rank: { fontSize: 16, fontWeight: '900' },
  name: { fontSize: 17, fontWeight: '800', flex: 1 },
  memberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  memberBadgeText: { fontSize: 11, fontWeight: '700' },
  xp: { fontSize: 14, fontWeight: '700' },
  description: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: { fontSize: 12 },
  leaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  leaveBtnText: { fontSize: 12, fontWeight: '600' },
  membersArea: { marginTop: 10, gap: 4 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  memberName: { flex: 1, fontSize: 13, fontWeight: '600' },
  memberLevel: { fontSize: 12, fontWeight: '700', marginRight: 10 },
  contribution: { fontSize: 12, fontWeight: '600' },
});

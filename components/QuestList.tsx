import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Quest, UserQuestProgress } from '../types';

interface QuestItemProps {
  quest: Quest;
  progress: UserQuestProgress | undefined;
  onClaim?: (questId: string) => void;
}

function QuestItem({ quest, progress, onClaim }: QuestItemProps) {
  const theme = useTheme();
  const completed = progress?.completed ?? false;
  const current = progress?.progress ?? 0;
  const required = (quest.condition_value?.count as number) ?? 1;
  const pct = Math.min(current / required, 1);

  return (
    <View
      style={[
        styles.item,
        { backgroundColor: theme.surface, borderColor: completed ? theme.success : theme.border },
      ]}
    >
      <View style={styles.itemLeft}>
        <Text style={[styles.itemTitle, { color: completed ? theme.textSecondary : theme.text }]}>
          {completed ? '✓ ' : ''}{quest.title}
        </Text>
        <Text style={[styles.itemDesc, { color: theme.textSecondary }]}>{quest.description}</Text>
        {!completed && (
          <View style={[styles.barBg, { backgroundColor: theme.border }]}>
            <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: theme.xpColor }]} />
          </View>
        )}
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.xpReward, { color: theme.xpColor }]}>+{quest.xp_reward} XP</Text>
        {completed && !progress?.completed_at && (
          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: theme.success }]}
            onPress={() => onClaim?.(quest.id)}
          >
            <Text style={styles.claimText}>受取</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface Props {
  quests: Quest[];
  progressMap: Record<string, UserQuestProgress>;
  onClaim?: (questId: string) => void;
}

export function QuestList({ quests, progressMap, onClaim }: Props) {
  const theme = useTheme();
  return (
    <View>
      <Text style={[styles.heading, { color: theme.text }]}>今日のクエスト</Text>
      {quests.map((q) => (
        <QuestItem key={q.id} quest={q} progress={progressMap[q.id]} onClaim={onClaim} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemLeft: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  itemDesc: { fontSize: 12, marginBottom: 6 },
  barBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  itemRight: { alignItems: 'flex-end', marginLeft: 10 },
  xpReward: { fontSize: 13, fontWeight: '700' },
  claimBtn: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  claimText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

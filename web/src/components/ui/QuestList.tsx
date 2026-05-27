'use client';

import React from 'react';
import { useThemeStore } from '@/store/themeStore';
import { UserQuestProgress } from '@/types';

interface QuestListProps {
  quests: UserQuestProgress[];
}

export function QuestList({ quests }: QuestListProps) {
  const { theme } = useThemeStore();

  if (quests.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '20px 0' }}>
        今日のクエストはありません
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {quests.map((q) => (
        <div
          key={q.quest_id}
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '10px',
            padding: '12px',
            opacity: q.completed ? 0.7 : 1,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {q.completed && <span style={{ fontSize: '14px' }}>✅</span>}
                <span style={{ fontSize: '14px', fontWeight: 600, color: theme.text }}>
                  {q.quest?.title ?? 'クエスト'}
                </span>
              </div>
              {q.quest?.description && (
                <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                  {q.quest.description}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '12px',
                color: theme.accent,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                marginLeft: '8px',
              }}
            >
              +{q.quest?.xp_reward ?? 0} XP
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: theme.border,
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min((q.progress / 1) * 100, 100)}%`,
                height: '100%',
                backgroundColor: q.completed ? '#22c55e' : theme.primary,
                borderRadius: '2px',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

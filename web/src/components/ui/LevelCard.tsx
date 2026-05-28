'use client';

import React from 'react';
import { useThemeStore } from '@/store/themeStore';
import { XPBar } from './XPBar';
import { UserLevel, LevelType } from '@/types';
import { getXpProgress } from '@/lib/levels';

const levelTypeLabels: Record<LevelType, string> = {
  physical: '身体',
  beauty: '美容',
  knowledge: '知識',
  comprehensive: '総合',
};

const levelTypeIcons: Record<LevelType, string> = {
  physical: '💪',
  beauty: '✨',
  knowledge: '📚',
  comprehensive: '🌟',
};

interface LevelCardProps {
  userLevel: UserLevel;
}

export function LevelCard({ userLevel }: LevelCardProps) {
  const { theme } = useThemeStore();
  const { level, currentXp, neededXp, percentage } = getXpProgress(userLevel.total_xp);

  return (
    <div
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{levelTypeIcons[userLevel.level_type]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 500 }}>
              {levelTypeLabels[userLevel.level_type]}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: theme.accent,
                backgroundColor: `${theme.accent}22`,
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 600,
              }}
            >
              {userLevel.current_title}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: theme.primary }}>
              {level}
            </span>
            <span style={{ fontSize: '13px', color: theme.textSecondary }}>Lv</span>
          </div>
        </div>
      </div>
      <XPBar currentXp={currentXp} neededXp={neededXp} percentage={percentage} />
      <div style={{ marginTop: '4px', textAlign: 'right' }}>
        <span style={{ fontSize: '11px', color: theme.textSecondary }}>
          総 XP: {userLevel.total_xp.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

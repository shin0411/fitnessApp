'use client';

import React from 'react';
import { useThemeStore } from '@/store/themeStore';

interface XPBarProps {
  currentXp: number;
  neededXp: number;
  percentage: number;
  showLabel?: boolean;
}

export function XPBar({ currentXp, neededXp, percentage, showLabel = true }: XPBarProps) {
  const { theme } = useThemeStore();

  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: theme.textSecondary }}>
            {currentXp.toLocaleString()} XP
          </span>
          <span style={{ fontSize: '12px', color: theme.textSecondary }}>
            {neededXp.toLocaleString()} XP
          </span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: theme.border,
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: theme.accent,
            borderRadius: '4px',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

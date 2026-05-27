'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeStore } from '@/store/themeStore';

const navItems = [
  { href: '/dashboard', label: 'ホーム', icon: '🏠' },
  { href: '/log', label: '筋トレ記録', icon: '💪' },
  { href: '/quiz', label: 'クイズ', icon: '📚' },
  { href: '/analyze', label: '写真診断', icon: '📷' },
  { href: '/nutrition', label: '栄養管理', icon: '🥗' },
  { href: '/progress', label: '成長記録', icon: '📈' },
  { href: '/achievements', label: '実績', icon: '🏆' },
  { href: '/guild', label: 'ギルド', icon: '🛡️' },
  { href: '/ranking', label: 'ランキング', icon: '🌟' },
  { href: '/profile', label: 'プロフィール', icon: '👤' },
];

export function Sidebar() {
  const { theme } = useThemeStore();
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: '220px',
        minHeight: '100vh',
        backgroundColor: theme.surface,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>⚔️</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: theme.primary }}>FitnessRPG</div>
            <div style={{ fontSize: '11px', color: theme.textSecondary }}>レベルアップしよう</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 20px',
                textDecoration: 'none',
                color: isActive ? theme.primary : theme.textSecondary,
                backgroundColor: isActive ? `${theme.primary}15` : 'transparent',
                borderLeft: isActive ? `3px solid ${theme.primary}` : '3px solid transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '14px',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: `1px solid ${theme.border}`, fontSize: '11px', color: theme.textSecondary }}>
        FitnessRPG v1.0
      </div>
    </aside>
  );
}

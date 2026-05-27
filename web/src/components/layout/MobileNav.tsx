'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeStore } from '@/store/themeStore';

const mobileNavItems = [
  { href: '/dashboard', label: 'ホーム', icon: '🏠' },
  { href: '/log', label: '筋トレ', icon: '💪' },
  { href: '/quiz', label: 'クイズ', icon: '📚' },
  { href: '/analyze', label: '診断', icon: '📷' },
  { href: '/profile', label: 'プロフ', icon: '👤' },
];

export function MobileNav() {
  const { theme } = useThemeStore();
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.surface,
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 4px',
              textDecoration: 'none',
              color: isActive ? theme.primary : theme.textSecondary,
              gap: '2px',
            }}
          >
            <span style={{ fontSize: '22px', lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: isActive ? 700 : 400 }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

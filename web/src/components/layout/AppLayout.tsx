'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useThemeStore } from '@/store/themeStore';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.bg }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          minHeight: '100vh',
          backgroundColor: theme.bg,
          padding: '24px',
          paddingBottom: '80px',
        }}
        className="lg:ml-[220px] lg:pb-6"
      >
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="block lg:hidden">
        <MobileNav />
      </div>
    </div>
  );
}

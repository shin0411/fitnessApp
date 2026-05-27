'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ログインに失敗しました';
      if (message.includes('Invalid login credentials')) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚔️</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.primary, margin: 0 }}>FitnessRPG</h1>
          <p style={{ fontSize: '14px', color: theme.textSecondary, margin: '8px 0 0' }}>
            フィットネスで人生をRPGに
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '6px' }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '6px' }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#991b1b',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            style={{ width: '100%' }}
            size="lg"
          >
            ログイン
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ fontSize: '13px', color: theme.textSecondary }}>
            アカウントがない方は{' '}
          </span>
          <Link
            href="/signup"
            style={{ fontSize: '13px', color: theme.primary, fontWeight: 600, textDecoration: 'none' }}
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}

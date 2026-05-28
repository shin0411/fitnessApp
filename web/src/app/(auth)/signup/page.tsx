'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/ui/Button';

export default function SignupPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError('パスワードは6文字以上入力してください');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });
      if (signUpError) throw signUpError;
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登録に失敗しました';
      if (message.includes('already registered')) {
        setError('このメールアドレスは既に登録されています');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>
            確認メールを送信しました
          </h2>
          <p style={{ fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6 }}>
            {email} に登録確認メールを送信しました。<br />
            メールのリンクをクリックして登録を完了してください。
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-block',
              marginTop: '24px',
              color: theme.primary,
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            ログイン画面へ
          </Link>
        </div>
      </div>
    );
  }

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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚔️</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: theme.primary, margin: 0 }}>FitnessRPG</h1>
          <p style={{ fontSize: '14px', color: theme.textSecondary, margin: '8px 0 0' }}>
            冠険を始めよう
          </p>
        </div>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '6px' }}>
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="冠者の名"
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
              minLength={6}
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
            アカウント登録
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ fontSize: '13px', color: theme.textSecondary }}>
            アカウントがある方は{' '}
          </span>
          <Link
            href="/login"
            style={{ fontSize: '13px', color: theme.primary, fontWeight: 600, textDecoration: 'none' }}
          >
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}

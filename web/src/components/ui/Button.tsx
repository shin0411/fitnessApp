'use client';

import React from 'react';
import { useThemeStore } from '@/store/themeStore';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const { theme } = useThemeStore();

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    border: 'none',
    transition: 'all 0.2s ease',
  };

  const variantStyles: React.CSSProperties = variant === 'primary'
    ? { backgroundColor: theme.primary, color: theme.bg }
    : variant === 'secondary'
    ? { backgroundColor: theme.surface, color: theme.text, border: `1px solid ${theme.border}` }
    : variant === 'ghost'
    ? { backgroundColor: 'transparent', color: theme.text }
    : { backgroundColor: '#ef4444', color: '#fff' };

  const sizeStyles: React.CSSProperties = size === 'sm'
    ? { padding: '6px 12px', fontSize: '13px' }
    : size === 'lg'
    ? { padding: '14px 28px', fontSize: '16px' }
    : { padding: '10px 20px', fontSize: '14px' };

  return (
    <button
      disabled={disabled || loading}
      style={{ ...baseStyles, ...variantStyles, ...sizeStyles, ...style }}
      className={className}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg
            style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
            <path fill="currentColor" style={{ opacity: 0.75 }} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          処理中...
        </span>
      ) : children}
    </button>
  );
}

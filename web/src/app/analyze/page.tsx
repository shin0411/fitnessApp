'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { PhotoAnalysis } from '@/types';

const ANALYSIS_TYPES = [
  { value: 'face', label: '賈診断', emoji: '👤', description: '顔の輪郭や特徴を分析します' },
  { value: 'body', label: '体型診断', emoji: '💪', description: '体利や筋肉を分析します' },
  { value: 'flexibility', label: '柔軟性診断', emoji: '🧘', description: '柔軟性やストレッチを診断します' },
];

export default function AnalyzePage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<'face' | 'body' | 'flexibility'>('face');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PhotoAnalysis[]>([]);
  const [result, setResult] = useState<PhotoAnalysis | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from('photo_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setHistory(data);
      setLoadingHistory(false);
    };
    init();
  }, [router]);

  const runAnalysis = async () => {
    if (!userId) return;
    setLoading(true);

    // Simulate AI analysis (placeholder - real impl would upload photo and call Claude API)
    const mockScores: Record<string, number> = {
      overall: Math.floor(Math.random() * 40) + 60,
      symmetry: Math.floor(Math.random() * 40) + 60,
      health: Math.floor(Math.random() * 40) + 60,
    };

    const mockResponse = {
      analysis: '分析結果です。この機能を完全に利用するには、フロントカメラから写真を撮影してください。',
      feedback: 'よい知識スコアです。引き続き努力してください！',
    };

    const xp = Math.floor(Object.values(mockScores).reduce((a, b) => a + b, 0) / Object.keys(mockScores).length / 10) * 5;

    const supabase = createClient();
    const { data } = await supabase
      .from('photo_analyses')
      .insert({
        user_id: userId,
        analysis_type: analysisType,
        ai_response: mockResponse,
        scores: mockScores,
        xp_earned: xp,
      })
      .select()
      .single();
    if (data) {
      setResult(data);
      setHistory((prev) => [data, ...prev.slice(0, 4)]);

      // Update beauty XP
      const { data: lvl } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', userId)
        .eq('level_type', 'beauty')
        .single();
      if (lvl) {
        await supabase
          .from('user_levels')
          .update({ total_xp: (lvl.total_xp ?? 0) + xp })
          .eq('user_id', userId)
          .eq('level_type', 'beauty');
      }
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: '0 0 20px' }}>📷 写真診断</h1>

      {/* Type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {ANALYSIS_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setAnalysisType(t.value as 'face' | 'body' | 'flexibility')}
            style={{
              padding: '14px 10px',
              backgroundColor: analysisType === t.value ? `${theme.primary}20` : theme.surface,
              border: analysisType === t.value ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{t.emoji}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Selected type info */}
      <div
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
        }}
      >
        <p style={{ fontSize: '13px', color: theme.textSecondary, margin: '0 0 16px' }}>
          {ANALYSIS_TYPES.find((t) => t.value === analysisType)?.description}
        </p>
        <div
          style={{
            backgroundColor: theme.bg,
            border: `2px dashed ${theme.border}`,
            borderRadius: '10px',
            padding: '40px 20px',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📸</div>
          <p style={{ fontSize: '13px', color: theme.textSecondary, margin: 0 }}>
            写真のアップロード機能は現在開発中です。<br />
            標準スコアを使用して診断を実行できます。
          </p>
        </div>
        <Button onClick={runAnalysis} loading={loading} style={{ width: '100%' }}>
          診断を実行
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div
          style={{
            backgroundColor: theme.surface,
            border: `2px solid ${theme.primary}`,
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 16px' }}>分析結果</h3>
          {Object.entries(result.scores).map(([key, val]) => (
            <div key={key} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: theme.text, fontWeight: 600 }}>{key}</span>
                <span style={{ fontSize: '13px', color: theme.primary, fontWeight: 700 }}>{val}/100</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: theme.border, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${val}%`, height: '100%', backgroundColor: theme.accent, borderRadius: '3px' }} />
              </div>
            </div>
          ))}
          <div
            style={{
              backgroundColor: `${theme.accent}15`,
              borderRadius: '8px',
              padding: '12px',
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px', color: theme.textSecondary }}>獲得XP</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: theme.accent }}>+{result.xp_earned}</span>
          </div>
        </div>
      )}

      {/* History */}
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>過去の診断履歴</h2>
      {loadingHistory ? (
        <p style={{ color: theme.textSecondary, fontSize: '13px' }}>読み込み中...</p>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '20px', fontSize: '13px' }}>
          まだ診断履歴がありません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {history.map((h) => (
            <div
              key={h.id}
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>
                  {ANALYSIS_TYPES.find((t) => t.value === h.analysis_type)?.label ?? h.analysis_type}
                </div>
                <div style={{ fontSize: '11px', color: theme.textSecondary }}>
                  {new Date(h.created_at ?? '').toLocaleDateString('ja-JP')}
                </div>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: theme.accent }}>+{h.xp_earned} XP</span>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

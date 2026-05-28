'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { MealLog, MealType, NutritionData } from '@/types';

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: '朝食', emoji: '☀️' },
  { value: 'lunch', label: '昼食', emoji: '🌞' },
  { value: 'dinner', label: '夕食', emoji: '🌙' },
  { value: 'snack', label: '間食', emoji: '🍪' },
];

const emptyNutrition: NutritionData = {
  calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0, fiber_g: 0,
};

export default function NutritionPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [nutrition, setNutrition] = useState<NutritionData>(emptyNutrition);

  const today = new Date().toISOString().split('T')[0];

  const fetchLogs = async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', uid)
      .gte('logged_at', today)
      .order('logged_at', { ascending: true });
    if (data) setLogs(data);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      await fetchLogs(user.id);
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const saveMeal = async () => {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    const xp = Math.floor(nutrition.calories / 100) + (nutrition.protein_g > 30 ? 10 : 0);
    const { data } = await supabase
      .from('meal_logs')
      .insert({
        user_id: userId,
        meal_type: mealType,
        final_nutrition: nutrition,
        physical_xp_earned: xp,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (data) {
      setLogs((prev) => [...prev, data]);
      setShowForm(false);
      setNutrition(emptyNutrition);
    }
    setSaving(false);
  };

  const totalNutrition = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.final_nutrition?.calories ?? 0),
      protein_g: acc.protein_g + (log.final_nutrition?.protein_g ?? 0),
      fat_g: acc.fat_g + (log.final_nutrition?.fat_g ?? 0),
      carbs_g: acc.carbs_g + (log.final_nutrition?.carbs_g ?? 0),
      fiber_g: acc.fiber_g + (log.final_nutrition?.fiber_g ?? 0),
    }),
    { ...emptyNutrition }
  );

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: theme.textSecondary }}>読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: 0 }}>🥗 栄養管理</h1>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? 'キャンセル' : '+ 記録'}
        </Button>
      </div>

      {/* Today's summary */}
      <div
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: theme.textSecondary, margin: '0 0 14px' }}>今日の合計</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {([
            { label: 'カロリー', value: totalNutrition.calories, unit: 'kcal', color: '#f97316' },
            { label: 'タンパク質', value: totalNutrition.protein_g, unit: 'g', color: '#3b82f6' },
            { label: '脈質', value: totalNutrition.fat_g, unit: 'g', color: '#f59e0b' },
            { label: '炎水化物', value: totalNutrition.carbs_g, unit: 'g', color: '#10b981' },
          ] as const).map((item) => (
            <div
              key={item.label}
              style={{
                backgroundColor: theme.bg,
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', color: theme.textSecondary, marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: item.color }}>
                {item.value.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: theme.textSecondary }}>{item.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Add meal form */}
      {showForm && (
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 14px' }}>食事を記録</h2>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {MEAL_TYPES.map((mt) => (
                <button
                  key={mt.value}
                  onClick={() => setMealType(mt.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: mealType === mt.value ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                    backgroundColor: mealType === mt.value ? `${theme.primary}20` : theme.bg,
                    color: mealType === mt.value ? theme.primary : theme.textSecondary,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: mealType === mt.value ? 700 : 400,
                  }}
                >
                  {mt.emoji} {mt.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {([
                { key: 'calories', label: 'カロリー (kcal)' },
                { key: 'protein_g', label: 'タンパク質 (g)' },
                { key: 'fat_g', label: '脈質 (g)' },
                { key: 'carbs_g', label: '炎水化物 (g)' },
                { key: 'fiber_g', label: '食物繊維 (g)' },
              ] as const).map((field) => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>{field.label}</label>
                  <input
                    type="number"
                    value={nutrition[field.key] || ''}
                    onChange={(e) => setNutrition((n) => ({ ...n, [field.key]: parseFloat(e.target.value) || 0 }))}
                    style={inputStyle}
                    min={0}
                    step={0.1}
                  />
                </div>
              ))}
            </div>
          </div>
          <Button onClick={saveMeal} loading={saving} size="sm" style={{ width: '100%' }}>
            記録する
          </Button>
        </div>
      )}

      {/* Meal logs */}
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>今日の食事履歴</h2>
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '30px', fontSize: '13px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥗</div>
          まだ今日の食事が記録されていません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logs.map((log) => {
            const mt = MEAL_TYPES.find((m) => m.value === log.meal_type);
            return (
              <div
                key={log.id}
                style={{
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: theme.text }}>
                    {mt?.emoji} {mt?.label}
                  </span>
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {new Date(log.logged_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {([
                    { label: 'カロ', value: `${log.final_nutrition?.calories ?? 0}kcal` },
                    { label: 'P', value: `${log.final_nutrition?.protein_g ?? 0}g` },
                    { label: 'F', value: `${log.final_nutrition?.fat_g ?? 0}g` },
                    { label: 'C', value: `${log.final_nutrition?.carbs_g ?? 0}g` },
                  ] as const).map((item) => (
                    <span key={item.label} style={{ fontSize: '12px', color: theme.textSecondary }}>
                      <b style={{ color: theme.text }}>{item.label}:</b> {item.value}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

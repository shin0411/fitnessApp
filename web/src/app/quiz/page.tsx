'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/store/themeStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { QuizQuestion } from '@/types';
import { calcQuizXp } from '@/lib/levels';

const SUBJECTS = ['国語', '英語', '数学', '社会', '読解'];

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'f1', subject: '数学', difficulty: 2,
    question_text: '三角形の内角の和は何度ですか？',
    choices: ['90度', '180度', '270度', '360度'],
    correct_index: 1,
    explanation: '三角形の内角の和は常に180度です。これはユークリッド幾何学の基本定理の一つです。',
    time_limit_seconds: 20,
  },
  {
    id: 'f2', subject: '国語', difficulty: 1,
    question_text: '「紅葉」の読み方として正しいのはどれ？',
    choices: ['こうよう', 'くれは', 'もみじ', 'べにば'],
    correct_index: 0,
    explanation: '「紅葉」は「こうよう」または「もみじ」と読みます。秋の紅葉現象を指す場合は「こうよう」が一般的です。',
    time_limit_seconds: 15,
  },
  {
    id: 'f3', subject: '社会', difficulty: 2,
    question_text: '日本の首都はどこですか？',
    choices: ['大阪', '京都', '東京', '名古屋'],
    correct_index: 2,
    explanation: '東京は日本の首都です。1869年に江戸から東京へ改称されました。',
    time_limit_seconds: 10,
  },
  {
    id: 'f4', subject: '英語', difficulty: 2,
    question_text: 'Which word means "happy" in English?',
    choices: ['Sad', 'Angry', 'Joyful', 'Tired'],
    correct_index: 2,
    explanation: '"Joyful" means feeling or expressing great happiness. It is a synonym for happy.',
    time_limit_seconds: 15,
  },
  {
    id: 'f5', subject: '数学', difficulty: 3,
    question_text: '√144 の値は？',
    choices: ['10', '11', '12', '14'],
    correct_index: 2,
    explanation: '√144 = 12 です。12 × 12 = 144 なので、144の平方根は12です。',
    time_limit_seconds: 20,
  },
];

type Phase = 'select' | 'quiz' | 'result';

export default function QuizPage() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [difficulty, setDifficulty] = useState(2);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerTimes, setAnswerTimes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
    };
    init();
  }, [router]);

  const startQuiz = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('subject', selectedSubject)
      .eq('difficulty', difficulty)
      .limit(5);
    const qs: QuizQuestion[] = (data && data.length >= 3)
      ? data.slice(0, 5)
      : FALLBACK_QUESTIONS.filter((q) => q.subject === selectedSubject || true).slice(0, 5);
    setQuestions(qs);
    setCurrentIndex(0);
    setCorrectCount(0);
    setAnswerTimes([]);
    setSelected(null);
    setTimeLeft(qs[0]?.time_limit_seconds ?? 20);
    setStartTime(Date.now());
    setPhase('quiz');
    setLoading(false);
  }, [selectedSubject, difficulty]);

  useEffect(() => {
    if (phase !== 'quiz') return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Time's up - auto move to next
          handleAnswer(-1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current!); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, phase]);

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const responseTime = (Date.now() - startTime) / 1000;
    setAnswerTimes((prev) => [...prev, responseTime]);
    setSelected(idx);
    const currentQ = questions[currentIndex];
    const isCorrect = idx === currentQ?.correct_index;
    if (isCorrect) setCorrectCount((c) => c + 1);

    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= questions.length) {
        // Finish quiz
        finishQuiz(isCorrect ? correctCount + 1 : correctCount);
      } else {
        setCurrentIndex(nextIndex);
        setSelected(null);
        setTimeLeft(questions[nextIndex]?.time_limit_seconds ?? 20);
        setStartTime(Date.now());
      }
    }, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, startTime, questions, currentIndex, correctCount]);

  const finishQuiz = async (finalCorrect: number) => {
    if (!userId) return;
    setSaving(true);
    const avgSec = answerTimes.length > 0
      ? answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length
      : 10;
    const xp = calcQuizXp(difficulty, finalCorrect, questions.length, avgSec);
    setXpEarned(xp);

    const supabase = createClient();
    await supabase.from('quiz_sessions').insert({
      user_id: userId,
      subject: selectedSubject,
      difficulty_used: difficulty,
      total_questions: questions.length,
      correct_count: finalCorrect,
      xp_earned: xp,
    });

    // Update knowledge XP
    const { data: lvl } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', userId)
      .eq('level_type', 'knowledge')
      .single();
    if (lvl) {
      await supabase
        .from('user_levels')
        .update({ total_xp: (lvl.total_xp ?? 0) + xp })
        .eq('user_id', userId)
        .eq('level_type', 'knowledge');
    }

    setSaving(false);
    setPhase('result');
  };

  const currentQ = questions[currentIndex];

  if (phase === 'select') {
    return (
      <AppLayout>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: '0 0 20px' }}>📚 知識クイズ</h1>
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '14px',
            padding: '24px',
            maxWidth: '480px',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '10px' }}>
              科目を選択
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSubject(s)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: selectedSubject === s ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                    backgroundColor: selectedSubject === s ? `${theme.primary}20` : theme.bg,
                    color: selectedSubject === s ? theme.primary : theme.textSecondary,
                    cursor: 'pointer',
                    fontWeight: selectedSubject === s ? 700 : 400,
                    fontSize: '13px',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '10px' }}>
              難易度: {difficulty}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: theme.primary }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.textSecondary, marginTop: '4px' }}>
              <span>ブロンズ</span>
              <span>シルバー</span>
              <span>ゴールド</span>
              <span>プラチナ</span>
              <span>ダイヤモンド</span>
            </div>
          </div>

          <Button onClick={startQuiz} loading={loading} size="lg" style={{ width: '100%' }}>
            クイズ開始！
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (phase === 'result') {
    const percent = Math.round((correctCount / questions.length) * 100);
    return (
      <AppLayout>
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            textAlign: 'center',
            paddingTop: '20px',
          }}
        >
          <div style={{ fontSize: '60px', marginBottom: '12px' }}>
            {percent >= 80 ? '🏆' : percent >= 60 ? '😊' : '😓'}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: theme.text, margin: '0 0 8px' }}>クイズ結果</h2>
          <p style={{ color: theme.textSecondary, fontSize: '14px', margin: '0 0 24px' }}>
            {selectedSubject} ・ 難易度 {difficulty}
          </p>

          <div
            style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '48px', fontWeight: 800, color: theme.primary, marginBottom: '4px' }}>
              {correctCount}/{questions.length}
            </div>
            <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '16px' }}>正解</div>

            <div
              style={{
                backgroundColor: `${theme.accent}22`,
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '13px', color: theme.textSecondary }}>獲得XP</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: theme.accent }}>+{xpEarned}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button onClick={() => setPhase('select')} variant="secondary" style={{ flex: 1 }}>
              もう一度
            </Button>
            <Button onClick={() => router.push('/dashboard')} style={{ flex: 1 }}>
              ダッシュボードへ
            </Button>
          </div>

          {saving && <p style={{ color: theme.textSecondary, fontSize: '12px', marginTop: '12px' }}>保存中...</p>}
        </div>
      </AppLayout>
    );
  }

  // Quiz phase
  if (!currentQ) return null;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const timePercent = (timeLeft / (currentQ.time_limit_seconds)) * 100;

  return (
    <AppLayout>
      <div style={{ maxWidth: '560px' }}>
        {/* Progress */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>
            <span>{currentIndex + 1} / {questions.length}</span>
            <span style={{ color: timeLeft <= 5 ? '#ef4444' : theme.text, fontWeight: 700 }}>{timeLeft}秒</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: theme.border, borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: theme.primary, borderRadius: '3px', transition: 'width 0.3s' }} />
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: theme.border, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${timePercent}%`,
              height: '100%',
              backgroundColor: timeLeft <= 5 ? '#ef4444' : '#22c55e',
              borderRadius: '2px',
              transition: 'width 1s linear',
            }} />
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: theme.textSecondary, marginBottom: '8px' }}>
            {currentQ.subject} | 難易度 {currentQ.difficulty}
          </div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: theme.text, margin: 0, lineHeight: 1.5 }}>
            {currentQ.question_text}
          </p>
        </div>

        {/* Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentQ.choices.map((choice, idx) => {
            const isSelected = selected === idx;
            const isCorrect = idx === currentQ.correct_index;
            let bg = theme.surface;
            let border = theme.border;
            let textColor = theme.text;
            if (selected !== null) {
              if (isCorrect) { bg = '#dcfce7'; border = '#22c55e'; textColor = '#166534'; }
              else if (isSelected) { bg = '#fee2e2'; border = '#ef4444'; textColor = '#991b1b'; }
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selected !== null}
                style={{
                  padding: '14px 18px',
                  backgroundColor: bg,
                  border: `2px solid ${border}`,
                  borderRadius: '10px',
                  textAlign: 'left',
                  cursor: selected !== null ? 'default' : 'pointer',
                  color: textColor,
                  fontSize: '15px',
                  fontWeight: isSelected || (selected !== null && isCorrect) ? 700 : 400,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ marginRight: '10px', opacity: 0.6 }}>{String.fromCharCode(65 + idx)}.</span>
                {choice}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {selected !== null && (
          <div
            style={{
              marginTop: '16px',
              backgroundColor: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.textSecondary, marginBottom: '4px' }}>解説</div>
            <p style={{ fontSize: '13px', color: theme.text, margin: 0, lineHeight: 1.6 }}>{currentQ.explanation}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

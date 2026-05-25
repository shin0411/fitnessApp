import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useLevels } from '../../hooks/useLevels';
import { supabase } from '../../lib/supabase';
import { AchievementToast } from '../../components/AchievementToast';
import { QuizQuestion } from '../../types';
import { calcQuizXp, calcSessionBonus, difficultyFromKnowledgeLevel, QUIZ_DIFFICULTY_CONFIG } from '../../modules/knowledge/xp';
import { japaneseQuestions } from '../../modules/knowledge/questions/japanese';
import { mathQuestions } from '../../modules/knowledge/questions/math';
import { englishQuestions } from '../../modules/knowledge/questions/english';
import { socialQuestions } from '../../modules/knowledge/questions/social';

const ALL_QUESTIONS = [
  ...japaneseQuestions,
  ...mathQuestions,
  ...englishQuestions,
  ...socialQuestions,
].map((q, i) => ({ ...q, id: `local_${i}` })) as QuizQuestion[];

const SUBJECTS = [
  { id: 'all', label: '全科目' },
  { id: 'japanese', label: '国語' },
  { id: 'math', label: '数学' },
  { id: 'english', label: '英語' },
  { id: 'social', label: '社会' },
];

export default function QuizScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const { levels, addXp } = useLevels();
  const knowledgeLevel = levels['knowledge']?.level ?? 1;

  const [subject, setSubject] = useState('all');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [combo, setCombo] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', xp: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  const difficulty = difficultyFromKnowledgeLevel(knowledgeLevel);
  const timeLimitSeconds = QUIZ_DIFFICULTY_CONFIG[difficulty]?.timeLimitSeconds ?? 15;

  useEffect(() => {
    loadQuestions();
  }, [subject]);

  function loadQuestions() {
    const pool = subject === 'all' ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.subject === subject);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setSelectedChoice(null);
    setAnswered(false);
    setCombo(0);
    setSessionXp(0);
    setCorrectCount(0);
    setSessionDone(false);
    startTimer(timeLimitSeconds);
  }

  function startTimer(seconds: number) {
    setTimeLeft(seconds);
    setStartTime(Date.now());
    progressAnim.setValue(1);
    Animated.timing(progressAnim, { toValue: 0, duration: seconds * 1000, useNativeDriver: false }).start();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function handleTimeout() {
    if (answered) return;
    setAnswered(true);
    setCombo(0);
  }

  function handleChoiceSelect(idx: number) {
    if (answered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const q = questions[currentIdx];
    const responseSeconds = (Date.now() - startTime) / 1000;
    const isCorrect = idx === q.correct_index;
    const newCombo = isCorrect ? combo + 1 : 0;
    const xp = calcQuizXp(q.difficulty, isCorrect, responseSeconds, timeLimitSeconds, newCombo);

    setSelectedChoice(idx);
    setAnswered(true);
    setCombo(newCombo);
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setSessionXp((x) => x + xp);
    }
  }

  async function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      const bonus = calcSessionBonus(questions.length, correctCount + (selectedChoice === questions[currentIdx]?.correct_index ? 1 : 0));
      const total = sessionXp + bonus;
      if (total > 0 && profile?.id) {
        const { leveledUp, newLevel } = await addXp('knowledge', total);
        await supabase.from('quiz_sessions').insert({
          user_id: profile.id,
          subject,
          difficulty_used: difficulty,
          total_questions: questions.length,
          correct_count: correctCount,
          avg_response_seconds: timeLimitSeconds / 2,
          xp_earned: total,
        });
        setToast({
          visible: true,
          message: leveledUp ? `ナレッジ Lv.${newLevel} にレベルアップ！` : 'クイズ完了！',
          xp: total,
        });
      }
      setSessionDone(true);
      return;
    }
    setCurrentIdx((i) => i + 1);
    setSelectedChoice(null);
    setAnswered(false);
    startTimer(timeLimitSeconds);
  }

  const q = questions[currentIdx];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.inner}
    >
      <Text style={[styles.title, { color: theme.text }]}>ナレッジクイズ</Text>
      <Text style={[styles.level, { color: '#4ECDC4' }]}>
        知識 Lv.{knowledgeLevel} | 難易度{difficulty}: {QUIZ_DIFFICULTY_CONFIG[difficulty]?.label}
      </Text>

      <View style={styles.subjectRow}>
        {SUBJECTS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.subChip, { borderColor: subject === s.id ? '#4ECDC4' : theme.border, backgroundColor: subject === s.id ? '#4ECDC420' : theme.surface }]}
            onPress={() => setSubject(s.id)}
          >
            <Text style={[styles.subChipText, { color: subject === s.id ? '#4ECDC4' : theme.textSecondary }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {sessionDone ? (
        <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.resultTitle, { color: theme.text }]}>セッション結果</Text>
          <Text style={[styles.resultScore, { color: '#4ECDC4' }]}>
            {correctCount}/{questions.length} 正解
          </Text>
          <Text style={[styles.resultXp, { color: theme.xpColor }]}>+{sessionXp} XP 獲得</Text>
          <TouchableOpacity style={[styles.restartBtn, { backgroundColor: '#4ECDC4' }]} onPress={loadQuestions}>
            <Text style={styles.restartBtnText}>もう一度チャレンジ</Text>
          </TouchableOpacity>
        </View>
      ) : q ? (
        <View>
          <View style={styles.progressRow}>
            <Text style={[styles.qNum, { color: theme.textSecondary }]}>
              {currentIdx + 1} / {questions.length}
            </Text>
            <View style={styles.timerRow}>
              <Animated.View
                style={[styles.timerBar, { backgroundColor: timeLeft > 5 ? '#4ECDC4' : '#FF4560', width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
              />
            </View>
            <Text style={[styles.timerText, { color: timeLeft > 5 ? '#4ECDC4' : '#FF4560' }]}>{timeLeft}s</Text>
          </View>

          {combo > 1 && (
            <Text style={[styles.combo, { color: '#FFD700' }]}>{combo} コンボ！</Text>
          )}

          <View style={[styles.questionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.questionText, { color: theme.text }]}>{q.question_text}</Text>
          </View>

          {q.choices.map((choice, idx) => {
            let bg = theme.surface;
            let border = theme.border;
            if (answered) {
              if (idx === q.correct_index) { bg = '#4ECDC420'; border = '#4ECDC4'; }
              else if (idx === selectedChoice) { bg = '#FF456020'; border = '#FF4560'; }
            } else if (selectedChoice === idx) {
              bg = '#4ECDC420'; border = '#4ECDC4';
            }
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.choiceBtn, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleChoiceSelect(idx)}
                disabled={answered}
              >
                <Text style={[styles.choiceText, { color: theme.text }]}>{choice}</Text>
              </TouchableOpacity>
            );
          })}

          {answered && (
            <View style={[styles.explanationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.explanationText, { color: theme.textSecondary }]}>{q.explanation}</Text>
              <TouchableOpacity style={[styles.nextBtn, { backgroundColor: '#4ECDC4' }]} onPress={handleNext}>
                <Text style={styles.nextBtnText}>次へ</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      <AchievementToast
        visible={toast.visible}
        message={toast.message}
        xpGained={toast.xp}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  level: { fontSize: 13, marginBottom: 16 },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  subChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  subChipText: { fontSize: 13, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  qNum: { fontSize: 13, width: 40 },
  timerRow: { flex: 1, height: 6, backgroundColor: '#E0E0E040', borderRadius: 3, overflow: 'hidden' },
  timerBar: { height: '100%', borderRadius: 3 },
  timerText: { fontSize: 14, fontWeight: '700', width: 30, textAlign: 'right' },
  combo: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  questionCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  questionText: { fontSize: 17, fontWeight: '600', lineHeight: 26 },
  choiceBtn: { padding: 16, borderRadius: 12, borderWidth: 1.5, marginBottom: 10 },
  choiceText: { fontSize: 15 },
  explanationCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 6 },
  explanationText: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  nextBtn: { height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultCard: { padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center', marginTop: 20 },
  resultTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  resultScore: { fontSize: 36, fontWeight: '900', marginBottom: 6 },
  resultXp: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  restartBtn: { height: 48, paddingHorizontal: 28, borderRadius: 14, justifyContent: 'center' },
  restartBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

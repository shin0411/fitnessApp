import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useLevels } from '../../hooks/useLevels';
import { supabase } from '../../lib/supabase';
import { QuizQuestion } from '../../types';
import { japaneseQuestions } from '../../modules/knowledge/questions/japanese';
import { mathQuestions } from '../../modules/knowledge/questions/math';
import { englishQuestions } from '../../modules/knowledge/questions/english';
import { socialQuestions } from '../../modules/knowledge/questions/social';

const ALL_QUESTIONS: QuizQuestion[] = [
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

interface ChallengeResult {
  question_indices?: number[];
  challenger_correct?: number;
  challenged_correct?: number;
  winner_id?: string | null;
}

interface PeerChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  challenge_type: string;
  subject: string;
  status: string;
  result: ChallengeResult | null;
  created_at: string;
}

type PeerView = 'list' | 'subject_pick' | 'quiz' | 'result';

export default function PeerScreen() {
  const theme = useTheme();
  const profile = useUserStore((s) => s.profile);
  const { addXp } = useLevels();

  const [view, setView] = useState<PeerView>('list');
  const [challenges, setChallenges] = useState<PeerChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [activeChallenge, setActiveChallenge] = useState<PeerChallenge | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<{ won: boolean | null; myCorrect: number; opponentCorrect: number | null; xpEarned: number } | null>(null);

  useEffect(() => {
    loadChallenges();
    if (!profile?.id) return;

    const channel = supabase
      .channel(`peer-challenges-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'challenges', filter: `challenged_id=eq.${profile.id}` },
        () => loadChallenges()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'challenges', filter: `challenger_id=eq.${profile.id}` },
        () => loadChallenges()
      )
      .subscribe();

    return () => { channel.unsubscribe(); supabase.removeChannel(channel); };
  }, [profile?.id]);

  async function loadChallenges() {
    if (!profile?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setChallenges(data as PeerChallenge[]);
    setLoading(false);
  }

  function pickQuestionsForChallenge(subject: string, indices?: number[]): QuizQuestion[] {
    if (indices && indices.length > 0) {
      return indices.map((i) => ALL_QUESTIONS[i]).filter(Boolean);
    }
    const pool = subject === 'all' ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.subject === subject);
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
  }

  async function handleCreateChallenge() {
    if (!profile?.id) return;
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username')
      .neq('id', profile.id)
      .limit(20);

    if (!users || users.length === 0) {
      Alert.alert('対戦相手なし', 'まだ他のユーザーが登録されていません');
      return;
    }

    const opponent = users[Math.floor(Math.random() * users.length)];
    const questions = pickQuestionsForChallenge(selectedSubject);
    const questionIndices = questions.map((q) => ALL_QUESTIONS.indexOf(q));

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        challenger_id: profile.id,
        challenged_id: opponent.id,
        challenge_type: 'quiz',
        subject: selectedSubject,
        status: 'pending',
        result: { question_indices: questionIndices },
      })
      .select()
      .single();

    if (error || !challenge) {
      Alert.alert('エラー', '挑戦状の送信に失敗しました');
      return;
    }

    setActiveChallenge(challenge as PeerChallenge);
    setQuizQuestions(questions);
    setCurrentIdx(0);
    setSelectedChoice(null);
    setAnswered(false);
    setCorrectCount(0);
    setView('quiz');
  }

  function handleAcceptChallenge(challenge: PeerChallenge) {
    const indices = challenge.result?.question_indices;
    const questions = pickQuestionsForChallenge(challenge.subject, indices);
    setActiveChallenge(challenge);
    setQuizQuestions(questions);
    setCurrentIdx(0);
    setSelectedChoice(null);
    setAnswered(false);
    setCorrectCount(0);
    setView('quiz');
  }

  async function handleDeclineChallenge(challengeId: string) {
    await supabase.from('challenges').update({ status: 'declined' }).eq('id', challengeId);
    loadChallenges();
  }

  function handleChoiceSelect(idx: number) {
    if (answered) return;
    const q = quizQuestions[currentIdx];
    const isCorrect = idx === q.correct_index;
    setSelectedChoice(idx);
    setAnswered(true);
    if (isCorrect) setCorrectCount((c) => c + 1);
  }

  async function handleQuizNext() {
    if (!activeChallenge || !profile?.id) return;

    if (currentIdx + 1 >= quizQuestions.length) {
      const myCorrect = correctCount;
      const isChallenger = activeChallenge.challenger_id === profile.id;
      const currentResult: ChallengeResult = activeChallenge.result ?? {};
      let newResult: ChallengeResult;
      let newStatus: string;

      if (isChallenger) {
        newResult = { ...currentResult, challenger_correct: myCorrect };
        newStatus = currentResult.challenged_correct != null ? 'completed' : 'challenger_done';
        if (newStatus === 'completed' && currentResult.challenged_correct != null) {
          newResult.winner_id = myCorrect > currentResult.challenged_correct ? profile.id
            : myCorrect < currentResult.challenged_correct ? activeChallenge.challenged_id
            : null;
        }
      } else {
        const challengerCorrect = currentResult.challenger_correct;
        const winnerId = challengerCorrect != null
          ? (myCorrect > challengerCorrect ? profile.id
             : myCorrect < challengerCorrect ? activeChallenge.challenger_id
             : null)
          : null;
        newResult = { ...currentResult, challenged_correct: myCorrect, winner_id: winnerId };
        newStatus = 'completed';
      }

      await supabase
        .from('challenges')
        .update({
          status: newStatus,
          result: newResult,
          ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
        })
        .eq('id', activeChallenge.id);

      const xpReward = myCorrect * 20;
      if (xpReward > 0) await addXp('knowledge', xpReward);

      const opponentCorrect = isChallenger ? newResult.challenged_correct ?? null : newResult.challenger_correct ?? null;
      const won = newResult.winner_id == null ? null : newResult.winner_id === profile.id;
      setResult({ won, myCorrect, opponentCorrect, xpEarned: xpReward });
      setView('result');
      loadChallenges();
      return;
    }

    setCurrentIdx((i) => i + 1);
    setSelectedChoice(null);
    setAnswered(false);
  }

  const q = quizQuestions[currentIdx];

  if (view === 'subject_pick') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.inner}>
        <TouchableOpacity onPress={() => setView('list')} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.primary }]}>← キャンセル</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>科目を選んで挑戦</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          ランダムな相手にクイズチャレンジを送ります
        </Text>
        {SUBJECTS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.subjectCard,
              {
                backgroundColor: selectedSubject === s.id ? theme.primary + '18' : theme.surface,
                borderColor: selectedSubject === s.id ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setSelectedSubject(s.id)}
          >
            <Text style={[styles.subjectLabel, { color: selectedSubject === s.id ? theme.primary : theme.text }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.startChallengeBtn, { backgroundColor: theme.primary }]}
          onPress={handleCreateChallenge}
        >
          <Text style={styles.startChallengeBtnText}>⚔️ 挑戦状を送る</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (view === 'quiz' && q) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.inner}>
        <Text style={[styles.title, { color: theme.text }]}>⚔️ 対戦クイズ</Text>
        <Text style={[styles.qProgress, { color: theme.textSecondary }]}>
          {currentIdx + 1} / {quizQuestions.length} 問
        </Text>
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
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.primary }]} onPress={handleQuizNext}>
            <Text style={styles.nextBtnText}>
              {currentIdx + 1 >= quizQuestions.length ? '結果を見る' : '次へ'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  if (view === 'result' && result) {
    const resultColor = result.won === true ? '#FFD700' : result.won === false ? '#FF4560' : theme.text;
    const bgColor = result.won === true ? '#FFD70018' : result.won === false ? '#FF456018' : theme.surface;
    const borderColor = result.won === true ? '#FFD700' : result.won === false ? '#FF4560' : theme.border;
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.inner}>
        <Text style={[styles.title, { color: theme.text }]}>対戦結果</Text>
        <View style={[styles.resultCard, { backgroundColor: bgColor, borderColor }]}>
          <Text style={styles.resultEmoji}>
            {result.won === true ? '🏆' : result.won === false ? '😤' : result.opponentCorrect == null ? '⏳' : '🤝'}
          </Text>
          <Text style={[styles.resultTitle, { color: resultColor }]}>
            {result.won === true ? '勝利！'
              : result.won === false ? '敗北...'
              : result.opponentCorrect == null ? '相手の回答待ち'
              : '引き分け'}
          </Text>
          <Text style={[styles.resultScore, { color: theme.text }]}>
            あなた: {result.myCorrect}/{quizQuestions.length} 正解
          </Text>
          {result.opponentCorrect != null ? (
            <Text style={[styles.resultScore, { color: theme.textSecondary }]}>
              相手: {result.opponentCorrect}/{quizQuestions.length} 正解
            </Text>
          ) : (
            <Text style={[styles.waitText, { color: theme.textSecondary }]}>
              相手の回答を待っています...
            </Text>
          )}
          <Text style={[styles.xpEarned, { color: theme.primary }]}>+{result.xpEarned} XP 獲得</Text>
        </View>
        <TouchableOpacity
          style={[styles.backToListBtn, { backgroundColor: theme.primary }]}
          onPress={() => { setView('list'); setResult(null); setActiveChallenge(null); }}
        >
          <Text style={styles.backToListBtnText}>リストに戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const incoming = challenges.filter(
    (c) => c.challenged_id === profile?.id && (c.status === 'pending' || c.status === 'challenger_done')
  );
  const outgoing = challenges.filter((c) => c.challenger_id === profile?.id);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.inner}>
      <Text style={[styles.title, { color: theme.text }]}>⚔️ ピア対戦</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>他のユーザーとクイズで対決しよう</Text>

      <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.primary }]} onPress={() => setView('subject_pick')}>
        <Text style={styles.createBtnText}>+ 挑戦状を送る</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
      ) : (
        <>
          {incoming.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>📨 受信した挑戦 ({incoming.length})</Text>
              {incoming.map((c) => (
                <View key={c.id} style={[styles.challengeCard, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
                  <Text style={[styles.challengeTitle, { color: theme.text }]}>クイズチャレンジ</Text>
                  <Text style={[styles.challengeSub, { color: theme.textSecondary }]}>
                    科目: {SUBJECTS.find((s) => s.id === c.subject)?.label ?? c.subject}
                  </Text>
                  <View style={styles.challengeBtns}>
                    <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: theme.primary }]} onPress={() => handleAcceptChallenge(c)}>
                      <Text style={styles.acceptBtnText}>受ける</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.declineBtn, { borderColor: theme.error }]} onPress={() => handleDeclineChallenge(c.id)}>
                      <Text style={[styles.declineBtnText, { color: theme.error }]}>断る</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {outgoing.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>📤 送った挑戦 ({outgoing.length})</Text>
              {outgoing.map((c) => {
                const statusLabel = c.status === 'completed' ? '完了'
                  : c.status === 'declined' ? '断られた'
                  : c.status === 'challenger_done' ? '相手の回答待ち'
                  : '保留中';
                const statusColor = c.status === 'completed' ? '#27AE60'
                  : c.status === 'declined' ? theme.error
                  : theme.textSecondary;
                const myCorrect = c.result?.challenger_correct;
                const opponentCorrect = c.result?.challenged_correct;
                const winLabel = c.result?.winner_id === profile?.id ? '🏆 勝利'
                  : c.result?.winner_id == null ? '🤝 引き分け'
                  : '😤 敗北';
                return (
                  <View key={c.id} style={[styles.challengeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.challengeTopRow}>
                      <Text style={[styles.challengeTitle, { color: theme.text }]}>クイズチャレンジ</Text>
                      <Text style={[styles.statusBadge, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                    <Text style={[styles.challengeSub, { color: theme.textSecondary }]}>
                      科目: {SUBJECTS.find((s) => s.id === c.subject)?.label ?? c.subject}
                    </Text>
                    {c.status === 'completed' && myCorrect != null && opponentCorrect != null && (
                      <Text style={[styles.scoreText, { color: theme.text }]}>
                        {myCorrect} vs {opponentCorrect} 正解 — {winLabel}
                      </Text>
                    )}
                    {c.status === 'pending' && myCorrect == null && (
                      <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: theme.primary, marginTop: 6 }]} onPress={() => handleAcceptChallenge(c)}>
                        <Text style={styles.acceptBtnText}>自分の回答を入力</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {incoming.length === 0 && outgoing.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.emptyEmoji}>⚔️</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                まだ対戦がありません{'\n'}挑戦状を送って対決しよう！
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 20 },
  createBtn: { height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 8 },
  challengeCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  challengeTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  challengeTitle: { fontSize: 14, fontWeight: '700' },
  challengeSub: { fontSize: 12, marginBottom: 10 },
  statusBadge: { fontSize: 12, fontWeight: '700' },
  scoreText: { fontSize: 13, fontWeight: '600' },
  challengeBtns: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flex: 1, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  declineBtn: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  declineBtnText: { fontSize: 14, fontWeight: '600' },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 30, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600' },
  subjectCard: { borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 10 },
  subjectLabel: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  startChallengeBtn: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  startChallengeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  qProgress: { fontSize: 13, marginBottom: 12 },
  questionCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  questionText: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  choiceBtn: { borderRadius: 12, borderWidth: 1.5, padding: 14, marginBottom: 8 },
  choiceText: { fontSize: 14, fontWeight: '600' },
  nextBtn: { height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: { borderRadius: 20, borderWidth: 1.5, padding: 24, alignItems: 'center', gap: 6, marginBottom: 20 },
  resultEmoji: { fontSize: 56 },
  resultTitle: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
  resultScore: { fontSize: 15, fontWeight: '600' },
  waitText: { fontSize: 13, fontStyle: 'italic' },
  xpEarned: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  backToListBtn: { height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  backToListBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

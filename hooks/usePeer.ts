import { useState, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { QuizQuestion } from '../types';
import { japaneseQuestions } from '../modules/knowledge/questions/japanese';
import { mathQuestions } from '../modules/knowledge/questions/math';
import { englishQuestions } from '../modules/knowledge/questions/english';
import { socialQuestions } from '../modules/knowledge/questions/social';

const ALL_QUESTIONS: QuizQuestion[] = [
  ...japaneseQuestions,
  ...mathQuestions,
  ...englishQuestions,
  ...socialQuestions,
].map((q, i) => ({ ...q, id: `local_${i}` })) as QuizQuestion[];

interface ChallengeResult {
  question_indices?: number[];
  challenger_correct?: number;
  challenged_correct?: number;
  winner_id?: string | null;
}

export interface PeerChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  challenge_type: string;
  subject: string;
  status: string;
  result: ChallengeResult | null;
  created_at: string;
}

export function usePeer() {
  const profile = useUserStore((s) => s.profile);
  const [challenges, setChallenges] = useState<PeerChallenge[]>([]);
  const [loading, setLoading] = useState(false);

  const loadChallenges = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setChallenges(data as PeerChallenge[]);
    setLoading(false);
  }, [profile?.id]);

  function pickQuestions(subject: string, indices?: number[]): QuizQuestion[] {
    if (indices && indices.length > 0) {
      return indices.map((i) => ALL_QUESTIONS[i]).filter(Boolean);
    }
    const pool =
      subject === 'all' ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.subject === subject);
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
  }

  async function createChallenge(
    subject: string
  ): Promise<{ challenge: PeerChallenge; questions: QuizQuestion[] } | null> {
    if (!profile?.id) return null;
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username')
      .neq('id', profile.id)
      .limit(20);
    if (!users || users.length === 0) return null;

    const opponent = users[Math.floor(Math.random() * users.length)];
    const questions = pickQuestions(subject);
    const questionIndices = questions.map((q) => ALL_QUESTIONS.indexOf(q));

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        challenger_id: profile.id,
        challenged_id: opponent.id,
        challenge_type: 'quiz',
        subject,
        status: 'pending',
        result: { question_indices: questionIndices },
      })
      .select()
      .single();

    if (error || !challenge) return null;
    await loadChallenges();
    return { challenge: challenge as PeerChallenge, questions };
  }

  async function submitAnswer(
    challenge: PeerChallenge,
    correctCount: number
  ): Promise<{ won: boolean | null; opponentCorrect: number | null }> {
    if (!profile?.id) return { won: null, opponentCorrect: null };
    const isChallenger = challenge.challenger_id === profile.id;
    const currentResult: ChallengeResult = challenge.result ?? {};
    let newResult: ChallengeResult;
    let newStatus: string;

    if (isChallenger) {
      newResult = { ...currentResult, challenger_correct: correctCount };
      newStatus =
        currentResult.challenged_correct != null ? 'completed' : 'challenger_done';
      if (newStatus === 'completed' && currentResult.challenged_correct != null) {
        newResult.winner_id =
          correctCount > currentResult.challenged_correct
            ? profile.id
            : correctCount < currentResult.challenged_correct
            ? challenge.challenged_id
            : null;
      }
    } else {
      const challengerCorrect = currentResult.challenger_correct;
      const winnerId =
        challengerCorrect != null
          ? correctCount > challengerCorrect
            ? profile.id
            : correctCount < challengerCorrect
            ? challenge.challenger_id
            : null
          : null;
      newResult = { ...currentResult, challenged_correct: correctCount, winner_id: winnerId };
      newStatus = 'completed';
    }

    await supabase
      .from('challenges')
      .update({
        status: newStatus,
        result: newResult,
        ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq('id', challenge.id);

    await loadChallenges();
    const opponentCorrect = isChallenger
      ? newResult.challenged_correct ?? null
      : newResult.challenger_correct ?? null;
    const won =
      newResult.winner_id == null ? null : newResult.winner_id === profile.id;
    return { won, opponentCorrect };
  }

  async function declineChallenge(challengeId: string): Promise<void> {
    await supabase.from('challenges').update({ status: 'declined' }).eq('id', challengeId);
    await loadChallenges();
  }

  const incoming = challenges.filter(
    (c) =>
      c.challenged_id === profile?.id &&
      (c.status === 'pending' || c.status === 'challenger_done')
  );
  const outgoing = challenges.filter((c) => c.challenger_id === profile?.id);

  return {
    challenges,
    loading,
    incoming,
    outgoing,
    loadChallenges,
    pickQuestions,
    createChallenge,
    submitAnswer,
    declineChallenge,
  };
}

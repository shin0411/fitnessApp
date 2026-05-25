import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { UserLevel, Profile, ProfileDetails, Streak } from '../types';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { setProfile, setProfileDetails, setLevels, setStreaks } = useUserStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserData(session.user.id);
      } else {
        useUserStore.getState().reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(userId: string) {
    const [profileRes, detailsRes, levelsRes, streaksRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('profile_details').select('*').eq('user_id', userId).single(),
      supabase.from('user_levels').select('*').eq('user_id', userId),
      supabase.from('streaks').select('*').eq('user_id', userId),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (detailsRes.data) setProfileDetails(detailsRes.data as ProfileDetails);
    if (levelsRes.data) setLevels(levelsRes.data as UserLevel[]);
    if (streaksRes.data) setStreaks(streaksRes.data as Streak[]);
  }

  return { session, loading };
}

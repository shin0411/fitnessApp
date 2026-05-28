'use client';

import { create } from 'zustand';
import { Profile, UserLevel } from '@/types';

interface UserStore {
  profile: Profile | null;
  levels: UserLevel[];
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  setLevels: (levels: UserLevel[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  levels: [],
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setLevels: (levels) => set({ levels }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ profile: null, levels: [], isLoading: false }),
}));

import { create } from 'zustand';
import { Profile, ProfileDetails, UserLevel, ThemeName, Streak, Mode } from '../types';

interface UserState {
  profile: Profile | null;
  profileDetails: ProfileDetails | null;
  levels: Record<string, UserLevel>;
  streaks: Streak[];
  currentMode: Mode;
  setProfile: (profile: Profile | null) => void;
  setProfileDetails: (details: ProfileDetails | null) => void;
  setLevels: (levels: UserLevel[]) => void;
  setStreaks: (streaks: Streak[]) => void;
  setMode: (mode: Mode) => void;
  setTheme: (theme: ThemeName) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  profileDetails: null,
  levels: {},
  streaks: [],
  currentMode: 'normal',
  setProfile: (profile) => set({ profile }),
  setProfileDetails: (profileDetails) => set({ profileDetails }),
  setLevels: (levels) => {
    const map: Record<string, UserLevel> = {};
    for (const l of levels) map[l.level_type] = l;
    set({ levels: map });
  },
  setStreaks: (streaks) => set({ streaks }),
  setMode: (currentMode) => set({ currentMode }),
  setTheme: (theme) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, theme } : null,
    })),
  reset: () =>
    set({ profile: null, profileDetails: null, levels: {}, streaks: [], currentMode: 'normal' }),
}));

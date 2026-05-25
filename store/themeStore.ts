import { create } from 'zustand';
import { ThemeName } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  themeName: ThemeName;
  setTheme: (name: ThemeName) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeName: 'simple',
  setTheme: async (name) => {
    set({ themeName: name });
    await AsyncStorage.setItem('theme', name);
  },
  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('theme');
    if (saved && ['kawaii', 'cool', 'beautiful', 'simple'].includes(saved)) {
      set({ themeName: saved as ThemeName });
    }
  },
}));

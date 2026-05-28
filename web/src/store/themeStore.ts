'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeName, ThemeColors } from '@/types';

export const themes: Record<ThemeName, ThemeColors> = {
  simple: {
    primary: '#2D2D2D',
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666',
    border: '#E5E5E5',
    accent: '#555',
  },
  kawaii: {
    primary: '#FF8FAB',
    bg: '#FFF0F5',
    surface: '#FFFFFF',
    text: '#2D2D2D',
    textSecondary: '#888',
    border: '#FFD6E0',
    accent: '#FF6B9D',
  },
  cool: {
    primary: '#00FFCC',
    bg: '#0A0A1A',
    surface: '#141428',
    text: '#FFFFFF',
    textSecondary: '#AAA',
    border: '#1E1E3A',
    accent: '#00CCFF',
  },
  beautiful: {
    primary: '#C9A84C',
    bg: '#1A1209',
    surface: '#241A0A',
    text: '#F5E6C8',
    textSecondary: '#B8985A',
    border: '#3D2E12',
    accent: '#E8C96A',
  },
};

interface ThemeStore {
  themeName: ThemeName;
  theme: ThemeColors;
  setTheme: (name: ThemeName) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeName: 'cool',
      theme: themes.cool,
      setTheme: (name: ThemeName) =>
        set({ themeName: name, theme: themes[name] }),
    }),
    {
      name: 'fitnessrpg-theme',
    }
  )
);

import React, { createContext, useContext } from 'react';
import { ThemeColors, ThemeName } from '../types';
import { kawaii } from './themes/kawaii';
import { cool } from './themes/cool';
import { beautiful } from './themes/beautiful';
import { simple } from './themes/simple';

const themes: Record<ThemeName, ThemeColors> = { kawaii, cool, beautiful, simple };

const ThemeContext = createContext<ThemeColors>(simple);

export function ThemeProvider({
  children,
  themeName,
}: {
  children: React.ReactNode;
  themeName: ThemeName;
}) {
  return (
    <ThemeContext.Provider value={themes[themeName]}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}

export function getTheme(name: ThemeName): ThemeColors {
  return themes[name];
}

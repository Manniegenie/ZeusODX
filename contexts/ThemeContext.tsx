import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

const THEME_KEY = 'zeus-app-theme';

export const lightColors = {
  background: '#F4F2FF',
  card: '#FFFFFF',
  primary: '#35297F',
  primaryForeground: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#9B9B9B',
  border: '#E5E5E5',
  separator: '#F3F4F6',
  headerBg: '#35297F',
  headerText: '#FFFFFF',
  headerSubText: '#E5E7EB',
  inputBg: '#F9FAFB',
  destructive: '#EF4444',
  success: '#10B981',
  switchTrackOff: '#E5E7EB',
  switchTrackOn: '#10B981',
  iconBg: '#EEF2FF',
  iconFg: '#35297F',
  statusBar: 'dark-content' as 'light-content' | 'dark-content',
};

export const darkColors: typeof lightColors = {
  background: '#1B2333',
  card: '#22304A',
  primary: '#8B7CF6',
  primaryForeground: '#FFFFFF',
  text: '#D0D9E8',
  textSecondary: '#8FA3BF',
  textMuted: '#5A7090',
  border: '#2C3F5A',
  separator: '#2C3F5A',
  headerBg: '#131D2B',
  headerText: '#FFFFFF',
  headerSubText: '#8FA3BF',
  inputBg: '#1E2D42',
  destructive: '#F87171',
  success: '#34D399',
  switchTrackOff: '#374151',
  switchTrackOn: '#8B7CF6',
  iconBg: '#35297F',
  iconFg: '#FFFFFF',
  statusBar: 'light-content' as 'light-content' | 'dark-content',
};

export type AppColors = typeof lightColors;

type ThemeContextType = {
  isDark: boolean;
  colors: AppColors;
  toggle: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  // Load saved preference on mount — render immediately with default (light)
  // and snap to saved value once AsyncStorage responds
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'dark') setIsDark(true);
      else if (saved === 'light') setIsDark(false);
      else setIsDark(Appearance.getColorScheme() === 'dark');
    });
  }, []);

  const toggle = useCallback(async (value: boolean) => {
    setIsDark(value);
    await AsyncStorage.setItem(THEME_KEY, value ? 'dark' : 'light');
  }, []);

  const value = useMemo(
    () => ({ isDark, colors: isDark ? darkColors : lightColors, toggle }),
    [isDark, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

import { useEffect, useState } from 'react';
import type { ThemeMode } from '../types/simulation';

const STORAGE_KEY = 'aegis-er-theme';

export function useTheme(): { theme: ThemeMode; toggleTheme: () => void } {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}

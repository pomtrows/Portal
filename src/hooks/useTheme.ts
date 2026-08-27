import { useState, useEffect } from 'react';
import { syncPreferenceToCloud } from './usePreferences';

export type Theme = 'tokyo-night' | 'light' | 'nord' | 'dracula' | 'midnight';

const THEME_LISTENERS = new Set<(t: Theme) => void>();

function getStoredTheme(): Theme {
  const saved = localStorage.getItem('portal-theme');
  if (saved === 'tokyo-night' || saved === 'light' || saved === 'nord' || saved === 'dracula' || saved === 'midnight') {
    return saved as Theme;
  }
  return 'light';
}

let globalTheme: Theme = getStoredTheme();

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(globalTheme);

  useEffect(() => {
    // Initial DOM attribute sync
    document.documentElement.setAttribute('data-theme', theme);

    const listener = (newTheme: Theme) => {
      setThemeState(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };
    THEME_LISTENERS.add(listener);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'portal-theme' && e.newValue) {
        const val = e.newValue as Theme;
        globalTheme = val;
        THEME_LISTENERS.forEach((l) => l(val));
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      THEME_LISTENERS.delete(listener);
      window.removeEventListener('storage', handleStorage);
    };
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    globalTheme = newTheme;
    localStorage.setItem('portal-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setThemeState(newTheme);
    THEME_LISTENERS.forEach((l) => l(newTheme));
    syncPreferenceToCloud({ theme: newTheme });
  };

  return { theme, setTheme };
}

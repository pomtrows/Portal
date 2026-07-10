import { useState, useEffect } from 'react';

export type Theme = 'tokyo-night' | 'light' | 'nord' | 'dracula' | 'midnight';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage or default to 'tokyo-night'
    const saved = localStorage.getItem('portal-theme');
    return (saved as Theme) || 'tokyo-night';
  });

  useEffect(() => {
    // Apply theme to html tag
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage
    localStorage.setItem('portal-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return { theme, setTheme };
}

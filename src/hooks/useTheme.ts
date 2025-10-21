import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'dice-game-theme';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      return saved || 'system';
    }
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Применяем тему к HTML элементу
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const html = document.documentElement;
    const currentTheme = theme === 'system' ? systemTheme : theme;
    
    // Удаляем все классы тем
    html.classList.remove('theme-light', 'theme-dark', 'theme-system');
    
    // Добавляем класс для выбранной темы
    html.classList.add(`theme-${theme}`);
    
    // Устанавливаем атрибут data-theme для CSS переменных
    html.setAttribute('data-theme', currentTheme);
    
    // Устанавливаем color-scheme для браузера
    html.style.colorScheme = currentTheme;
  }, [theme, systemTheme]);

  const currentTheme = theme === 'system' ? systemTheme : theme;

  return {
    theme,
    setTheme,
    currentTheme,
    systemTheme
  };
};
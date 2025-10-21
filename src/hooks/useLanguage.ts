import { useCallback, useSyncExternalStore } from 'react';
import { locales, type Locale, getDefaultLanguage } from '../locales';

const LANGUAGE_STORAGE_KEY = 'dice-game-language';

// Глобальный стор языка, чтобы все компоненты обновлялись синхронно без провайдера
type LanguageListener = () => void;
const languageListeners = new Set<LanguageListener>();

let currentLanguageState: Locale = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Locale;
    if (saved && locales[saved]) return saved;
  }
  return getDefaultLanguage();
})();

function subscribeLanguage(listener: LanguageListener) {
  languageListeners.add(listener);
  return () => languageListeners.delete(listener);
}

function setGlobalLanguage(lang: Locale) {
  if (!locales[lang] || currentLanguageState === lang) return;
  currentLanguageState = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguageState);
  }
  // Уведомляем всех подписчиков
  languageListeners.forEach((l) => {
    try { l(); } catch { /* noop */ }
  });
}

function getGlobalLanguage() {
  return currentLanguageState;
}

// Тип для интерполяции переменных в переводах
type InterpolationParams = Record<string, string | number>;

// Функция для получения вложенного значения по пути (например, 'common.close')
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

// Функция для интерполяции переменных в строке
function interpolate(template: string, params: InterpolationParams = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

export const useLanguage = () => {
  // Подписываемся на глобальный стор языка
  const currentLanguage = useSyncExternalStore(
    subscribeLanguage,
    getGlobalLanguage,
    getGlobalLanguage
  );

  // Функция для смены языка
  const changeLanguage = useCallback((language: Locale) => {
    setGlobalLanguage(language);
  }, []);

  // Основная функция перевода
  const t = useCallback((key: string, params?: InterpolationParams): string => {
    const currentLocale = locales[currentLanguage];
    if (!currentLocale) {
      console.warn(`Locale '${currentLanguage}' not found`);
      return key;
    }

    const translation = getNestedValue(currentLocale, key);
    
    if (translation === key) {
      console.warn(`Translation key '${key}' not found for locale '${currentLanguage}'`);
      // Пытаемся найти в русском как fallback
      const fallbackTranslation = getNestedValue(locales.ru, key);
      if (fallbackTranslation !== key) {
        return params ? interpolate(fallbackTranslation, params) : fallbackTranslation;
      }
    }

    return params ? interpolate(translation, params) : translation;
  }, [currentLanguage]);

  // Функция для получения информации о текущем языке
  const getCurrentLanguageInfo = useCallback(() => {
    const supportedLanguages = [
      { code: 'ru', name: t('languages.ru'), flag: '🇷🇺', nativeName: t('nativeNames.ru') },
    { code: 'en', name: t('languages.en'), flag: '🇺🇸', nativeName: t('nativeNames.en') },
    { code: 'zh', name: t('languages.zh'), flag: '🇨🇳', nativeName: t('nativeNames.zh') }
    ];
    
    return supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];
  }, [currentLanguage, t]);

  // Функция для проверки, доступен ли ключ перевода
  const hasTranslation = useCallback((key: string): boolean => {
    const currentLocale = locales[currentLanguage];
    if (!currentLocale) return false;
    
    const translation = getNestedValue(currentLocale, key);
    return translation !== key;
  }, [currentLanguage]);

  return {
    currentLanguage,
    changeLanguage,
    t,
    getCurrentLanguageInfo,
    hasTranslation,
    availableLanguages: [
      { code: 'ru', name: t('languages.ru'), flag: '🇷🇺', nativeName: t('nativeNames.ru') },
    { code: 'en', name: t('languages.en'), flag: '🇺🇸', nativeName: t('nativeNames.en') },
    { code: 'zh', name: t('languages.zh'), flag: '🇨🇳', nativeName: t('nativeNames.zh') }
    ] as const,
    // Получаем переводы названий тем
    getThemeNames: useCallback(() => {
      return [
        { code: 'system', name: t('settings.themes.system'), description: t('settings.themes.systemDescription'), icon: '🔄' },
        { code: 'light', name: t('settings.themes.light'), description: t('settings.themes.lightDescription'), icon: '☀️' },
        { code: 'dark', name: t('settings.themes.dark'), description: t('settings.themes.darkDescription'), icon: '🌙' }
      ];
    }, [t])
  };
};

export default useLanguage;
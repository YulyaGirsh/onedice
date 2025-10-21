import ru from './ru.json';
import en from './en.json';
import zh from './zh.json';

export const locales = {
  ru,
  en,
  zh
} as const;

export type Locale = keyof typeof locales;
export type LocaleKeys = keyof typeof ru;

// Поддерживаемые языки с метаданными
export const supportedLanguages = [
  {
    code: 'ru' as const,
    name: 'languages.ru',
    flag: '🇷🇺',
    nativeName: 'nativeNames.ru'
  },
  {
    code: 'en' as const,
    name: 'languages.en',
    flag: '🇺🇸',
    nativeName: 'nativeNames.en'
  },
  {
    code: 'zh' as const,
    name: 'languages.zh',
    flag: '🇨🇳',
    nativeName: 'nativeNames.zh'
  }
] as const;

// Функция для получения языка по умолчанию
export const getDefaultLanguage = (): Locale => {
  // Пытаемся получить язык из Telegram WebApp
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
    const telegramLang = window.Telegram.WebApp.initDataUnsafe.user.language_code;
    
    // Маппинг языковых кодов Telegram на наши локали
    const langMap: Record<string, Locale> = {
      'ru': 'ru',
      'en': 'en',
      'zh': 'zh',
      'zh-cn': 'zh',
      'zh-tw': 'zh'
    };
    
    if (langMap[telegramLang]) {
      return langMap[telegramLang];
    }
  }
  
  // Пытаемся получить язык из браузера
  if (typeof window !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.toLowerCase();
    
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('en')) return 'en';
  }
  
  // По умолчанию русский
  return 'ru';
};

export default locales;
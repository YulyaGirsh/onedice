// Типы для пользователя Telegram
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_bot?: boolean;
  is_premium?: boolean;
}

// Типы для пользователя приложения
export interface UserInfo {
  firstName: string;
  lastName: string;
  username: string;
  photoUrl: string;
}

export interface PlayerStats {
  rating: number;
  ratingTitle: string;
  balance: number;
}

// Отдельный тип для рейтинга (используется в useGameData)
export interface PlayerRating {
  rating: number;
  ratingTitle: string;
}

// Типы для игр
// Типы для игроков
export interface Player {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  telegramUsername?: string;
  name?: string; // Полное имя игрока
  telegramData?: TelegramUser; // Данные из Telegram
  role: 'creator' | 'player';
  joinedAt: number;
  isReady?: boolean; // Готовность игрока к игре
  online?: boolean; // Присутствие игрока (онлайн/офлайн)
}

// Типы для игр
export interface Game {
  id: string; // UUID строка
  creatorId: string;
  creatorName: string;
  price: number; // в TON
  maxPlayers: number;
  currentPlayers: number;
  isPrivate: boolean;
  isAnonymous: boolean; // Скрыть username создателя
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  type: '1v1' | 'lobby';
  isMyGame?: boolean; // Флаг для определения собственных игр
  creatorFirstName?: string;
  creatorLastName?: string;
}

export interface CreateGameData {
  price: number;
  maxPlayers: number;
  isPrivate: boolean;
  isAnonymous: boolean; // Скрыть username создателя
  type: '1v1' | 'lobby';
}

// Типы для результатов игры
export interface DiceResult {
  playerId: string;
  playerName: string;
  diceValue: number;
}

export interface GameResults {
  results: DiceResult[];
  winner: DiceResult;
  timestamp?: number;
  tieResolved?: boolean;
  rerollCount?: number;
}

// Типы для функции "играть снова"
export interface PlayAgainRequest {
  timestamp: number;
  playerName: string;
}

export interface PlayAgainResponse {
  status: 'ready_to_play' | 'waiting' | 'player_left' | 'player_offline' | 'declined';
  message: string;
  waitingFor?: Array<{
    id: string;
    username: string;
  }>;
  readyPlayers?: Array<{
    id: string;
    username: string;
  }>;
  decliner?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  initiator?: {
    id: string;
    username: string;
  };
  playAgainRequests?: Record<string, PlayAgainRequest>;
  lobby?: any; // Можно типизировать более строго при необходимости
}

export interface PlayAgainStatus {
  allReady: boolean;
  status?: 'ready_to_play' | 'waiting' | 'player_left' | 'player_offline' | 'declined';
  message?: string;
  decliner?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  initiator?: {
    id: string;
    username: string;
  };
  playAgainRequests: Record<string, PlayAgainRequest>;
  waitingFor: Array<{
    id: string;
    username: string;
  }>;
  totalPlayers: number;
  readyPlayers: Array<{
    id: string;
    username: string;
  }>;
}

// Типы для страниц
export type PageType = 'play' | 'rating' | 'shop' | 'profile' | 'settings' | 'debug';
export type GameFilter = 'all' | 'my';

// Типы для Telegram WebApp
export interface SafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface TelegramWebApp {
  // Основные свойства
  initDataUnsafe: any;
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: any;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isFullscreen: boolean;
  
  // Методы
  ready: () => void;
  expand: () => void;
  close: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showPopup: (params: any, callback?: (buttonId: string) => void) => void;
  switchInlineQuery?: (query: string, choose_chat_types?: string[]) => void;
  openTelegramLink?: (url: string) => void;
  
  // Цвета
  setBackgroundColor: (color: string) => void;
  setHeaderColor: (color: string) => void;
  
  // Haptic Feedback
  hapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  
  // Cloud Storage
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error?: string) => void) => void;
    getItem: (key: string, callback: (error?: string, value?: string) => void) => void;
    removeItem: (key: string, callback?: (error?: string) => void) => void;
  };
  
  // BackButton
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    isVisible: boolean;
  };
  
  // Closing Confirmation
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  isClosingConfirmationEnabled: boolean;
  
  // Ориентация
  lockOrientation: () => void;
  unlockOrientation: () => void;
  isOrientationLocked: boolean;
  
  // Полноэкранный режим
  requestFullscreen: () => void;
  
  // Вертикальные свайпы
  enableVerticalSwipes: () => void;
  disableVerticalSwipes: () => void;
  isVerticalSwipesEnabled: boolean;
  
  // Цвета
  setBottomBarColor: (color: string) => void;
  
  // Safe Area
  safeAreaInset: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  contentSafeAreaInset: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // События
  onEvent: (eventType: string, callback: (data?: any) => void) => void;
  offEvent: (eventType: string, callback: (data?: any) => void) => void;
}

// Глобальные типы для Window
declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
      WebView?: {
        postEvent: (eventType: string, eventData?: any) => void;
      };
    };
  }
  

}
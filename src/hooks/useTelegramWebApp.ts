import { useEffect, useState } from 'react';

interface TelegramWebAppData {
  initData: string;
  initDataUnsafe: any;
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: any;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
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
  isVerticalSwipesEnabled: boolean;
  isOrientationLocked: boolean;
  isFullscreen: boolean;
  ready: () => void;
  expand: () => void;
  close: () => void;
  requestFullscreen: () => void;
  lockOrientation: () => void;
  unlockOrientation: () => void;
  enableVerticalSwipes: () => void;
  disableVerticalSwipes: () => void;
  setBackgroundColor: (color: string) => void;
  setHeaderColor: (color: string) => void;
  setBottomBarColor: (color: string) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  onEvent: (eventType: string, callback: (data?: any) => void) => void;
  offEvent: (eventType: string, callback: (data?: any) => void) => void;
  hapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  cloudStorage: {
    setItem: (key: string, value: string, callback?: (error?: string) => void) => void;
    getItem: (key: string, callback: (error?: string, value?: string) => void) => void;
    removeItem: (key: string, callback?: (error?: string) => void) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    isVisible: boolean;
  };
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  isClosingConfirmationEnabled: boolean;
  // Telegram link helpers
  openTelegramLink?: (url: string) => void;
  switchInlineQuery?: (query: string, choose_chat_types?: string[]) => void;
}

export const useTelegramWebApp = (): TelegramWebAppData | null => {
  const [webApp, setWebApp] = useState<TelegramWebAppData | null>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    
    if (tg) {
      console.log('🚀 Инициализация расширенного Telegram WebApp SDK');
      
      // Инициализация WebApp
      tg.ready();
      
      // Расширяем WebApp до полного размера
      if (!tg.isExpanded) {
        tg.expand();
      }

      // Автоматически включаем полноэкранный режим для мобильных устройств
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile && tg.requestFullscreen && typeof tg.requestFullscreen === 'function') {
        try {
          tg.requestFullscreen();
          console.log('📱 Полноэкранный режим запрошен');
        } catch (error) {
          console.log('⚠️ Fullscreen request failed:', error);
        }
      }

      // Блокируем ориентацию для лучшего пользовательского опыта
      if (tg.lockOrientation && !tg.isOrientationLocked) {
        try {
          tg.lockOrientation();
          console.log('🔒 Ориентация заблокирована');
        } catch (error) {
          console.log('⚠️ Orientation lock failed:', error);
        }
      }

      // Отключаем вертикальные свайпы для предотвращения случайного закрытия
      if (tg.disableVerticalSwipes && tg.isVerticalSwipesEnabled) {
        try {
          tg.disableVerticalSwipes();
          console.log('🚫 Вертикальные свайпы отключены');
        } catch (error) {
          console.log('⚠️ Disable vertical swipes failed:', error);
        }
      }

      // Настройка цветов интерфейса
      try {
        if (tg.setBackgroundColor) {
          tg.setBackgroundColor('#1a1a2e');
          console.log('🎨 Background color установлен');
        }
        if (tg.setHeaderColor) {
          tg.setHeaderColor('#1a1a2e');
          console.log('🎨 Header color установлен');
        }
        if (tg.setBottomBarColor) {
          tg.setBottomBarColor('#1a1a2e');
          console.log('🎨 Bottom bar color установлен');
        }
      } catch (error) {
        console.log('⚠️ Color setting failed:', error);
      }

      console.log('📊 Состояние Telegram WebApp после инициализации:', {
        version: tg.version,
        platform: tg.platform,
        isExpanded: tg.isExpanded,
        isFullscreen: tg.isFullscreen,
        viewportHeight: tg.viewportHeight,
        safeAreaInset: tg.safeAreaInset,
        contentSafeAreaInset: tg.contentSafeAreaInset
      });

      // Устанавливаем CSS переменную для fullscreen режима
      document.documentElement.style.setProperty('--tg-is-fullscreen', tg.isFullscreen ? '1' : '0');
      console.log('🔧 CSS переменная --tg-is-fullscreen установлена:', tg.isFullscreen ? '1' : '0');

      // Создаем объект с упрощенным API
      const webAppData: TelegramWebAppData = {
        initData: '', // Убираем tg.initData, так как его нет в типах
        initDataUnsafe: tg.initDataUnsafe || {},
        version: tg.version || '6.0',
        platform: tg.platform || 'unknown',
        colorScheme: tg.colorScheme || 'dark',
        themeParams: tg.themeParams || {},
        isExpanded: tg.isExpanded || false,
        viewportHeight: tg.viewportHeight || window.innerHeight,
        viewportStableHeight: tg.viewportStableHeight || window.innerHeight,
        safeAreaInset: tg.safeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 },
        contentSafeAreaInset: tg.contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 },
        isVerticalSwipesEnabled: tg.isVerticalSwipesEnabled ?? true,
        isOrientationLocked: tg.isOrientationLocked ?? false,
        isFullscreen: tg.isFullscreen ?? false,
        ready: () => tg.ready(),
        expand: () => tg.expand(),
        close: () => tg.close(),
        requestFullscreen: () => {
          if (tg.requestFullscreen) {
            tg.requestFullscreen();
          }
        },
        lockOrientation: () => {
          if (tg.lockOrientation) {
            tg.lockOrientation();
          }
        },
        unlockOrientation: () => {
          if (tg.unlockOrientation) {
            tg.unlockOrientation();
          }
        },
        enableVerticalSwipes: () => {
          if (tg.enableVerticalSwipes) {
            tg.enableVerticalSwipes();
          }
        },
        disableVerticalSwipes: () => {
          if (tg.disableVerticalSwipes) {
            tg.disableVerticalSwipes();
          }
        },
        setBackgroundColor: (color: string) => {
          if (tg.setBackgroundColor) {
            tg.setBackgroundColor(color);
          }
        },
        setHeaderColor: (color: string) => {
          if (tg.setHeaderColor) {
            tg.setHeaderColor(color);
          }
        },
        setBottomBarColor: (color: string) => {
          if (tg.setBottomBarColor) {
            tg.setBottomBarColor(color);
          }
        },
        showAlert: (message: string, callback?: () => void) => {
          if (tg.showAlert) {
            tg.showAlert(message, callback);
          }
        },
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {
          if (tg.showConfirm) {
            tg.showConfirm(message, callback);
          }
        },
        onEvent: (eventType: string, callback: (data?: any) => void) => {
          if (tg.onEvent) {
            tg.onEvent(eventType, callback);
          }
        },
        offEvent: (eventType: string, _callback: (data?: any) => void) => {
          if (tg.offEvent) {
            tg.offEvent(eventType, _callback);
          }
        },
        hapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
            if (tg.hapticFeedback?.impactOccurred) {
              tg.hapticFeedback.impactOccurred(style);
            }
          },
          notificationOccurred: (type: 'error' | 'success' | 'warning') => {
            if (tg.hapticFeedback?.notificationOccurred) {
              tg.hapticFeedback.notificationOccurred(type);
            }
          },
          selectionChanged: () => {
            if (tg.hapticFeedback?.selectionChanged) {
              tg.hapticFeedback.selectionChanged();
            }
          }
        },
        cloudStorage: {
          setItem: (key: string, value: string, callback?: (error?: string) => void) => {
            if (tg.CloudStorage?.setItem) {
              tg.CloudStorage.setItem(key, value, callback);
            }
          },
          getItem: (key: string, callback: (error?: string, value?: string) => void) => {
            if (tg.CloudStorage?.getItem) {
              tg.CloudStorage.getItem(key, callback);
            }
          },
          removeItem: (key: string, callback?: (error?: string) => void) => {
            if (tg.CloudStorage?.removeItem) {
              tg.CloudStorage.removeItem(key, callback);
            }
          }
        },
        BackButton: {
          show: () => tg.BackButton?.show?.(),
          hide: () => tg.BackButton?.hide?.(),
          onClick: (callback: () => void) => tg.BackButton?.onClick?.(callback),
          offClick: (callback: () => void) => tg.BackButton?.offClick?.(callback),
          isVisible: tg.BackButton?.isVisible ?? false,
        },
        enableClosingConfirmation: () => tg.enableClosingConfirmation?.(),
        disableClosingConfirmation: () => tg.disableClosingConfirmation?.(),
        isClosingConfirmationEnabled: tg.isClosingConfirmationEnabled ?? false,
        openTelegramLink: (url: string) => {
          if (typeof tg.openTelegramLink === 'function') {
            tg.openTelegramLink(url);
          } else {
            // Fallback на обычное открытие ссылки (например, в браузере при dev-режиме)
            window.open(url, '_blank');
          }
        },
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => {
          if (typeof tg.switchInlineQuery === 'function') {
            tg.switchInlineQuery(query, choose_chat_types);
          }
        }
      };

      setWebApp(webAppData);
    } else {
      console.warn('⚠️ Telegram WebApp SDK недоступен. Запуск в dev-режиме.');
      setWebApp(null);
    }
  }, []);

  return webApp;
};
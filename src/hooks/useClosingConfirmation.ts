import { useEffect } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';
import { useLanguage } from './useLanguage';

interface UseClosingConfirmationOptions {
  enabled?: boolean;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const useClosingConfirmation = (options: UseClosingConfirmationOptions = {}) => {
  const { t } = useLanguage();
  const { enabled = true, message = t('common.confirmClose'), onConfirm, onCancel } = options;
  const webApp = useTelegramWebApp();

  useEffect(() => {
    if (!webApp || !enabled) return;

    // Включаем подтверждение закрытия
    webApp.enableClosingConfirmation();

    // Обработчик события закрытия
    const handleClosing = () => {
      if (message) {
        webApp.showConfirm(message, (confirmed: boolean) => {
          if (confirmed) {
            onConfirm?.();
            webApp.close();
          } else {
            onCancel?.();
          }
        });
      } else {
        onConfirm?.();
        webApp.close();
      }
    };

    // Подписываемся на событие закрытия
    webApp.onEvent('closing', handleClosing);

    // Очистка при размонтировании
    return () => {
      webApp.offEvent('closing', handleClosing);
      webApp.disableClosingConfirmation();
    };
  }, [webApp, enabled, message, onConfirm, onCancel]);

  return {
    enable: () => webApp?.enableClosingConfirmation(),
    disable: () => webApp?.disableClosingConfirmation(),
    isEnabled: webApp?.isClosingConfirmationEnabled ?? false
  };
};
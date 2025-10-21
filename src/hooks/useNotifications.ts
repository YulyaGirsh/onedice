import { useState, useCallback } from 'react';
import { Notification } from '../components/NotificationSystem/NotificationSystem';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 2000,
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Специальные функции для разных типов уведомлений
  const showInfo = useCallback((message: string, duration?: number) => {
    return addNotification({ message, type: 'info', duration });
  }, [addNotification]);

  const showSuccess = useCallback((message: string, duration?: number) => {
    return addNotification({ message, type: 'success', duration });
  }, [addNotification]);

  const showWarning = useCallback((message: string, duration?: number) => {
    return addNotification({ message, type: 'warning', duration });
  }, [addNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    return addNotification({ message, type: 'error', duration });
  }, [addNotification]);

  // Специальная функция для уведомления о выходе игрока (временно отключена)
  const showPlayerLeft = useCallback((_playerName: string) => {
    // Уведомления о выходе игроков временно отключены
    return;
  }, []);

  // Функция для уведомления о присоединении игрока
  const showPlayerJoined = useCallback((playerName: string) => {
    return addNotification({
      message: `${playerName} присоединился к лобби`,
      type: 'success',
      duration: 2000,
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showPlayerLeft,
    showPlayerJoined,
  };
};
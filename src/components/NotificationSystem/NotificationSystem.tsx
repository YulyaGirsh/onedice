import React, { useState, useEffect } from 'react';
import styles from './NotificationSystem.module.css';
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoWarningOutline, IoNotificationsOutline, IoClose } from 'react-icons/io5';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onRemove }) => {
  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Показать уведомление
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    // Скрыть уведомление через заданное время
    const hideTimer = setTimeout(() => {
      setIsRemoving(true);
      setTimeout(() => {
        onRemove(notification.id);
      }, 300); // Время анимации исчезновения
    }, notification.duration || 2000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notification.id, notification.duration, onRemove]);

  const getIcon = () => {
    switch (notification.type) {
      case 'info':
        return <IoNotificationsOutline />;
      case 'warning':
        return <IoWarningOutline />;
      case 'success':
        return <IoCheckmarkCircleOutline />;
      case 'error':
        return <IoAlertCircleOutline />;
      default:
        return <IoNotificationsOutline />;
    }
  };

  return (
    <div
      className={`${
        styles.notification
      } ${styles[notification.type]} ${
        isVisible && !isRemoving ? styles.visible : ''
      } ${isRemoving ? styles.removing : ''}`}
      onClick={() => {
        setIsRemoving(true);
        setTimeout(() => onRemove(notification.id), 300);
      }}
    >
      <div className={styles.notificationIcon}>
        {getIcon()}
      </div>
      <div className={styles.notificationContent}>
        <span className={styles.notificationMessage}>{notification.message}</span>
      </div>
      <div className={styles.notificationClose}>
        <IoClose />
      </div>
    </div>
  );
};

export default NotificationSystem;
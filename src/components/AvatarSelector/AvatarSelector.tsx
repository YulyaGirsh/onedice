import React, { useState, useEffect } from 'react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { useTheme } from '../../hooks/useTheme';
// import { useLanguage } from '../../hooks/useLanguage';
import styles from './AvatarSelector.module.css';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  currentName?: string;
  onSave: (avatar: string, name: string) => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  currentName = '',
  onSave
}) => {
  // const { t } = useLanguage();
  const { currentTheme } = useTheme();
  const webApp = useTelegramWebApp();
  
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || '');
  const [userName, setUserName] = useState<string>(currentName);
  const [isSaving, setIsSaving] = useState(false);

  // Список доступных аватаров
  const availableAvatars = [
    '645DE6B9-5942-4DDF-A550-1BCC2E9F9566.png',
    '8D6EC4E7-5439-4C2A-BE8B-DE71471A1D70.png',
    'A4EDCA4E-8E67-42B6-8B9F-D55738ACE869.png',
    'B08D0F0E-CF7C-4A83-B2D3-A3B425021DC9.png',
    'D66854C4-FC9A-41B0-A04C-F5890B76292A.png'
  ];

  useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(currentAvatar || '');
      setUserName(currentName);
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isOpen, currentAvatar, currentName]);

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    webApp?.hapticFeedback?.impactOccurred('light');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };

  const handleSave = async () => {
    if (!userName.trim()) {
      webApp?.showAlert('Пожалуйста, введите имя пользователя');
      return;
    }

    if (!selectedAvatar) {
      webApp?.showAlert('Пожалуйста, выберите аватар');
      return;
    }

    setIsSaving(true);
    webApp?.hapticFeedback?.impactOccurred('medium');

    try {
      await onSave(selectedAvatar, userName.trim());
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      webApp?.showAlert('Ошибка при сохранении профиля');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    webApp?.hapticFeedback?.impactOccurred('light');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${currentTheme === 'dark' ? styles.dark : styles.light}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Настройки профиля</h2>
          <button className={styles.closeButton} onClick={handleCancel}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* Выбор имени */}
          <div className={styles.section}>
            <label className={styles.label}>Имя пользователя</label>
            <input
              type="text"
              value={userName}
              onChange={handleNameChange}
              placeholder="Введите ваше имя"
              className={styles.nameInput}
              maxLength={20}
            />
          </div>

          {/* Выбор аватара */}
          <div className={styles.section}>
            <label className={styles.label}>Выберите аватар</label>
            <div className={styles.avatarGrid}>
              {availableAvatars.map((avatar) => (
                <button
                  key={avatar}
                  className={`${styles.avatarOption} ${
                    selectedAvatar === avatar ? styles.selected : ''
                  }`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  <img
                    src={`/icons/${avatar}`}
                    alt={`Avatar ${avatar}`}
                    className={styles.avatarImage}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={handleCancel}
            disabled={isSaving}
          >
            Отмена
          </button>
          <button
            className={`${styles.button} ${styles.saveButton}`}
            onClick={handleSave}
            disabled={isSaving || !userName.trim() || !selectedAvatar}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;

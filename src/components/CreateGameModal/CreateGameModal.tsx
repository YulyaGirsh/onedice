import React, { useState, useEffect } from 'react';
import { CreateGameData } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './CreateGameModal.module.css';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (gameData: CreateGameData) => void;
}

function CreateGameModal({ isOpen, onClose, onCreate }: CreateGameModalProps) {
  const { t } = useLanguage();
  const [price, setPrice] = useState<string>('0.1');
  const [gameType, setGameType] = useState<'1v1' | 'lobby'>('1v1');
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(t('createGame.invalidBet'));
      }
      return;
    }

    onCreate({
      price: numPrice,
      maxPlayers: gameType === '1v1' ? 2 : maxPlayers,
      isPrivate,
      isAnonymous,
      type: gameType
    });

    // Сброс формы
    setPrice('0.1');
    setGameType('1v1');
    setMaxPlayers(2);
    setIsPrivate(false);
    setIsAnonymous(false);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose}>×</button>
        <h3 className={styles.title}>{t('createGame.title')}</h3>

        <form onSubmit={handleSubmit}>
          {/* Тип игры */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('createGame.gameType')}</label>
            <div className={styles.gameTypeGrid}>
              <button
                type="button"
                className={`${styles.gameTypeBtn} ${gameType === '1v1' ? styles.active : ''}`}
                onClick={() => {
                  setGameType('1v1');
                  setMaxPlayers(2);
                }}
              >
                <div>{t('createGame.oneVsOne')}</div>
                <div className={styles.gameTypeDesc}>{t('createGame.duel')}</div>
              </button>
              <button
                type="button"
                className={`${styles.gameTypeBtn} ${gameType === 'lobby' ? styles.active : ''}`}
                onClick={() => {
                  setGameType('lobby');
                  setMaxPlayers(3);
                }}
              >
                <div>{t('createGame.lobby')}</div>
                <div className={styles.gameTypeDesc}>{t('createGame.upToFivePlayers')}</div>
              </button>
            </div>
          </div>

          {/* Количество игроков для лобби */}
          {gameType === 'lobby' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('createGame.maxPlayers')}</label>
              <div className={styles.playerGrid}>
                {[2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`${styles.playerBtn} ${maxPlayers === num ? styles.active : ''}`}
                    onClick={() => setMaxPlayers(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ставка */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span>{t('createGame.bet')}</span>
              <span> TON</span>
            </label>
            <div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={styles.priceInput}
                placeholder="0.1"
                required
              />
              <div className={styles.priceSuggestions}>
                {['0.1', '0.5', '1', '2', '5'].map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    className={`${styles.priceSuggestion} ${price === suggestion ? styles.active : ''}`}
                    onClick={() => setPrice(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Приватность (статичный текст, только переключатель меняет состояние) */}
          <div className={styles.formGroup}>
            <label className={styles.privacyLabel}>
              <div className={styles.privacyInfo}>
                <span className={styles.privacyTitle}>
                  {t('createGame.privateGame')}
                </span>
              </div>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={!isPrivate}
                  onChange={(e) => setIsPrivate(!e.target.checked)}
                  className={styles.privacyCheckbox}
                />
                <div className={styles.toggleSlider}></div>
              </div>
            </label>
          </div>

          {/* Анонимность (статичный текст, только переключатель меняет состояние) */}
          <div className={styles.formGroup}>
            <label className={styles.privacyLabel}>
              <div className={styles.privacyInfo}>
                <span className={styles.privacyTitle}>
                  {t('createGame.anonymousGame')}
                </span>
              </div>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className={styles.privacyCheckbox}
                />
                <div className={styles.toggleSlider}></div>
              </div>
            </label>
          </div>

          {/* Кнопки */}
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelBtn} onClick={handleClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className={styles.createBtn}>
              {t('createGame.createGame')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGameModal;
import React, { useState, useEffect } from 'react';
import { CreateGameData } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (gameData: CreateGameData) => void;
}

function CreateGameModal({ isOpen, onClose, onCreate }: CreateGameModalProps) {
  const { t } = useLanguage();
  const { currentTheme } = useTheme();
  const [price, setPrice] = useState<string>('0.1');
  const [gameType, setGameType] = useState<'1v1' | 'lobby'>('1v1');
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
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
    <div className={`modal-overlay ${isClosing ? 'fadeOut' : ''}`} onClick={handleClose}>
      <div className={`modal-content ${currentTheme === 'dark' ? 'dark' : 'light'}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('createGame.title')}</h3>
          <button className="modal-close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-game-form">
          {/* Тип игры */}
          <div className="form-group">
            <label>{t('createGame.gameType')}</label>
            <div className="game-type-buttons">
              <button
                type="button"
                className={`game-type-btn ${gameType === '1v1' ? 'active' : ''}`}
                onClick={() => {
                  setGameType('1v1');
                  setMaxPlayers(2);
                }}
              >
                <span className="type-name">{t('createGame.oneVsOne')}</span>
                <span className="type-desc">{t('createGame.duel')}</span>
              </button>
              <button
                type="button"
                className={`game-type-btn ${gameType === 'lobby' ? 'active' : ''}`}
                onClick={() => {
                  setGameType('lobby');
                  setMaxPlayers(3);
                }}
              >
                <span className="type-name">{t('createGame.lobby')}</span>
                <span className="type-desc">{t('createGame.upToFivePlayers')}</span>
              </button>
            </div>
          </div>

          {/* Количество игроков для лобби */}
          {gameType === 'lobby' && (
            <div className="form-group">
              <label>{t('createGame.maxPlayers')}</label>
              <div className="players-selector">
                {[2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`player-btn ${maxPlayers === num ? 'active' : ''}`}
                    onClick={() => setMaxPlayers(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ставка */}
          <div className="form-group">
            <label>
              <span>{t('createGame.bet')}</span>
              <div className="ton-label">
                <svg width="16" height="16" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="ton-icon-label">
                  <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
                </svg>
                <span>TON</span>
              </div>
            </label>
            <div className="price-input-container">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="price-input"
                placeholder="0.1"
                required
              />
              <div className="price-suggestions">
                {['0.1', '0.5', '1', '2', '5'].map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    className={`price-suggestion ${price === suggestion ? 'active' : ''}`}
                    onClick={() => setPrice(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Приватность (статичный текст, только переключатель меняет состояние) */}
          <div className="form-group">
            <label className="privacy-label">
              <div className="privacy-info">
                <span className="privacy-title">
                  {t('createGame.privateGame')}
                </span>
              </div>
              <div className="privacy-toggle">
                <input
                  type="checkbox"
                  checked={!isPrivate}
                  onChange={(e) => setIsPrivate(!e.target.checked)}
                  className="privacy-checkbox"
                />
                <div className="toggle-slider"></div>
              </div>
            </label>
          </div>

          {/* Анонимность (статичный текст, только переключатель меняет состояние) */}
          <div className="form-group">
            <label className="privacy-label">
              <div className="privacy-info">
                <span className="privacy-title">
                  {t('createGame.anonymousGame')}
                </span>
              </div>
              <div className="privacy-toggle">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="privacy-checkbox"
                />
                <div className="toggle-slider"></div>
              </div>
            </label>
          </div>

          {/* Кнопки */}
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="create-btn">
              {t('createGame.createGame')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGameModal;
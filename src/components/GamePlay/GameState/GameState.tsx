import React from 'react';
import styles from '../GamePlay.module.css';
import { FaBullseye, FaHourglassHalf } from 'react-icons/fa';
import { useLanguage } from '../../../hooks/useLanguage';

interface GameStateProps {
  gameState: 'preparing' | 'rolling' | 'results' | 'finished' | 'waiting_for_players';
  countdown: number;
  tieMessage: string | null;
  waitingMessage: string;
  onExitToLobby: () => void;
}

const GameState: React.FC<GameStateProps> = ({
  gameState,
  countdown,
  tieMessage,
  waitingMessage,
  onExitToLobby,
}) => {
  const { t } = useLanguage();

  if (gameState === 'preparing') {
    return (
      <div className={styles.preparingSection}>
        <div className={styles.preparingIcon}><FaBullseye /></div>
        <h2>{t('gameplay.preparingTitle')}</h2>
        <p>{t('gameplay.preparingSubtitle')}</p>
      </div>
    );
  }

  if (gameState === 'rolling') {
    return (
      <div className={styles.rollingSection}>
        <div className={styles.countdownContainer}>
          <div className={styles.countdownNumber}>{countdown || t('gameplay.throwNow')}</div>
          <div className={styles.countdownText}>
            {countdown > 0 ? t('gameplay.getReady') : t('gameplay.throwing')}
          </div>
          {tieMessage && (
            <div className={styles.tieMessage}>{tieMessage}</div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'waiting_for_players') {
    return (
      <div className={styles.waitingSection}>
        <div className={styles.waitingIcon}><FaHourglassHalf /></div>
        <h2>{t('gameplay.waitingPlayersTitle')}</h2>
        <p className={styles.waitingMessage}>{waitingMessage}</p>
        <div className={styles.loadingDots}>
          <span>.</span><span>.</span><span>.</span>
        </div>
        
        <div className={styles.exitToLobbyButtonContainer}>
          <button 
            className={styles.exitToLobbyButton}
            onClick={onExitToLobby}
          >
            {t('gameplay.backToLobby')}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GameState;
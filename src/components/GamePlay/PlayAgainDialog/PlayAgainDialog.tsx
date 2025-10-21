import React from 'react';
import styles from '../GamePlay.module.css';
import { PlayAgainStatus } from '../../../types';
import { useLanguage } from '../../../hooks/useLanguage';

interface PlayAgainDialogProps {
  webAppUserId: string;
  playAgainStatus: PlayAgainStatus;
  onRespond: (accept: boolean) => void;
}

const PlayAgainDialog: React.FC<PlayAgainDialogProps> = ({ webAppUserId, playAgainStatus, onRespond }) => {
  if (!playAgainStatus) return null;
  const otherReady = playAgainStatus.readyPlayers.find(p => p.id !== webAppUserId) || playAgainStatus.readyPlayers[0];
  const { t } = useLanguage();
  return (
    <div className={styles.playAgainDialog}>
      <div className={styles.dialogContent}>
        <h3>{t('gameplay.invitationTitle')}</h3>
        <p>
          {playAgainStatus.readyPlayers.length > 0 ? (
            <>
              {t('gameplay.playerWantsToPlay')}: <strong>{otherReady?.username}</strong>. {t('gameplay.areYouReadyQuestion')}
            </>
          ) : (
            t('gameplay.playAgainQuestion')
          )}
        </p>
        <div className={styles.dialogActions}>
          <button 
            className={styles.readyButton}
            onClick={() => onRespond(true)}
          >
            {t('gameplay.ready')}
          </button>
          <button 
            className={styles.cancelButton}
            onClick={() => onRespond(false)}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayAgainDialog;
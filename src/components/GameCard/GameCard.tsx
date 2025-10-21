import React from 'react';
import { Game } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: Game;
  onJoin: (gameId: string) => void;
  onDelete?: (gameId: string) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onJoin, onDelete }) => {
  const { t } = useLanguage();
  
  // Логика отображения username с учетом анонимности и ФИО
  const displayUsername = React.useMemo(() => {
    if (game.isAnonymous) return t('game.anonymous');
    // Если есть имя/фамилия — показываем их без @
    const fullName = [game.creatorFirstName, game.creatorLastName].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    // Иначе показываем username с @
    const name = game.creatorName || '';
    return name.startsWith('@') ? name.toLowerCase() : `@${name.toLowerCase()}`;
  }, [game.isAnonymous, game.creatorFirstName, game.creatorLastName, game.creatorName, t]);

  return (
    <div className={styles.gameCard}>
      <div className={styles.gameHeader}>
        <div className={styles.gameCreator}>
          <span className={styles.creatorName}>{displayUsername}</span>
        </div>
        <div className={styles.gameHeaderRight}>
          <div className={styles.gameType}>{game.type === '1v1' ? t('game.oneVsOne') : t('game.lobby')}</div>
          {game.isMyGame && onDelete && (
            <button
              aria-label={t('common.delete')}
              className={styles.deleteBtn}
              onClick={(e) => { e.stopPropagation(); onDelete(game.id); }}
            >
              <svg viewBox="0 0 24 24" className={styles.trashIcon} xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1zm1 4h4v12a2 2 0 0 1-2 2 2 2 0 0 1-2-2V7z" fill="currentColor"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.gameDetails}>
        <div className={styles.gamePrice}>
          {/* Иконка TON такая же как в ProfileHeader */}
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.tonIcon}>
            <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
          </svg>
          <span className={styles.priceValue}>{game.price} TON</span>
        </div>
        <div className={styles.gamePlayers}>
          {game.currentPlayers}/{game.maxPlayers} {t('game.players')}
        </div>
      </div>
      
      <button 
        className={styles.gameJoinBtn}
        onClick={() => onJoin(game.id)}
        disabled={false}
      >
        {game.currentPlayers >= game.maxPlayers ? t('game.play') : t('game.play')}
      </button>
    </div>
  );
};

export default GameCard;
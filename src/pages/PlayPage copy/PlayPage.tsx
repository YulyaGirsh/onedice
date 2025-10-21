import React, { useState } from 'react';
import { Game } from '../../types';
import GameCard from '../../components/GameCard';
import styles from './PlayPage.module.css';
import { FaDice } from 'react-icons/fa';

interface PlayPageProps {
  games: Game[];
  onJoinGame: (gameId: string) => void;
  onCreateGame: () => void;
  onDeleteLobby?: (gameId: string) => void;
}

const PlayPage: React.FC<PlayPageProps> = ({
  games,
  onJoinGame,
  onCreateGame,
  onDeleteLobby
}) => {
  const [gameFilter, setGameFilter] = useState<'all' | 'my'>('all');

  // Фильтруем игры на клиенте
  const filteredGames = gameFilter === 'all' 
    ? games 
    : games.filter(game => game.isMyGame);
    
  const myGames = games.filter(game => game.isMyGame);

  return (
    <>
      {/* Фильтры игр */}
      <div className={styles.gameFilters}>
        <button
          className={`${styles.gameFilterBtn} ${gameFilter === 'all' ? styles.active : ''}`}
          onClick={() => setGameFilter('all')}
        >
          Все
        </button>
        <button
          className={`${styles.gameFilterBtn} ${gameFilter === 'my' ? styles.active : ''}`}
          onClick={() => setGameFilter('my')}
        >
          Свои
        </button>
      </div>

      {/* Кнопка создания для вкладки "Свои" - всегда видна */}
      {gameFilter === 'my' && (
        <div className={styles.createGameSection}>
          <button className={styles.createGameBtnSecondary} onClick={onCreateGame}>
            Создать новую игру
          </button>
        </div>
      )}

      {/* Контент игр */}
      {gameFilter === 'my' && myGames.length === 0 ? (
        <div className={styles.emptyGames}>
          <div className={styles.emptyIcon}><FaDice /></div>
          <h3>У вас еще нет игр</h3>
          <p>Создайте свою первую игру в кубики!</p>
        </div>
      ) : (
        <div className={styles.gamesGrid}>
          {filteredGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onJoin={onJoinGame}
              onDelete={onDeleteLobby}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default PlayPage;
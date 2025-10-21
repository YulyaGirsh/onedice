import React, { useState, useEffect } from 'react';
import { Game } from '../../types';
import GameCard from '../../components/GameCard';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './PlayPage.module.css';
import { FaDice } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';

interface PlayPageProps {
  allGames: Game[];
  myGames: Game[];
  onJoinGame: (gameId: string) => void;
  onCreateGame: () => void;
  onDeleteLobby?: (gameId: string) => void;
  onRemoveLobby?: (gameId: string) => void;
  onRefreshLobbies?: () => void;
  onLoadAllLobbies?: () => void;
  onLoadMyLobbies?: () => void;
}

const PlayPage: React.FC<PlayPageProps> = ({
  allGames,
  myGames,
  onJoinGame,
  onCreateGame,
  onDeleteLobby,
  onRefreshLobbies,
  onLoadAllLobbies,
  onLoadMyLobbies,
  onRemoveLobby
}) => {
  const [gameFilter, setGameFilter] = useState<'all' | 'my'>('all');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  const { t } = useLanguage();

  // NEW: Загружаем соответствующие лобби при изменении фильтра (только если еще не загружали)
  useEffect(() => {
    if (gameFilter === 'all' && onLoadAllLobbies && !loadedTabs.has('all')) {
      onLoadAllLobbies();
      setLoadedTabs(prev => new Set(prev).add('all'));
    } else if (gameFilter === 'my' && onLoadMyLobbies && !loadedTabs.has('my')) {
      onLoadMyLobbies();
      setLoadedTabs(prev => new Set(prev).add('my'));
    }
  }, [gameFilter, onLoadAllLobbies, onLoadMyLobbies, loadedTabs]);

  // SSE подписка для реального времени (без периодических запросов)
  useEffect(() => {
    if (!onRefreshLobbies) return;

    // Слушаем событие storage для мгновенного обновления
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lobbies_refresh_tick') {
        onRefreshLobbies();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Подписка на SSE от сервера для реального времени
    let es: EventSource | null = null;
    try {
      es = new EventSource(`${API_BASE_URL}/events`);
      es.addEventListener('lobby_update', () => onRefreshLobbies());
      es.addEventListener('lobby_deleted', (event) => {
        const data = JSON.parse(event.data);
        console.log('🗑️ Получено SSE уведомление об удалении лобби:', data);
        if (onRemoveLobby) onRemoveLobby(data.id);
      });
    } catch {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (es) es.close();
    };
  }, [onRefreshLobbies]);

  // Фильтруем игры на клиенте
  const filteredGames = gameFilter === 'all' ? allGames : myGames;

  return (
    <>
      {/* Фильтры игр */}
      <div className={styles.gameFilters}>
        <button
          className={`${styles.gameFilterBtn} ${gameFilter === 'all' ? styles.active : ''}`}
          onClick={() => setGameFilter('all')}
        >
          {t('game.filters.all')}
        </button>
        <button
          className={`${styles.gameFilterBtn} ${gameFilter === 'my' ? styles.active : ''}`}
          onClick={() => setGameFilter('my')}
        >
          {t('game.filters.my')}
        </button>
      </div>

      {/* Кнопка создания для вкладки "Свои" - всегда видна */}
      {gameFilter === 'my' && (
        <div className={styles.createGameSection}>
          <button className={styles.createGameBtnSecondary} onClick={onCreateGame}>
            {t('game.createNew')}
          </button>
        </div>
      )}

      {/* Контент игр */}
      {gameFilter === 'my' && myGames.length === 0 ? (
        <div className={styles.emptyGames}>
          <div className={styles.emptyIcon}><FaDice /></div>
          <h3>{t('game.noGames')}</h3>
          <p>{t('game.createFirst')}</p>
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
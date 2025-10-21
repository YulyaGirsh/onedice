import React, { useState, useEffect } from 'react';
import { Game, Player, DiceResult, PlayAgainStatus } from '../../types';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { apiService } from '../../services/api';
import { useGameData } from '../../hooks/useGameData';
import styles from './GamePlay.module.css';
import { API_BASE_URL } from '../../config/api';
import GameState from './GameState/GameState';
import DiceAnimation from './DiceAnimation/DiceAnimation';
import PlayAgainDialog from './PlayAgainDialog/PlayAgainDialog';
import ResultsDisplay from './ResultsDisplay/ResultsDisplay';
import { useLanguage } from '../../hooks/useLanguage';
import { FaDice, FaHome } from 'react-icons/fa';
import { TbConfetti } from 'react-icons/tb';

interface GamePlayProps {
  game: Game;
  players?: Player[];
  onBackToLobby: () => void;
  onPlayAgain: () => void;
  onPlayerLeft?: (playerName: string) => void;
}

const GamePlay: React.FC<GamePlayProps> = ({
  game,
  players: propPlayers,
  onBackToLobby,
  onPlayAgain,
  onPlayerLeft
}) => {
  const webApp = useTelegramWebApp();
  const { t } = useLanguage();
  const { updatePlayerRating, updatePlayerStats } = useGameData();
  

  const [gameState, setGameState] = useState<'preparing' | 'rolling' | 'results' | 'finished' | 'waiting_for_players'>('preparing');
  const [diceResults, setDiceResults] = useState<DiceResult[]>([]);
  const [winner, setWinner] = useState<DiceResult | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isRolling, setIsRolling] = useState(false);
  const [players, setPlayers] = useState<Player[]>(propPlayers || []);
  const [previousPlayers, setPreviousPlayers] = useState<Player[]>([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [playAgainStatus, setPlayAgainStatus] = useState<PlayAgainStatus | null>(null);
  const [showPlayAgainDialog, setShowPlayAgainDialog] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [tieMessage, setTieMessage] = useState<string | null>(null);
  const [ratingDelta, setRatingDelta] = useState<number | null>(null);
  const [showVideoAnimation, setShowVideoAnimation] = useState(false);
  const [currentUserDiceResult, setCurrentUserDiceResult] = useState<number | null>(null);

  // Загрузка игроков, если они не переданы через пропсы
  useEffect(() => {
    const loadPlayers = async () => {
      if (!propPlayers || propPlayers.length === 0) {
        try {
          const lobbyData = await apiService.getLobby(game.id);
          
          const realPlayers: Player[] = lobbyData.players.map(player => {
            // Используем username как имя игрока
            const displayName = player.username || 'anonymous';
            
            return {
              ...player,
              name: displayName,
              isReady: player.role === 'creator' ? true : false,
              telegramData: {
                id: parseInt(player.id),
                first_name: '',
                last_name: '',
                username: player.username || ''
              }
            };
          });
          
          setPlayers(realPlayers);
        } catch (error) {
          console.error('Ошибка при загрузке игроков:', error);
        }
      }
    };

    loadPlayers();
  }, [game.id, propPlayers]);

  // Запуск игры
  useEffect(() => {
    if (gameState === 'preparing' && players.length > 0) {
      const timer = setTimeout(() => {
        setGameState('rolling');
        startDiceRoll();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, players]);

  // Мониторинг изменений игроков для уведомлений о выходе
  useEffect(() => {
    const monitorPlayers = async () => {
      try {
        const lobbyData = await apiService.getLobby(game.id);
        const currentPlayers: Player[] = lobbyData.players.map(player => ({
          ...player,
          name: player.username || 'anonymous',
          isReady: player.role === 'creator' ? true : false,
          telegramData: {
            id: parseInt(player.id),
            first_name: '',
            last_name: '',
            username: player.username || ''
          }
        }));

        // Проверяем ушедших игроков (только после первой загрузки)
        if (!isFirstLoad && previousPlayers.length > 0) {
          const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
          const previousPlayerIds = previousPlayers.map(p => p.id);
          const currentPlayerIds = currentPlayers.map(p => p.id);
          
          const leftPlayerIds = previousPlayerIds.filter(id => !currentPlayerIds.includes(id) && id !== currentUserId);
          leftPlayerIds.forEach(playerId => {
            const player = previousPlayers.find(p => p.id === playerId);
            if (player && player.name && onPlayerLeft) {
              onPlayerLeft(player.name);
            }
          });
        }
        
        // Отмечаем, что первая загрузка завершена
        if (isFirstLoad) {
          setIsFirstLoad(false);
        }

        setPreviousPlayers(players);
        setPlayers(currentPlayers);
      } catch (error) {
        console.error('Ошибка при мониторинге игроков:', error);
      }
    };

    const interval = setInterval(monitorPlayers, 3000); // Проверяем каждые 3 секунды
    return () => clearInterval(interval);
  }, [game.id, players, previousPlayers, onPlayerLeft, webApp]);

  // Периодическая проверка статуса play-again для показа диалога
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    if (gameState === 'finished' && !showPlayAgainDialog && !isCheckingStatus) {
      intervalId = setInterval(async () => {
        try {
          const status = await apiService.getPlayAgainStatus(game.id);
          
          if (status.status === 'declined') {
             const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
             // Показываем сообщение только инициатору
             if (status.initiator?.id === currentUserId) {
               webApp?.showAlert(status.message || 'Запрос на повторную игру отклонен.');
             }
              clearInterval(intervalId);
             // Не возвращаемся автоматически - игроки сами решают
             return;
           }
          
          // Если есть игроки, которые хотят играть снова, и текущий игрок не среди них
          if (status.readyPlayers.length > 0 && !status.allReady) {
            const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
            const currentPlayerReady = status.readyPlayers.some(p => p.id === currentUserId);
            
            // Показываем диалог только если текущий игрок еще не готов
            if (!currentPlayerReady) {
              setPlayAgainStatus(status);
              setShowPlayAgainDialog(true);
              console.log('Показываем диалог приглашения от игрока:', status.readyPlayers[0].username);
            }
          }
          
          // Если все игроки готовы, начинаем новую игру
          if (status.allReady) {
            clearInterval(intervalId);
            setGameState('preparing');
            setDiceResults([]);
            setWinner(null);
            setCountdown(3);
            setIsRolling(false);
            setPlayAgainStatus(null);
            setShowPlayAgainDialog(false);
            setWaitingMessage('');
            onPlayAgain();
          }
        } catch (error) {
          console.error('Ошибка при проверке статуса play-again:', error);
        }
      }, 2000); // Проверяем каждые 2 секунды
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [gameState, showPlayAgainDialog, game.id, webApp, onPlayAgain, isCheckingStatus]);

  // Обратный отсчет
  useEffect(() => {
    if (gameState === 'rolling' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'rolling' && countdown === 0) {
      rollDice();
    }
  }, [gameState, countdown]);

  // Heartbeat присутствия пока на экране игры
  useEffect(() => {
    const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
    let intervalId: number | undefined;
    const ping = () => apiService.heartbeat(game.id, currentUserId, 'game').catch(() => {});
    ping();
    intervalId = setInterval(ping, 5000) as unknown as number;
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [game.id, webApp]);

  // Надежный leave при закрытии/перезагрузке
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
      const url = `${API_BASE_URL}/games/${game.id}/leave`;
      const data = JSON.stringify({ playerId: currentUserId });
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [game.id, webApp]);

  const startDiceRoll = () => {
    setIsRolling(true);
    webApp?.hapticFeedback.impactOccurred('medium');
  };

  const rollDice = async () => {
    try {
      // Получаем ID текущего пользователя
      const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
      
      // Запрашиваем результаты с сервера
      const gameResults = await apiService.rollDice(game.id, currentUserId);
      
      if (gameResults.tieResolved) {
        setTieMessage('Ничья, перекидывания кубика...');
        setTimeout(() => setTieMessage(null), 1500);
      }
      
      setDiceResults(gameResults.results);
      setWinner(gameResults.winner);
      
      // Найдем результат текущего пользователя для показа видео анимации
      const currentUserResult = gameResults.results.find(result => result.playerId === currentUserId);
      if (currentUserResult) {
        setCurrentUserDiceResult(currentUserResult.diceValue);
        setShowVideoAnimation(true);
        setIsRolling(false);
        
        // Через 3 секунды скрываем видео анимацию и показываем результаты
        setTimeout(() => {
          setShowVideoAnimation(false);
          setGameState('results');
        }, 3000);
      } else {
        setGameState('results');
        setIsRolling(false);
      }
      
      // Тактильная обратная связь
      webApp?.hapticFeedback.notificationOccurred('success');
      
      // Через 3 секунды переходим к финальному экрану
      setTimeout(() => {
        setGameState('finished');
      }, 3000);

      // Показать анимацию рейтинга: +15 победителю, -15 остальным
      try {
        const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
        const isCurrentWinner = gameResults.winner?.playerId === currentUserId;
        setRatingDelta(isCurrentWinner ? 15 : -15);
        setTimeout(() => setRatingDelta(null), 1500);
        // Подтянуть и обновить централизованный рейтинг/статистику
        try {
          const stats = await apiService.getUserStats(currentUserId);
          updatePlayerRating(stats.rating);
          updatePlayerStats(stats.gamesPlayed, stats.gamesWon);
          try { localStorage.setItem('user_stats_refresh', String(Date.now())); localStorage.removeItem('user_stats_refresh'); } catch {}
        } catch {}
      } catch {}
    } catch (error) {
      console.error('Ошибка при получении результатов игры:', error);
      
      // Fallback: генерируем результаты локально в случае ошибки
      const results: DiceResult[] = players.map(player => ({
        playerId: player.id,
        playerName: player.name || player.username || `Игрок ${player.id}`,
        diceValue: Math.floor(Math.random() * 6) + 1
      }));

      setDiceResults(results);
      
      const maxValue = Math.max(...results.map(r => r.diceValue));
      const winners = results.filter(r => r.diceValue === maxValue);
      setWinner(winners[0]);
      
      // Найдем результат текущего пользователя для показа видео анимации
      const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
      const currentUserResult = results.find(result => result.playerId === currentUserId);
      if (currentUserResult) {
        setCurrentUserDiceResult(currentUserResult.diceValue);
        setShowVideoAnimation(true);
        setIsRolling(false);
        
        // Через 3 секунды скрываем видео анимацию и показываем результаты
        setTimeout(() => {
          setShowVideoAnimation(false);
          setGameState('results');
        }, 3000);
      } else {
        setGameState('results');
        setIsRolling(false);
      }
      
      webApp?.hapticFeedback.notificationOccurred('success');
      
      setTimeout(() => {
        setGameState('finished');
      }, 3000);
    }
  };

  const handlePlayAgain = async () => {
    try {
      const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
      
      // Отправляем запрос на повторную игру
      const response = await apiService.requestPlayAgain(game.id, currentUserId);
      
      if (response.status === 'ready_to_play') {
        // Все игроки готовы, начинаем новую игру
        setIsCheckingStatus(false);
        setGameState('preparing');
        setDiceResults([]);
        setWinner(null);
        setCountdown(3);
        setIsRolling(false);
        setPlayAgainStatus(null);
        setShowPlayAgainDialog(false);
        setWaitingMessage('');
        
        onPlayAgain();
      } else {
        // Ожидаем других игроков
        setGameState('waiting_for_players');
        setWaitingMessage(response.message);
        setShowPlayAgainDialog(false);
        
        // Сбрасываем состояние проверки перед новой проверкой
        setIsCheckingStatus(false);
        
        // Начинаем проверку статуса
        startPlayAgainStatusCheck();
      }
    } catch (error) {
      console.error('Ошибка при запросе повторной игры:', error);
      webApp?.showAlert(t('errors.unknown'));
      setIsCheckingStatus(false);
    }
  };

  // Функция для периодической проверки статуса готовности игроков
  const startPlayAgainStatusCheck = () => {
    if (isCheckingStatus) return;
    setIsCheckingStatus(true);
    let gameStarted = false; // Флаг для отслеживания запуска игры
    
    const checkStatus = async () => {
      if (gameStarted) return; // Прекращаем проверку, если игра уже запущена
      
      try {
        const lobby = await apiService.getLobby(game.id);
        if (lobby.status === 'playing') {
          gameStarted = true; // Устанавливаем флаг запуска игры
          setIsCheckingStatus(false);
          setGameState('preparing');
          setDiceResults([]);
          setWinner(null);
          setCountdown(3);
          setIsRolling(false);
          setPlayAgainStatus(null);
          setShowPlayAgainDialog(false);
          setWaitingMessage('');
          setTimeout(() => {
            onPlayAgain();
          }, 500);
          return;
        }
        const status = await apiService.getPlayAgainStatus(game.id);
        setPlayAgainStatus(status);

        if (status.status === 'declined') {
           const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
           // Показываем сообщение только инициатору
            if (status.initiator?.id === currentUserId) {
              webApp?.showAlert(status.message || t('errors.unknown'));
           }
           setIsCheckingStatus(false);
           // Не возвращаемся автоматически - игроки сами решают
           return;
         }

        // NEW: если кто-то вышел — обновляем список игроков и показываем сообщение
        if (status.status === 'player_left' || status.status === 'player_offline') {
          const refreshed = await apiService.getLobby(game.id);
          const refreshedPlayers: Player[] = (refreshed.players || []).map((p: any) => ({
            id: p.id,
            name: p.username,
            role: p.role,
            joinedAt: p.joinedAt,
            isReady: p.role === 'creator' ? true : (p.isReady || false),
            telegramData: {
              id: parseInt(p.id),
              first_name: p.username.split(' ')[0] || '',
              last_name: p.username.split(' ').slice(1).join(' ') || '',
              username: p.username
            }
          }));
          setPlayers(refreshedPlayers);
          setWaitingMessage(status.message || t('gameplay.waitingPlayersTitle'));
          setShowPlayAgainDialog(false);
          setGameState('waiting_for_players');
          // Игрок офлайн - показываем сообщение, но не возвращаемся автоматически
          // Продолжаем проверку через 2 секунды
          setTimeout(checkStatus, 2000);
          return;
        }
        
        const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
        const currentPlayerIsReady = status.readyPlayers.some(p => p.id === currentUserId);
        const hasOtherReadyPlayers = status.readyPlayers.some(p => p.id !== currentUserId);
        
        if ((status?.allReady || status?.status === 'ready_to_play') && !gameStarted) {
          // Все игроки готовы - начинаем игру
          gameStarted = true; // Устанавливаем флаг запуска игры
          setIsCheckingStatus(false);
          setGameState('preparing');
          setDiceResults([]);
          setWinner(null);
          setCountdown(3);
          setIsRolling(false);
          setPlayAgainStatus(null);
          setShowPlayAgainDialog(false);
          setWaitingMessage('');
          
          // Автоматически начинаем игру для всех игроков
          setTimeout(() => {
            onPlayAgain();
          }, 500);
          return; // Прекращаем проверку
        } else if (hasOtherReadyPlayers && !currentPlayerIsReady) {
          // Кто-то другой готов, но текущий игрок еще не ответил
          setShowPlayAgainDialog(true);
          setGameState('waiting_for_players');
        } else if (currentPlayerIsReady && !status.allReady) {
          // Текущий игрок готов, но ждем других
          const waitingNames = status.waitingFor.map(p => p.username).join(', ');
          setWaitingMessage(`${t('gameplay.waitingReady')}: ${waitingNames}`);
          setShowPlayAgainDialog(false);
          setGameState('waiting_for_players');
        } else {
          // Обновляем сообщение о ожидании
          const waitingNames = status.waitingFor.map(p => p.username).join(', ');
          setWaitingMessage(`${t('gameplay.waitingReady')}: ${waitingNames}`);
          setShowPlayAgainDialog(false);
        }
        
        // Продолжаем проверку через 2 секунды, если игра еще не началась и не все готовы
        if (!gameStarted && !status.allReady) {
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Ошибка при проверке статуса:', error);
        // Продолжаем проверку через 5 секунд в случае ошибки, если игра еще не началась
        if (!gameStarted) {
          setTimeout(checkStatus, 5000);
        }
      }
    };
    
    checkStatus();
  };

  // Функция для обработки ответа на приглашение играть снова
  const handlePlayAgainResponse = async (accept: boolean) => {
    const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
    if (accept) {
      try {
        // Отправляем согласие на повторную игру
        const response = await apiService.requestPlayAgain(game.id, currentUserId);
        
        if (response.status === 'ready_to_play') {
          // Все игроки готовы, начинаем новую игру
          setIsCheckingStatus(false);
          setGameState('preparing');
          setDiceResults([]);
          setWinner(null);
          setCountdown(3);
          setIsRolling(false);
          setPlayAgainStatus(null);
          setShowPlayAgainDialog(false);
          setWaitingMessage('');
          
          // Автоматически начинаем игру для всех игроков
          setTimeout(() => {
            onPlayAgain();
          }, 500);
        } else {
          // Продолжаем ожидать других игроков
          setShowPlayAgainDialog(false);
          setGameState('waiting_for_players');
          setWaitingMessage(response.message);
          
          // Сбрасываем состояние проверки перед новой проверкой
          setIsCheckingStatus(false);
          
          // Продолжаем проверку статуса
          startPlayAgainStatusCheck();
        }
      } catch (error) {
        console.error('Ошибка при ответе на приглашение:', error);
        webApp?.showAlert(t('errors.unknown'));
        setShowPlayAgainDialog(false);
        setIsCheckingStatus(false);
      }
    } else {
      // Игрок отказался играть снова
      try {
        await apiService.declinePlayAgain(game.id, currentUserId);
        setShowPlayAgainDialog(false);
        setGameState('finished');
        setIsCheckingStatus(false);
        onBackToLobby();
      } catch (error) {
        console.error('Ошибка при отклонении приглашения:', error);
        webApp?.showAlert(t('errors.unknown'));
      }
    }
  };

  // Функция для выхода в лобби
  const handleExitToLobby = async () => {
    const currentUserId = webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1';
    
    try {
      // Не выходим из лобби, а просто помечаем себя как "не готов"
      try {
        await apiService.updatePlayerReady(game.id, currentUserId, false);
        console.log('✅ Статус "не готов" установлен при выходе в лобби');
        
        // Добавляем небольшую задержку, чтобы дать серверу время обработать изменение
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        // Не блокируем навигацию в случае ошибки — это лишь попытка синхронизации статуса
        console.warn('Не удалось установить статус "не готов" при возврате в лобби:', e);
      }

      // Останавливаем все проверки статуса и диалоги ожидания
      setIsCheckingStatus(false);
      setShowPlayAgainDialog(false);

      // Возвращаемся в лобби (игрок остается в списке игроков)
      onBackToLobby();
    } catch (error) {
      console.error('Ошибка при возврате в лобби:', error);
      onBackToLobby();
    }
  };


  return (
    <div className={styles.gameContainer}>
      {/* Заголовок полностью убран */}

      {/* Подготовка, бросок, ожидание */}
      <GameState 
        gameState={gameState}
        countdown={countdown}
        tieMessage={tieMessage}
        waitingMessage={waitingMessage}
        onExitToLobby={handleExitToLobby}
      />

      {/* Игроки и их кубики */}
      {(gameState === 'results' || gameState === 'finished') && (
        <ResultsDisplay 
          results={diceResults}
          winner={winner}
          ratingDelta={ratingDelta}
          currentUserId={webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1'}
        />
      )}

      {/* Анимация броска */}
      {(gameState === 'rolling' || showVideoAnimation) && (
        <DiceAnimation 
          isRolling={isRolling} 
          diceResult={currentUserDiceResult}
          showVideoAnimation={showVideoAnimation}
          onVideoAnimationComplete={() => {
            setShowVideoAnimation(false);
            setGameState('results');
          }}
        />
      )}

      {/* Диалог готовности к повторной игре */}
      {showPlayAgainDialog && playAgainStatus && (
        <PlayAgainDialog 
          webAppUserId={webApp?.initDataUnsafe?.user?.id?.toString() || 'mock-user-1'}
          playAgainStatus={playAgainStatus}
          onRespond={handlePlayAgainResponse}
        />
      )}

      {/* Финальный экран */}
      {gameState === 'finished' && winner && (
        <div className={styles.finishedSection}>
          <div className={styles.winnerAnnouncement}>
            <div className={styles.winnerIcon}><TbConfetti /></div>
            <h2>{t('gameplay.congrats')}</h2>
            <p className={styles.winnerName}>{winner.playerName}</p>
            <p className={styles.winnerText}>{t('gameplay.wonAmount', { amount: game.price })}</p>
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.playAgainButton}
              onClick={handlePlayAgain}
            >
              <FaDice /> {t('gameplay.playAgain')}
            </button>
            <button 
              className={styles.backButton}
              onClick={onBackToLobby}
            >
              <FaHome /> {t('gameplay.backToLobby')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePlay;
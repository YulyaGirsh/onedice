import { useEffect, useState, useCallback } from 'react';
import { Game, CreateGameData, PlayerRating } from '../types';
import { apiService } from '../services/api';

/**
 * 🎯 ВАЖНО ДЛЯ БЭКЕНДА:
 * 
 * 1. playerRating.rating - текущий рейтинг пользователя (по умолчанию 1000)
 * 2. playerRating.ratingTitle - название уровня рейтинга (не отображается в UI, только для API)
 * 3. updatePlayerRating(newRating, newTitle) - функция для обновления рейтинга после игр
 * 
 * ИНТЕГРАЦИЯ С API:
 * - При загрузке профиля: получить рейтинг с сервера и установить через updatePlayerRating()
 * - После каждой игры: получить новый рейтинг с сервера и обновить
 * - В RatingPage: используется playerRating.rating для отображения позиции пользователя
 * - В ProfileHeader: отображается только playerRating.rating
 * 
 * ПРИМЕР ИСПОЛЬЗОВАНИЯ С API:
 * 
 * // При загрузке профиля:
 * const { updatePlayerRating, updatePlayerStats } = useGameData();
 * useEffect(() => {
 *   api.getUserProfile().then(profile => {
 *     updatePlayerRating(profile.rating, profile.ratingTitle);
 *     updatePlayerStats(profile.gamesPlayed, profile.gamesWon);
 *   });
 * }, []);
 * 
 * // После завершения игры:
 * const { finishGame } = useGameData();
 * const result = finishGame(isWin);
 * console.log(`Новый рейтинг: ${result.newRating} (${result.ratingChange >= 0 ? '+' : ''}${result.ratingChange})`);
 */

// Моковые данные для первичной отрисовки (пока API не ответит)
export const useGameData = () => {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [balance] = useState<number>(2.5); // Тестовый баланс в TON
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Рейтинг игрока - центральное место для хранения
  const [playerRating, setPlayerRating] = useState<PlayerRating>({
    rating: 0,
    ratingTitle: 'Стартовый'
  });

  // Статистика игр игрока
  const [playerStats, setPlayerStats] = useState<{
    gamesPlayed: number;
    gamesWon: number;
  }>({
    gamesPlayed: 0,
    gamesWon: 0
  });

  // Функция для обновления рейтинга (для будущего API)
  const updatePlayerRating = (newRating: number, newTitle?: string) => {
    setPlayerRating(prev => ({
      rating: newRating,
      ratingTitle: newTitle || prev.ratingTitle
    }));
  };

  // Функция для обновления статистики игр
  const updatePlayerStats = (gamesPlayed: number, gamesWon: number) => {
    setPlayerStats({ gamesPlayed, gamesWon });
  };

  // Функция для вычисления процента побед
  const getWinRate = () => {
    return playerStats.gamesPlayed > 0 ? Math.round((playerStats.gamesWon / playerStats.gamesPlayed) * 100) : 0;
  };

  // Логика начисления очков после игры (1v1)
  const calculateRatingChange = (isWin: boolean) => {
    if (isWin) {
      return 5; // Победитель получает +5
    } else {
      return -3; // Проигравший получает -3
    }
  };

  // Функция завершения игры с обновлением рейтинга и статистики
  const finishGame = (isWin: boolean) => {
    const ratingChange = calculateRatingChange(isWin);
    const newRating = Math.max(0, playerRating.rating + ratingChange); // Рейтинг не может быть ниже 0
    
    // Обновляем рейтинг
    setPlayerRating(prev => ({
      ...prev,
      rating: newRating
    }));
    
    // Обновляем статистику
    setPlayerStats(prev => ({
      gamesPlayed: prev.gamesPlayed + 1,
      gamesWon: isWin ? prev.gamesWon + 1 : prev.gamesWon
    }));

    return {
      newRating,
      ratingChange,
      newWinRate: playerStats.gamesPlayed + 1 > 0 
        ? Math.round(((isWin ? playerStats.gamesWon + 1 : playerStats.gamesWon) / (playerStats.gamesPlayed + 1)) * 100) 
        : 0
    };
  };

  // Вспомогательные функции для текущего пользователя
  const getCurrentUserId = () => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    }
    return '123456789';
  };

  const getCurrentUserName = () => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      const fullName = `${user.first_name} ${user.last_name || ''}`.trim();
      return fullName || user.username || 'Пользователь';
    }
    return 'Игрок';
  };

  const getCurrentUserData = () => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      const firstName = user.first_name?.trim();
      const lastName = user.last_name?.trim();
      const username = user.username?.trim();
      
      // Если есть хотя бы имя или фамилия, используем их
      if (firstName || lastName) {
        return {
          first_name: firstName || '',
          last_name: lastName || '',
          telegramUsername: username || ''
        };
      }
      
      // Если имени и фамилии нет, но есть username, используем его как имя
      if (username) {
        return {
          first_name: username,
          last_name: '',
          telegramUsername: username
        };
      }
      
      // Если вообще ничего нет, используем fallback
      return {
        first_name: `Игрок ${user.id?.toString().slice(-4) || Math.floor(Math.random() * 1000)}`,
        last_name: '',
        telegramUsername: ''
      };
    }
    // fallback для разработки
    return {
      first_name: 'Данил',
      last_name: 'Березин',
      telegramUsername: 'danil_berezin'
    };
  };

  // Загрузка лобби
  const loadLobbies = useCallback(async () => {
    console.log('Starting to load lobbies...');
    try {
      setIsLoading(true);
      setError(null);
      // Для вкладки "Все" запрашиваем только публичные лобби с сервера (is_public = 1)
      const lobbies = await apiService.getLobbies(false);
      console.log('Received lobbies from API:', lobbies);
      const currentUserId = getCurrentUserId();
      const apiGames = lobbies.map(lobby => apiService.mapApiResponseToGame(lobby, currentUserId));
      console.log('Mapped games:', apiGames);
      setAllGames(apiGames);
    } catch (err) {
      console.error('Error loading lobbies:', err);
      setError('Не удалось загрузить список игр');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Загрузка "моих" лобби
  const loadMyLobbies = useCallback(async () => {
    console.log('Starting to load my lobbies...');
    try {
      setIsLoading(true);
      setError(null);
      const currentUserId = getCurrentUserId();
      const myLobbies = await apiService.getUserLobbies(currentUserId);
      console.log('Received my lobbies from API:', myLobbies);
      const apiGames = myLobbies.map(lobby => apiService.mapApiResponseToGame(lobby, currentUserId));
      console.log('Mapped my games:', apiGames);
      setMyGames(apiGames);
    } catch (err) {
      console.error('Error loading my lobbies:', err);
      setError('Не удалось загрузить мои игры');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshLobbies = useCallback(async () => {
    await Promise.all([loadLobbies(), loadMyLobbies()]);
  }, [loadLobbies, loadMyLobbies]);

  // УДАЛЕНО: автоматическая загрузка лобби при инициализации
  // Теперь лобби загружаются только при входе в приложение и нажатии "Мои игры"

  // Присоединение к игре
  const onJoinGame = async (gameId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      let game = allGames.find(g => g.id === gameId) || myGames.find(g => g.id === gameId);
      if (!game) {
        const lobby = await apiService.getLobby(gameId);
        const mapped = apiService.mapApiResponseToGame(lobby, getCurrentUserId());
        if (!mapped.isPrivate) {
          setAllGames(prev => (prev.some(g => g.id === mapped.id) ? prev.map(g => g.id === mapped.id ? mapped : g) : [...prev, mapped]));
        }
        if (mapped.isMyGame) {
          setMyGames(prev => (prev.some(g => g.id === mapped.id) ? prev.map(g => g.id === mapped.id ? mapped : g) : [...prev, mapped]));
        }
        game = mapped;
      }
      if (!game) throw new Error('Игра не найдена');
      if (game.status === 'ready') throw new Error('Игра уже готова к запуску');
      if (game.currentPlayers >= game.maxPlayers) throw new Error('Игра уже заполнена');
      if (game.price > balance) throw new Error(`Недостаточно TON! У вас: ${balance} TON, требуется: ${game.price} TON`);

      const updatedLobby = await apiService.joinLobby(gameId, getCurrentUserId(), getCurrentUserData());
      const updatedGame = apiService.mapApiResponseToGame(updatedLobby, getCurrentUserId());
      setAllGames(prev => {
        if (!updatedGame.isPrivate) {
          const index = prev.findIndex(g => g.id === updatedGame.id);
          if (index !== -1) {
            return prev.map((g, i) => i === index ? updatedGame : g);
          } else {
            return [...prev, updatedGame];
          }
        } else {
          return prev.filter(g => g.id !== updatedGame.id);
        }
      });
      setMyGames(prev => {
        if (updatedGame.isMyGame) {
          const index = prev.findIndex(g => g.id === updatedGame.id);
          if (index !== -1) {
            return prev.map((g, i) => i === index ? updatedGame : g);
          } else {
            return [...prev, updatedGame];
          }
        } else {
          return prev.filter(g => g.id !== updatedGame.id);
        }
      });
      return updatedGame;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Не удалось присоединиться к игре';
      setError(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Создание игры через API
  const createGame = async (gameData: CreateGameData) => {
    if (gameData.price > balance) {
      const message = `Недостаточно TON! У вас: ${balance} TON, требуется: ${gameData.price} TON`;
      window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(message) : alert(message);
      window.Telegram?.WebApp?.hapticFeedback?.notificationOccurred('error');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const createdLobby = await apiService.createLobby(gameData, getCurrentUserId(), getCurrentUserName());
      const newGame = apiService.mapApiResponseToGame(createdLobby, getCurrentUserId());
      if (!newGame.isPrivate) {
        setAllGames(prev => [...prev, newGame]);
      }
      setMyGames(prev => [...prev, newGame]);
      window.Telegram?.WebApp?.hapticFeedback?.notificationOccurred('success');
      return newGame;
    } catch (err) {
      setError('Не удалось создать игру');
      window.Telegram?.WebApp?.hapticFeedback?.notificationOccurred('error');
      const errorMessage = 'Не удалось создать игру. Попробуйте еще раз.';
      window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(errorMessage) : alert(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление лобби
  const deleteLobby = async (gameId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.deleteLobby(gameId, getCurrentUserId());
      setAllGames(prev => prev.filter(g => g.id !== gameId));
      setMyGames(prev => prev.filter(g => g.id !== gameId));
      window.Telegram?.WebApp?.hapticFeedback?.notificationOccurred('success');
    } catch (err) {
      setError('Не удалось удалить лобби');
      window.Telegram?.WebApp?.hapticFeedback?.notificationOccurred('error');
      const errorMessage = 'Не удалось удалить лобби. Попробуйте еще раз.';
      window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(errorMessage) : alert(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка статистики пользователя
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const userId = getCurrentUserId();
        const stats = await apiService.getUserStats(userId);
        updatePlayerRating(stats.rating, 'Стартовый'); // Используем дефолтный титул или полученный
        updatePlayerStats(stats.gamesPlayed, stats.gamesWon);
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      }
    };
    fetchUserStats();
  }, []);

  const removeLobbyFromState = (gameId: string) => {
    setAllGames(prev => prev.filter(g => g.id !== gameId));
    setMyGames(prev => prev.filter(g => g.id !== gameId));
  };

  return {
    allGames,
    myGames,
    balance,
    playerRating,
    playerStats,
    updatePlayerRating,
    updatePlayerStats,
    getWinRate,
    isLoading,
    error,
    finishGame,
    onJoinGame,
    createGame,
    deleteLobby,
    removeLobbyFromState,
    loadLobbies,
    loadMyLobbies,
    refreshLobbies,
    getCurrentUserId,
    getCurrentUserData
  };
};
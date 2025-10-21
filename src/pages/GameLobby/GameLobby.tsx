import React, { useState, useEffect, useRef } from 'react';
import { Game, Player } from '../../types';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './GameLobby.module.css';
import { FaCrown, FaHourglassHalf, FaShareSquare, FaDoorOpen, FaPlay } from 'react-icons/fa';
import { apiService } from '../../services/api';

import { API_BASE_URL } from '../../config/api';
import { buildStartAppJoinUrl, buildShareUrl } from '../../config/telegram';

interface GameLobbyProps {
  game: Game;
  onBack: () => void;
  onStartGame?: () => void;
  onJoinGame?: (gameId: string) => Promise<Game | undefined>;
  onPlayersUpdate?: (players: Player[]) => void;
  onLeaveLobby?: () => void;
  onPlayerLeft?: (playerName: string) => void;
  onPlayerJoined?: (playerName: string) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ game, onBack, onStartGame, onJoinGame, onPlayersUpdate, onLeaveLobby, onPlayerLeft, onPlayerJoined }) => {
  const [isLoading, setIsLoading] = useState(false);
  const bottomStickyRef = useRef<HTMLDivElement>(null);
  const [currentGame, setCurrentGame] = useState<Game>(game);
  const [players, setPlayers] = useState<Player[]>([]);
  const [previousPlayers, setPreviousPlayers] = useState<Player[]>([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [playerAvatars, setPlayerAvatars] = useState<{[playerId: string]: string}>({});
  // Удаляем локальное состояние, будем использовать localStorage
  const webApp = useTelegramWebApp();
  const { t } = useLanguage();

  // Очистка старых данных при загрузке компонента
  useEffect(() => {
    // Очищаем старые попытки присоединения к лобби
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lobby_join_attempt_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  // Инициализация состояния для создателя лобби
  useEffect(() => {
    const currentUserId = getCurrentUser()?.id?.toString();
    if (game.creatorId === currentUserId || game.creatorId?.toString() === currentUserId || game.isMyGame) {
      console.log('🎯 Инициализация: Пользователь является создателем лобби');
      setHasJoinedLobby(true);
    }
  }, [game.id, game.creatorId, game.isMyGame]);

  // Получение текущего пользователя
  const getCurrentUser = () => {
    // Сначала пытаемся получить данные из Telegram WebApp
    if (webApp?.initDataUnsafe?.user) {
      console.log('📱 Используем данные из Telegram WebApp:', webApp.initDataUnsafe.user);
      return webApp.initDataUnsafe.user;
    }
    
    // Fallback для разработки - генерируем уникальный ID на основе времени и случайного числа
    // Сохраняем ID в localStorage, чтобы он был постоянным для сессии
    let developmentUserId = localStorage.getItem('development_user_id');
    if (!developmentUserId) {
      developmentUserId = `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('development_user_id', developmentUserId);
    }
    
    console.log('🔧 Используем fallback данные для разработки с ID:', developmentUserId);
    return {
      id: developmentUserId,
      first_name: 'Данил',
      last_name: 'Березин',
      username: 'danil_berezin'
    };
  };

  // Получение данных текущего пользователя для отправки на сервер
  const getCurrentUserData = () => {
    const u: any = webApp?.initDataUnsafe?.user;
    if (u) {
      // Проверяем, есть ли реальные данные имени
      const firstName = u.first_name?.trim();
      const lastName = u.last_name?.trim();
      const username = u.username?.trim();
      
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
        first_name: `Игрок ${u.id?.toString().slice(-4) || Math.floor(Math.random() * 1000)}`,
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



  // Получение имени игрока
  const getPlayerName = (player: Player) => {
    // Используем готовое имя от сервера (поле name), которое уже сформировано правильно
    if (player.name) {
      console.log('👥 Имя игрока из name:', player.name);
      return player.name;
    }
    // Fallback на telegramData если name не заполнено
    if (player.telegramData?.first_name) {
      const fullName = `${player.telegramData.first_name} ${player.telegramData.last_name || ''}`.trim();
      console.log('👥 Имя игрока из Telegram:', fullName);
      return fullName;
    }
    const fallbackName = player.username || t('common.player');
    console.log('👥 Fallback имя игрока:', fallbackName);
    return fallbackName;
  };

  // Загрузка аватарок игроков
  const loadPlayerAvatars = async (playersList: Player[]) => {
    const avatarPromises = playersList.map(async (player) => {
      try {
        const avatar = await apiService.getUserAvatar(player.id);
        return { playerId: player.id, avatar };
      } catch (error) {
        console.log(`Аватарка для игрока ${player.id} не найдена:`, error);
        return { playerId: player.id, avatar: null };
      }
    });
    
    const results = await Promise.all(avatarPromises);
    const avatarsMap: {[playerId: string]: string} = {};
    
    results.forEach(({ playerId, avatar }) => {
      if (avatar) {
        avatarsMap[playerId] = avatar;
      }
    });
    
    setPlayerAvatars(avatarsMap);
  };

  // Получение аватара игрока
  const getPlayerAvatar = (player: Player) => {
    // Если есть выбранная аватарка, возвращаем её
    const selectedAvatar = playerAvatars[player.id];
    if (selectedAvatar) {
      return (
        <img 
          src={`/img/ava/${selectedAvatar}.jpg`} 
          alt={`Avatar ${selectedAvatar}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    
    // Иначе показываем инициалы
    let initials = 'И';
    if (player.telegramData?.first_name) {
      initials = player.telegramData.first_name.charAt(0).toUpperCase();
    } else if (player.name) {
      initials = player.name.charAt(0).toUpperCase();
    } else if (player.username) {
      initials = player.username.charAt(0).toUpperCase();
    }
    
    return initials;
  };

  // Автоматическое присоединение к лобби
  const autoJoinLobby = async () => {
    
    // Предотвращаем одновременные попытки присоединения
    if (isJoining) {
      console.log('Уже выполняется попытка присоединения');
      return;
    }
    
    const currentUserId = getCurrentUser()?.id?.toString() || `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // ИЗМЕНЕНО: Убрали блокировку для создателя! Теперь создатель может присоединиться к своему лобби
    // if (game.creatorId === currentUserId || game.creatorId?.toString() === currentUserId) {
    //   console.log('🚫 БЛОКИРОВКА: Создатель не может присоединиться к собственному лобби');
    //   setHasJoinedLobby(true);
    //   return;
    // }
    
    // if (game.isMyGame) {
    //   console.log('🚫 БЛОКИРОВКА: Это мое лобби, не присоединяемся');
    //   setHasJoinedLobby(true);
    //   return;
    // }

    // Если лобби уже в статусе ready/playing — не пытаемся присоединяться
    if (currentGame.status === 'ready' || currentGame.status === 'playing') {
      console.log('🚫 Лобби уже готово/в игре, прекращаем попытки присоединения');
      setHasJoinedLobby(true);
      return;
    }

    // Проверяем, не присоединился ли уже пользователь
    if (hasJoinedLobby) {
      console.log('Пользователь уже присоединился к лобби');
      return;
    }

    // Проверяем localStorage, чтобы избежать повторных попыток
    const joinAttemptKey = `lobby_join_attempt_${game.id}_${currentUserId}`;
    const lastAttempt = localStorage.getItem(joinAttemptKey);
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
      if (timeSinceLastAttempt < 30000) { // 30 секунд
        console.log('Недавно уже была попытка присоединения, пропускаем');
        return;
      }
    }

    if (!onJoinGame) {
      console.log('onJoinGame не определен');
      return;
    }

    try {
      setIsJoining(true);
      
      // Сначала получаем актуальные данные лобби
      const lobbyResponse = await fetch(`${API_BASE_URL}/games/${game.id}`);
      if (!lobbyResponse.ok) {
        throw new Error('Не удалось получить данные лобби');
      }
      
      const lobbyData = await lobbyResponse.json();

      // Если лобби уже готово/идет игра — прекращаем попытки
      if (lobbyData.status === 'ready' || lobbyData.status === 'playing') {
        console.log('🚫 Лобби уже в статусе ready/playing, не присоединяемся');
        setHasJoinedLobby(true);
        // Зафиксируем в localStorage, чтобы больше не пытаться
        localStorage.setItem(joinAttemptKey, Date.now().toString());
        return;
      }
      
      // Проверяем, не присоединился ли уже пользователь
      const isAlreadyJoined = lobbyData.players?.some((player: any) => player.id === currentUserId);
      if (isAlreadyJoined) {
        console.log('Пользователь уже в лобби');
        setHasJoinedLobby(true);
        setPlayers(lobbyData.players || []);
        setCurrentGame(prev => ({ ...prev, currentPlayers: lobbyData.players?.length || 0 }));
        // Устанавливаем флаг в localStorage, что пользователь уже присоединился
        localStorage.setItem(joinAttemptKey, Date.now().toString());
        return;
      }
      
      // Проверяем, не заполнено ли лобби
      if (lobbyData.players?.length >= lobbyData.maxPlayers) {
        console.log('Лобби заполнено');
        webApp?.showAlert(t('lobby.lobbyFull'));
        // Блокируем дальнейшие попытки
        setHasJoinedLobby(true);
        localStorage.setItem(joinAttemptKey, Date.now().toString());
        return;
      }

      // Отмечаем попытку присоединения
      localStorage.setItem(joinAttemptKey, Date.now().toString());
      
      // Присоединяемся к лобби
      const response = await fetch(`${API_BASE_URL}/games/${game.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player: {
            id: currentUserId,
            first_name: getCurrentUserData().first_name,
            last_name: getCurrentUserData().last_name,
            telegramUsername: getCurrentUserData().telegramUsername,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'lobby full') {
          console.log('Лобби заполнено (ответ сервера)');
          webApp?.showAlert(t('lobby.lobbyFull'));
          // Блокируем дальнейшие попытки
          setHasJoinedLobby(true);
          return;
        }
        throw new Error(errorData.error || 'Не удалось присоединиться к лобби');
      }

      const updatedLobby = await response.json();
      console.log('Успешно присоединились к лобби:', updatedLobby);
      
      setHasJoinedLobby(true);
      setPlayers(updatedLobby.players || []);
      setCurrentGame(prev => ({ ...prev, currentPlayers: updatedLobby.players?.length || 0 }));
      
      // Тактильная обратная связь
      webApp?.hapticFeedback.notificationOccurred('success');
      
      // Мгновенный heartbeat после присоединения
      try {
        const uid = currentUserId;
        fetch(`${API_BASE_URL}/games/${game.id}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: uid, screen: 'lobby' })
        }).catch(() => {});
      } catch {}
    } catch (error) {
      console.error('❌ Ошибка автоматического присоединения:', error);
      
      // Удаляем отметку о попытке при ошибке (кроме случая заполненного лобби)
      if (!(error instanceof Error && (error.message.includes('full') || error.message.includes('заполнено')))) {
        localStorage.removeItem(joinAttemptKey);
      }
      
      // Показываем ошибку пользователю только если это не ошибка "лобби заполнено"
      if (error instanceof Error && !error.message.includes('full') && !error.message.includes('заполнено')) {
        const errorMessage = t('lobby.joinFailed');
        webApp?.showAlert(errorMessage) || alert(errorMessage);
        
        // Тактильная обратная связь об ошибке
        webApp?.hapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsJoining(false);
      // Не изменяем hasJoinedLobby здесь: им управляем по факту статуса/успеха
    }
  };

  // Загрузка информации о лобби (без автоматического присоединения)
  const loadLobbyInfo = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/games/${game.id}`);
      if (!response.ok) {
        throw new Error(t('lobby.fetchFailed'));
      }
      
      const lobbyData = await response.json();
      const currentUserId = getCurrentUser()?.id?.toString() || `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Проверяем, является ли пользователь создателем
      const isCreator = game.creatorId === currentUserId || game.creatorId?.toString() === currentUserId || game.isMyGame;
      
      // Проверяем, присоединился ли уже пользователь
      const isAlreadyJoined = lobbyData.players?.some((player: any) => player.id === currentUserId);
      if (isAlreadyJoined) {
        setHasJoinedLobby(true);
        // Помечаем в localStorage, чтобы предотвратить повторные попытки
        const joinAttemptKey = `lobby_join_attempt_${game.id}_${currentUserId}`;
        localStorage.setItem(joinAttemptKey, Date.now().toString());
        
        console.log('🎯 loadLobbyInfo: Пользователь уже присоединился к лобби');
      } else if (isCreator) {
        console.log('🎯 loadLobbyInfo: Пользователь является создателем лобби, но еще не присоединился');
      }
      
      const realPlayers: Player[] = (lobbyData.players || []).map((player: any) => {
        // Сервер уже формирует displayName и отправляет его в поле username
        const displayName = player.username || 'anonymous';
        
        return {
          id: player.id,
          name: displayName, // Используем готовое имя от сервера
          role: player.role,
          joinedAt: player.joinedAt,
          isReady: player.isReady || false, // Используем статус с сервера
          online: player.online !== false, // по умолчанию считаем онлайн
          telegramData: {
            id: parseInt(player.id),
            first_name: '',
            last_name: '',
            username: player.username || ''
          }
        };
      });
      
      console.log('🎮 Загруженные данные лобби:', {
        lobbyId: game.id,
        playersCount: realPlayers.length,
        players: realPlayers,
        currentUserId: currentUserId,
        isCreator: isCreator,
        isAlreadyJoined: isAlreadyJoined
      });
      
      setPlayers(realPlayers);
      
      // Загружаем аватарки игроков
      loadPlayerAvatars(realPlayers);
      
      // Передаем данные игроков в App.tsx
      onPlayersUpdate?.(realPlayers);
      
      // Обновляем текущее состояние игры
      setCurrentGame(prev => ({
        ...prev,
        currentPlayers: lobbyData.players?.length || 0,
        maxPlayers: lobbyData.maxPlayers || 2,
        status: lobbyData.status || 'waiting'
      }));
      
      console.log('✅ Информация о лобби загружена:', realPlayers);
    } catch (error) {
      console.error('Ошибка при загрузке информации о лобби:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление информации о лобби
  const updateLobbyInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/games/${game.id}`);
      if (!response.ok) {
        throw new Error('Не удалось получить данные лобби');
      }
      
      const lobbyData = await response.json();
      const currentUserId = getCurrentUser()?.id?.toString() || `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Преобразуем данные игроков в правильный формат
      const realPlayers: Player[] = (lobbyData.players || []).map((player: any) => {
        // Сервер уже формирует displayName и отправляет его в поле username
        const displayName = player.username || 'anonymous';
        
        return {
          id: player.id,
          name: displayName, // Используем готовое имя от сервера
          role: player.role,
          joinedAt: player.joinedAt,
          isReady: player.isReady || false, // Используем статус с сервера
          telegramData: {
            id: parseInt(player.id),
            first_name: '',
            last_name: '',
            username: player.username || ''
          }
        };
      });
      
      // Отслеживаем изменения в составе игроков для уведомлений (только после первой загрузки)
      if (!isFirstLoad && previousPlayers.length > 0) {
        const previousPlayerIds = previousPlayers.map(p => p.id);
        const newPlayerIds = realPlayers.map(p => p.id);
        
        // Проверяем новых игроков (присоединились)
        const joinedPlayerIds = newPlayerIds.filter(id => !previousPlayerIds.includes(id) && id !== currentUserId);
        joinedPlayerIds.forEach(playerId => {
          const player = realPlayers.find(p => p.id === playerId);
          if (player && player.name && onPlayerJoined) {
            onPlayerJoined(player.name);
          }
        });
        
        // Проверяем ушедших игроков
        const leftPlayerIds = previousPlayerIds.filter(id => !newPlayerIds.includes(id) && id !== currentUserId);
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
      
      // Если лобби уже готово или заполнено — блокируем будущие попытки присоединения
      if (lobbyData.status === 'ready' || lobbyData.status === 'playing' || (lobbyData.players?.length >= lobbyData.maxPlayers)) {
        setHasJoinedLobby(true);
      }
      
      setPreviousPlayers(players);
      setPlayers(realPlayers);
      
      // Загружаем аватарки игроков
      loadPlayerAvatars(realPlayers);
      
      setCurrentGame(prev => ({ ...prev, currentPlayers: lobbyData.players?.length || 0, status: lobbyData.status }));

      // Обновляем состояние готовности текущего пользователя
      const currentPlayer = realPlayers.find(player => player.id === currentUserId);
      if (currentPlayer) {
        // Проверяем, не вернулся ли игрок недавно из игры
        const now = Date.now();
        const exitTimeKey = `exit_from_game_${game.id}`;
        const exitTimeStr = localStorage.getItem(exitTimeKey);
        const exitTime = exitTimeStr ? parseInt(exitTimeStr) : null;
        const recentlyExitedFromGame = exitTime && (now - exitTime) < 5000; // 5 секунд
        
        if (recentlyExitedFromGame && !currentPlayer.isReady) {
          // Если игрок недавно вышел из игры и сервер показывает "не готов", сохраняем этот статус
          console.log('🚫 Игрок недавно вышел из игры, сохраняем статус "не готов"');
          setIsReady(false);
        } else if (!recentlyExitedFromGame) {
          // Обычное обновление статуса только если игрок не выходил недавно из игры
          setIsReady(currentPlayer.isReady || false);
          // Очищаем старую запись о выходе из игры
          if (exitTime) {
            localStorage.removeItem(exitTimeKey);
          }
        }
        // Если игрок недавно вышел из игры и сервер показывает "готов", игнорируем это обновление
      }

      // Если игра запущена – переходим ко всем игрокам
      if (lobbyData.status === 'playing' && onStartGame) {
        onStartGame();
      }
      
      console.log('🔄 Обновлены данные лобби:', realPlayers);
      
      const isCreator = game.creatorId === currentUserId || game.creatorId?.toString() === currentUserId || game.isMyGame;
      const isUserInLobby = lobbyData.players?.some((player: any) => player.id === currentUserId);
      
      if (isUserInLobby) {
        setHasJoinedLobby(true);
        // Обновляем localStorage, что пользователь присоединился
        const joinAttemptKey = `lobby_join_attempt_${game.id}_${currentUserId}`;
        localStorage.setItem(joinAttemptKey, Date.now().toString());
        
        console.log('🎯 updateLobbyInfo: Пользователь уже в лобби');
      } else if (isCreator) {
        console.log('🎯 updateLobbyInfo: Пользователь является создателем лобби, но еще не присоединился');
      } else if (lobbyData.players?.length >= lobbyData.maxPlayers) {
        // Если лобби заполнено, устанавливаем флаг в localStorage
        const joinAttemptKey = `lobby_join_attempt_${game.id}_${currentUserId}`;
        localStorage.setItem(joinAttemptKey, Date.now().toString());
      }
      // Убираем автоматическое присоединение из updateLobbyInfo
      // Присоединение должно происходить только один раз в useEffect
    } catch (error) {
      console.error('Ошибка при обновлении информации о лобби:', error);
    }
  };

  // Эффект для первоначального присоединения к лобби (только один раз)
  useEffect(() => {
    let isMounted = true;
    
    const initialJoin = async () => {
      if (!isMounted) return;
      

      
      // ИЗМЕНЕНО: Убрали блокировку для создателя! Теперь создатель может присоединиться к своему лобби
      // if (game.creatorId === initialUserId || game.creatorId?.toString() === initialUserId || game.isMyGame) {
      //   console.log('Пользователь является создателем лобби, не присоединяемся автоматически');
      //   setHasJoinedLobby(true);
      //   return;
      // }
      
      // Проверяем, не присоединился ли уже пользователь
      if (hasJoinedLobby) {
        console.log('Пользователь уже присоединился к лобби');
        return;
      }
      
      console.log('Выполняем первоначальное присоединение к лобби');
      await autoJoinLobby();
    };
    
    // Небольшая задержка, чтобы компонент полностью инициализировался
    const timeoutId = setTimeout(initialJoin, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      
      // Очищаем localStorage при размонтировании компонента
      const cleanupUserId = getCurrentUser()?.id?.toString() || `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const joinAttemptKey = `lobby_join_attempt_${game.id}_${cleanupUserId}`;
      localStorage.removeItem(joinAttemptKey);
    };
  }, [game.id, hasJoinedLobby]); // Перезапускаем только при смене игры или еще не присоединились

  // Эффект для загрузки данных лобби
  useEffect(() => {
    loadLobbyInfo();
    
    // Принудительная загрузка данных каждые 2 секунды, если игроков нет
    const forceLoadInterval = setInterval(() => {
      if (players.length === 0) {
        console.log('🔄 Принудительная загрузка данных лобби (нет игроков)');
        loadLobbyInfo();
      }
    }, 10000); // Увеличили до 10 секунд
    
    return () => clearInterval(forceLoadInterval);
  }, [game.id, players.length]);

  // Эффект для периодического обновления данных лобби
  useEffect(() => {
    // Продолжаем обновления для синхронизации статуса готовности
    // Останавливаем только когда игра уже запущена
    if (currentGame.status === 'playing') {
      console.log('Игра запущена, останавливаем периодические обновления');
      return;
    }

    const interval = setInterval(() => {
      console.log('🔄 Периодическое обновление лобби для синхронизации');
      updateLobbyInfo();
    }, 2000); // Уменьшили до 2 секунд для более быстрой синхронизации

    return () => clearInterval(interval);
  }, [game.id, hasJoinedLobby, currentGame.status]);

  // Обновляем игру при изменении пропса
  useEffect(() => {
    setCurrentGame(game);
  }, [game]);

  // SSE подписка для мгновенного получения уведомления о запуске игры
  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    try {
      eventSource = new EventSource(`${API_BASE_URL}/events`);
      
      eventSource.addEventListener('game_started', (event) => {
        const data = JSON.parse(event.data);
        console.log('🚀 Получено SSE уведомление о запуске игры:', data);
        
        // Проверяем, что событие относится к нашему лобби
        if (data.lobbyId === game.id) {
          console.log('🚀 Получено SSE уведомление о запуске игры:', data);
          
          // Обновляем статус игры и запускаем игру
          setCurrentGame(prev => ({ ...prev, status: 'playing' }));
          
          // Запускаем игру через короткую задержку для синхронизации UI
          setTimeout(() => {
            if (onStartGame) {
              onStartGame();
            }
          }, 100);
        }
      });
      
      eventSource.addEventListener('lobby_deleted', (event) => {
        const data = JSON.parse(event.data);
        console.log('🗑️ Получено SSE уведомление об удалении лобби:', data);
        
        // Проверяем, что событие относится к нашему лобби
         if (data.id === game.id) {
           console.log('🗑️ Лобби было удалено, возвращаемся на главную страницу');
           
           // Возвращаемся на главную страницу
           if (onLeaveLobby) {
             onLeaveLobby();
           } else {
             onBack();
           }
         }
      });
      
      console.log('✅ SSE подключение установлено для лобби:', game.id);
    } catch (error) {
      console.error('❌ Ошибка подключения к SSE:', error);
    }
    
    return () => {
      if (eventSource) {
        eventSource.close();
        console.log('🔌 SSE подключение закрыто для лобби:', game.id);
      }
    };
  }, [game.id, onStartGame]);

  // Динамическое измерение высоты bottomSticky и установка CSS переменной
  useEffect(() => {
    const measureBottomSticky = () => {
      if (bottomStickyRef.current) {
        const height = bottomStickyRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--bottom-sticky-height', `${height}px`);
        console.log('🔧 Измерена высота bottomSticky:', height + 'px');
      }
    };

    // Измеряем сразу и при изменениях
    measureBottomSticky();
    
    // Наблюдаем за изменениями размеров
    const resizeObserver = new ResizeObserver(measureBottomSticky);
    if (bottomStickyRef.current) {
      resizeObserver.observe(bottomStickyRef.current);
    }

    // Также при изменении окна
    window.addEventListener('resize', measureBottomSticky);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureBottomSticky);
    };
  }, [players, currentGame, isLoading]); // Перемеряем при изменении содержимого

  // Покинуть лобби
  // Updated handleLeaveLobby to call /leave API
  const handleLeaveLobby = async () => {
    try {
      setIsLoading(true);
      
      // Тактильная обратная связь
      webApp?.hapticFeedback.impactOccurred('medium');
      
      // API вызов для выхода из лобби
      const playerId = getCurrentUser()?.id?.toString() || `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await fetch(`${API_BASE_URL}/games/${game.id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId }),
      });
      
      // Очищаем localStorage при выходе из лобби
      const leavingUserId = playerId;
      const joinAttemptKey = `lobby_join_attempt_${game.id}_${leavingUserId}`;
      localStorage.removeItem(joinAttemptKey);
      
      console.log('Покидаем лобби:', game.id);
      
      // Возвращаемся на предыдущую страницу (главное меню)
      onBack();

      // NEW: после выхода инициируем обновление списка лобби через событие storage,
      // чтобы другой клиент увидел изменение количества игроков в реальном времени
      try {
        localStorage.setItem('lobbies_refresh_tick', `${Date.now()}`);
        // немедленно удаляем ключ, чтобы следующие события тоже сработали
        localStorage.removeItem('lobbies_refresh_tick');
      } catch {}
    } catch (error) {
      console.error('Ошибка при покидании лобби:', error);
      
      // Тактильная обратная связь об ошибке
      webApp?.hapticFeedback.notificationOccurred('error');
      
      const errorMessage = 'Не удалось покинуть лобби';
      webApp?.showConfirm(errorMessage) || alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик готовности игрока
  const handleToggleReady = async () => {
    try {
      setIsLoading(true);
      
      // Тактильная обратная связь
      webApp?.hapticFeedback.selectionChanged();
      
      const newReadyState = !isReady;
      setIsReady(newReadyState);
      
      // Обновляем готовность на сервере
      try {
        await fetch(`${API_BASE_URL}/games/${game.id}/ready`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerId: getCurrentUser()?.id?.toString() || `dev_${Date.now()}`,
            isReady: newReadyState,
          }),
        });
        
        // Немедленно обновляем данные лобби для синхронизации
        console.log('🔄 Немедленное обновление после изменения готовности');
        await updateLobbyInfo();
        
        // Дополнительная проверка через короткий интервал для гарантии синхронизации
        setTimeout(async () => {
          console.log('🔄 Дополнительная проверка статуса лобби');
          await updateLobbyInfo();
        }, 500);
        
      } catch (err) {
        console.error('Ошибка запроса /ready:', err);
        setIsReady(!newReadyState); // Откатываем изменение при ошибке
      }
      console.log(`Игрок ${newReadyState ? 'готов' : 'не готов'} к игре`);
    } catch (error) {
      console.error('Ошибка при изменении статуса готовности:', error);
      setIsReady(!isReady); // Откатываем изменение при ошибке
    } finally {
      setIsLoading(false);
    }
  };

  // Пригласить друга через Telegram
  const handleInviteFriend = () => {
    // Тактильная обратная связь
    webApp?.hapticFeedback.selectionChanged();
    
    const deepLink = buildStartAppJoinUrl(String(game.id));
    const shareText = `🎮 Присоединяйся к игре в Кубик!\n\n💰 Ставка: ${currentGame.price} TON\n👥 Игроков: ${currentGame.currentPlayers}/${currentGame.maxPlayers}`;
    const shareUrl = buildShareUrl(deepLink, shareText);

    if (webApp?.openTelegramLink) {
      try {
        webApp.openTelegramLink(shareUrl);
        return;
      } catch {}
    }

    // Браузерный fallback: копирование ссылки
    if (navigator.clipboard) {
      navigator.clipboard.writeText(deepLink).then(() => {
        webApp?.showAlert('Ссылка скопирована! Отправьте её другу в Telegram.');
      }).catch(() => {
        webApp?.showAlert(`Скопируйте ссылку:\n${deepLink}`);
      });
    }
  };



  const isCreator = currentGame.isMyGame;
  const isFull = currentGame.currentPlayers >= currentGame.maxPlayers;
  // Удалено: const isCurrentUserInLobby = players.some(p => p.id === getCurrentUser()?.id?.toString());

  // Проверяем готовность всех игроков (кроме создателя)
  const allPlayersReady = players.length >= 2 && players.every(player => 
    player.role === 'creator' || player.isReady === true
  );
  
  // Убрано: ручной старт больше не используется, автостарт при allReady на сервере

  // Удалено: handleManualJoin как неиспользуемый

  return (
    <div className={styles.lobbyContainer}>
      {/* Центральная секция с игроками */}
      <div className={styles.centerSection}>
        <h2 className={styles.sectionTitle}>
          {t('lobby.playersTitle', { current: currentGame.currentPlayers, max: currentGame.maxPlayers })}
        </h2>
        
        {/* Показываем текст ожидания, если игроков меньше максимума */}
        {currentGame.currentPlayers < currentGame.maxPlayers && (
          <div className={styles.waitingText}>
            {currentGame.maxPlayers === 2
              ? t('lobby.waitingSecond')
              : t('lobby.waitingMore', { count: currentGame.maxPlayers - currentGame.currentPlayers })}
          </div>
        )}
        
        {/* Статус готовности для создателя */}
        {isCreator && players.length >= 2 && (
          <div className={styles.readinessStatus}>
            <div className={`${styles.readinessIndicator} ${allPlayersReady ? styles.allReady : styles.waitingForPlayers}`}>
              {allPlayersReady ? (
                <>
                  <span className={styles.readinessIcon}></span>
                   <span className={styles.readinessText}>{t('lobby.allReady')}</span>
                </>
              ) : (
                <>
                  <span className={styles.readinessIcon}><FaHourglassHalf /></span>
                   <span className={styles.readinessText}>{t('lobby.waitingReady')}</span>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Список всех игроков в лобби - показываем всегда */}
        <div className={styles.playersList}>
          <h3 className={styles.playersListTitle}>{t('lobby.inLobby')}</h3>
          <div className={styles.playersListContainer}>
            {players.length > 0 ? (
              players.map((player) => {
                const isCurrentUser = player.id === getCurrentUser()?.id?.toString();
                return (
                  <div key={player.id} className={styles.playerListItem}>
                    <div className={styles.playerListAvatar}>
                      {getPlayerAvatar(player)}
                    </div>
                    <div className={styles.playerListInfo}>
                      <div className={styles.playerListName}>
                        {getPlayerName(player)}
                      </div>
                      {player.role === 'creator' && (
                         <div className={styles.playerListBadge}>{t('lobby.creator')}</div>
                      )}
                    </div>
                    <div className={styles.playerListStatus}>
                      {isCurrentUser && player.role !== 'creator' ? (
                        <button 
                          className={`${styles.readyButton} ${isReady ? styles.readyButtonActive : ''}`}
                          onClick={handleToggleReady}
                          disabled={isLoading}
                        >
                           {isReady ? t('lobby.ready') : t('lobby.areYouReady')}
                        </button>
                      ) : (
                        <span className={`${styles.statusText} ${
                          player.role === 'creator' ? styles.creatorStatus : 
                          player.isReady ? styles.readyStatus : styles.notReadyStatus
                        }`}>
                           {player.role === 'creator' ? '' : 
                           player.isReady ? t('lobby.ready') : t('lobby.notReady')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.loadingPlayers}>
                <div className={styles.loadingText}>Загрузка игроков...</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Пустые слоты для недостающих игроков */}
        {Array.from({ length: currentGame.maxPlayers - currentGame.currentPlayers }).map((_, index) => (
          <div key={`empty-${index}`} className={styles.emptySlotItem}>
            <div className={styles.emptySlotAvatar}>
              <div className={styles.dashedCircle}></div>
            </div>
            <div className={styles.emptySlotText}>
               {t('lobby.slotWaiting')}
            </div>
          </div>
        ))}

      </div>



      {/* Фиксированный блок: описание + действия, прижат к меню */}
      <div className={styles.bottomSticky} ref={bottomStickyRef}>
        <div className={styles.gameInfo}>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('lobby.bet')}</span>
              <span className={styles.infoValue}>{currentGame.price} TON</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('lobby.type')}</span>
              <span className={styles.infoValue}>
                {currentGame.type === '1v1' ? t('game.oneVsOne') : t('game.lobby')}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('lobby.privacy')}</span>
              <span className={styles.infoValue}>
                {currentGame.isPrivate ? t('lobby.privacyPrivate') : t('lobby.privacyPublic')}
              </span>
            </div>
            {currentGame.isAnonymous && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('lobby.mode')}</span>
                <span className={styles.infoValue}>{t('lobby.modeAnonymous')}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {!isFull && (
            <button 
              className={styles.inviteButton}
              onClick={handleInviteFriend}
              disabled={isLoading}
            >
              <FaShareSquare /> {t('lobby.share')}
            </button>
          )}
          <button 
            className={styles.leaveButton}
            onClick={handleLeaveLobby}
          >
            {isLoading ? t('lobby.leaving') : <><FaDoorOpen /> {t('lobby.leave')}</>}
          </button>
        </div>
      </div>
      

      {/* Статус загрузки */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}><FaHourglassHalf /></div>
        </div>
      )}
    </div>
  );

  // Эффект heartbeat: регулярно помечаем пользователя онлайн в лобби
  useEffect(() => {
    const id = getCurrentUser()?.id?.toString();
    if (!id) return;
    const send = () => {
      fetch(`${API_BASE_URL}/games/${game.id}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: id, screen: 'lobby' })
      }).catch(() => {});
    };
    send();
    const interval = setInterval(send, 5000);
    return () => clearInterval(interval);
  }, [game.id]);

  // УДАЛЕНО: авто-вызов /leave при размонтировании компонента
  // УДАЛЕНО: отправка /leave в beforeunload — игроки остаются в лобби пока сами не выйдут
};


export default GameLobby;
import { useState, useEffect } from 'react';
import './App.css';
import ProfileHeader from './components/ProfileHeader/ProfileHeader';
import BottomNavigation from './components/BottomNavigation';
import CreateGameModal from './components/CreateGameModal';
import WelcomeModal from './components/WelcomeModal';
import DepositModal from './components/DepositModal/DepositModal';
import WithdrawModal from './components/WithdrawModal/WithdrawModal';
import SettingsModal from './components/SettingsModal/SettingsModal';
import PlayPage from './pages/PlayPage/PlayPage';
import RatingPage from './pages/RatingPage/RatingPage';
import React, { Suspense } from 'react';
const ProfilePage = React.lazy(() => import('./pages/ProfilePage/ProfilePage'));
const ShopPage = React.lazy(() => import('./pages/ShopPage/ShopPage'));
import SettingsPage from './pages/SettingsPage';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { useGameData } from './hooks/useGameData';
import { useClosingConfirmation } from './hooks/useClosingConfirmation';
import { useLanguage } from './hooks/useLanguage';
import { Game, PageType, Player } from './types';
import GameLobby from './pages/GameLobby/GameLobby';
import GamePlay from './components/GamePlay/GamePlay';
import { apiService } from './services/api';
import { API_BASE_URL } from './config/api';
import NotificationSystem from './components/NotificationSystem/NotificationSystem';
import { useNotifications } from './hooks/useNotifications';
import AvatarSelection from './components/AvatarSelection/AvatarSelection';

function App() {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<PageType>('play');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    // Проверяем, показывалась ли заставка ранее
    const hasShownWelcome = localStorage.getItem('welcomeModalShown');
    return !hasShownWelcome;
  });
  const [, setWelcomeModalShown] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | number | null>(null);
  
  const webApp = useTelegramWebApp();
  const { allGames, myGames, onJoinGame, createGame, deleteLobby, removeLobbyFromState, loadLobbies, loadMyLobbies, refreshLobbies } = useGameData();
  const [currentLobby, setCurrentLobby] = useState<Game | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [currentPlayers, setCurrentPlayers] = useState<Player[]>([]);
  const [startParamHandled, setStartParamHandled] = useState<boolean>(false);
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Система уведомлений
  const { notifications, removeNotification, showPlayerLeft, showPlayerJoined } = useNotifications();

  // Включаем подтверждение закрытия для предотвращения случайного закрытия
  useClosingConfirmation({
    enabled: true,
    message: t('common.confirmCloseWithProgress'),
    onConfirm: () => {
      console.log('Пользователь подтвердил закрытие Mini App');
    },
    onCancel: () => {
      console.log('Пользователь отменил закрытие Mini App');
    }
  });

  // Регистрация пользователя и загрузка лобби при первом входе в приложение
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          const userData = {
            id: user.id.toString(),
            username: user.username || 'anonymous',
            first_name: user.first_name || '',
            last_name: user.last_name || ''
          };
          
          // Проверяем, существует ли пользователь в базе данных
          try {
            const response = await fetch(`${API_BASE_URL}/users/${user.id}`);
            const userExists = response.ok;
            
            if (!userExists) {
              // Новый пользователь - регистрируем и отмечаем как нового
              await apiService.registerUser(userData);
              setIsNewUser(true);
              console.log('✅ Новый пользователь зарегистрирован:', userData);
            } else {
              console.log('✅ Существующий пользователь:', userData);
            }
            
            // Для новых пользователей проверяем аватарку
            if (!userExists) {
              try {
                const avatar = await apiService.getUserAvatar(user.id.toString());
                if (!avatar) {
                  // Если аватарки нет у нового пользователя, показываем экран выбора после welcome modal
                  // setShowAvatarSelection будет установлен в true после закрытия welcome modal
                }
              } catch (error) {
                console.error('❌ Ошибка проверки аватарки:', error);
              }
            }
            
          } catch (error) {
            console.error('❌ Ошибка проверки пользователя:', error);
            // В случае ошибки считаем пользователя новым
            await apiService.registerUser(userData);
            setIsNewUser(true);
          }
          
          setIsLoadingAvatar(false);
          
          // Загружаем лобби при входе в приложение
          await refreshLobbies();
          console.log('✅ Лобби загружены при входе в приложение');
        }
      } catch (error) {
        console.error('❌ Ошибка инициализации приложения:', error);
        setIsLoadingAvatar(false);
      }
    };

    initializeApp();
  }, [webApp, refreshLobbies]);

  // Получение текущего пользователя (аналогично GameLobby)
  const getCurrentUser = () => {
    // Сначала пытаемся получить данные из Telegram WebApp
    if (webApp?.initDataUnsafe?.user) {
      return webApp.initDataUnsafe.user;
    }
    
    // Fallback для разработки
    let developmentUserId = localStorage.getItem('development_user_id');
    if (!developmentUserId) {
      developmentUserId = `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('development_user_id', developmentUserId);
    }
    
    return {
      id: developmentUserId,
      first_name: 'Данил',
      last_name: 'Березин',
      username: 'danil_berezin'
    };
  };

  // Обработчик выхода из лобби (для onBack в GameLobby)
  const handleLobbyBack = async () => {
    if (currentLobby) {
      try {
        const playerId = getCurrentUser()?.id?.toString() || `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await fetch(`${API_BASE_URL}/games/${currentLobby.id}/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ playerId }),
        });
        
        // Очищаем localStorage при выходе из лобби
        const joinAttemptKey = `lobby_join_attempt_${currentLobby.id}_${playerId}`;
        localStorage.removeItem(joinAttemptKey);
        
        console.log('Покидаем лобби через onBack:', currentLobby.id);
      } catch (error) {
        console.error('Ошибка при покидании лобби через onBack:', error);
      }
    }
    
    setCurrentLobby(null);
    loadLobbies();
  };

  // Обработчик для кнопки "Назад"
  // Обработчик выбора аватарки
  const handleAvatarSelect = async (avatar: string) => {
    try {
      const user = getCurrentUser();
      if (user) {
        await apiService.updateUserAvatar(user.id.toString(), avatar);
        console.log('✅ Аватарка сохранена:', avatar);
        setShowAvatarSelection(false);
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения аватарки:', error);
    }
  };

  const handleBackButtonClick = async () => {
    if (isGameStarted) {
      setIsGameStarted(false);
    } else if (currentLobby) {
      // Вызываем API для покидания лобби перед выходом
      try {
        const playerId = getCurrentUser()?.id?.toString() || `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await fetch(`${API_BASE_URL}/games/${currentLobby.id}/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ playerId }),
        });
        
        // Очищаем localStorage при выходе из лобби
        const joinAttemptKey = `lobby_join_attempt_${currentLobby.id}_${playerId}`;
        localStorage.removeItem(joinAttemptKey);
        
        console.log('Покидаем лобби через кнопку Назад:', currentLobby.id);
      } catch (error) {
        console.error('Ошибка при покидании лобби через кнопку Назад:', error);
      }
      
      setCurrentLobby(null);
      // Обновим список лобби после выхода, чтобы актуализировать количества игроков
      refreshLobbies();
    } else {
      setCurrentPage('play');
    }
  };

  // Обработка приглашений через startapp параметр
  useEffect(() => {
    const startParam = webApp?.initDataUnsafe?.start_param;
    if (!startParam || startParamHandled) return;
    setStartParamHandled(true);
    if (startParam.startsWith('join_')) {
      const gameIdString = startParam.replace('join_', '');
      const joinFlow = async (targetGameId: string) => {
        try {
          const updatedGame = await onJoinGame(targetGameId);
          if (updatedGame) setCurrentLobby(updatedGame);
        } catch (error) {
          const msg = error instanceof Error ? error.message : '';
          if (/готова|заполнена|ready|full/i.test(msg)) return;
          webApp?.showAlert('Не удалось присоединиться к игре. Попробуйте еще раз.');
        }
      };
      const game = allGames.find((g: Game) => g.id === gameIdString) || myGames.find((g: Game) => g.id === gameIdString);
      if (game) {
        joinFlow(game.id);
      } else {
        // Попробуем загрузить лобби по id через onJoinGame — он сам подтянет
        joinFlow(gameIdString);
      }
    }
  }, [webApp, startParamHandled, allGames, myGames, onJoinGame]);

  // Управление BackButton в зависимости от текущей страницы
  useEffect(() => {
    if (!webApp?.BackButton) return;

    if (currentPage === 'play' && !currentLobby && !isGameStarted) {
      webApp.BackButton.hide();
    } else {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBackButtonClick);
    }

    // Очистка при размонтировании
    return () => {
      if (webApp?.BackButton) {
        webApp.BackButton.offClick(handleBackButtonClick);
      }
    };
  }, [currentPage, currentLobby, isGameStarted, webApp]);

  // Обработка выхода из приложения при нахождении в лобби
  useEffect(() => {
    const handleAppExit = async () => {
      if (currentLobby) {
        try {
          const playerId = getCurrentUser()?.id?.toString() || `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          
          // Используем navigator.sendBeacon для надежной отправки при выходе
          const data = JSON.stringify({ playerId });
          const url = `${API_BASE_URL}/games/${currentLobby.id}/leave`;
          
          if (navigator.sendBeacon) {
            navigator.sendBeacon(url, data);
          } else {
            // Fallback для браузеров без поддержки sendBeacon
            await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: data,
              keepalive: true
            });
          }
          
          // Очищаем localStorage
          const joinAttemptKey = `lobby_join_attempt_${currentLobby.id}_${playerId}`;
          localStorage.removeItem(joinAttemptKey);
          
          console.log('Покидаем лобби при выходе из приложения:', currentLobby.id);
        } catch (error) {
          console.error('Ошибка при покидании лобби при выходе из приложения:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleAppExit();
      }
    };

    // Добавляем обработчик события visibilitychange (без beforeunload чтобы избежать предупреждения браузера)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Очистка при размонтировании
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentLobby]);

  const handleCreateGame = async (gameData: any) => {
    const createdGame = await createGame(gameData);
    if (createdGame) {
      setIsCreateModalOpen(false);
      setCurrentLobby(createdGame);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    const updatedGame = await onJoinGame(gameId).catch((e) => { throw e; });
    if (updatedGame) setCurrentLobby(updatedGame);
    return updatedGame;
  };

  const getAppContainerClass = () => {
    if (isGameStarted) return 'app-container game-mode';
    if (currentLobby) return 'app-container lobby-mode';
    return 'app-container';
  };

  const getMainContentClass = () => {
    if (isGameStarted) return 'main-content game-content';
    if (currentLobby) return 'main-content lobby-content';
    return 'main-content';
  };

  const renderCurrentPage = () => {
    if (isGameStarted && currentLobby) {
      return (
        <GamePlay
          game={currentLobby}
          players={currentPlayers}
          onBackToLobby={() => {
            setIsGameStarted(false);
            // Устанавливаем время выхода из игры для предотвращения перезаписи статуса "не готов"
            localStorage.setItem(`exit_from_game_${currentLobby.id}`, Date.now().toString());
          }}
          onPlayAgain={() => {
            // оставить в GamePlay
          }}
          onPlayerLeft={showPlayerLeft}
        />
      );
    }

    if (currentLobby) {
      return (
        <GameLobby
          game={currentLobby}
          onBack={handleLobbyBack}
          onStartGame={() => setIsGameStarted(true)}
          onJoinGame={handleJoinGame}
          onPlayersUpdate={(players) => setCurrentPlayers(players)}
          onPlayerLeft={showPlayerLeft}
          onPlayerJoined={showPlayerJoined}
        />
      );
    }

    switch (currentPage) {
      case 'play':
        return (
        <PlayPage
          allGames={allGames}
          myGames={myGames}
          onJoinGame={handleJoinGame}
          onCreateGame={() => setIsCreateModalOpen(true)}
          onDeleteLobby={deleteLobby}
          onRemoveLobby={removeLobbyFromState}
          onRefreshLobbies={refreshLobbies}
          onLoadAllLobbies={loadLobbies}
          onLoadMyLobbies={loadMyLobbies}
        />
      );
      case 'rating':
        return (
          <RatingPage 
            onOpenUserProfile={(userId) => { 
              setViewingUserId(userId); 
              setCurrentPage('profile'); 
            }}
          />
        );
      case 'shop':
        return (
          <Suspense fallback={<div />}> 
            <ShopPage />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<div />}> 
            <ProfilePage userId={viewingUserId} />
          </Suspense>
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return <PlayPage allGames={allGames} myGames={myGames} onJoinGame={handleJoinGame} onCreateGame={() => setIsCreateModalOpen(true)} onDeleteLobby={deleteLobby} onRefreshLobbies={refreshLobbies} onLoadAllLobbies={loadLobbies} onLoadMyLobbies={loadMyLobbies} />;
    }
  };

  // Показываем экран выбора аватарки, если нужно (только для новых пользователей после welcome modal)
  if (showAvatarSelection && !isLoadingAvatar && !showWelcomeModal) {
    return (
      <div className={getAppContainerClass()}>
        <AvatarSelection 
          onAvatarSelect={handleAvatarSelect} 
          user={getCurrentUser()}
        />
      </div>
    );
  }

  // Показываем загрузку, пока проверяем аватарку
  if (isLoadingAvatar) {
    return (
      <div className={getAppContainerClass()}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={getAppContainerClass()}>
      {!isGameStarted && (
        <ProfileHeader 
          user={webApp?.initDataUnsafe?.user}
          onDepositClick={() => setShowDepositModal(true)}
          onSettingsClick={() => setShowSettingsModal(true)}
        />
      )}
      
      <main className={getMainContentClass()}>
        {renderCurrentPage()}
      </main>

      {!isGameStarted && !currentLobby && (
        <BottomNavigation 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
        />
      )}

      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGame}
      />

      <WelcomeModal
        visible={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          setWelcomeModalShown(true);
          // Сохраняем в localStorage, что заставка была показана
          localStorage.setItem('welcomeModalShown', 'true');
          // Показываем выбор аватарки только для новых пользователей
          if (isNewUser) {
            setShowAvatarSelection(true);
          }
        }}
      />

      <DepositModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />

      <WithdrawModal
        visible={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />

      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onDepositClick={() => setShowDepositModal(true)}
        onWithdrawClick={() => setShowWithdrawModal(true)}
      />
      
      {/* Система уведомлений */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

export default App;
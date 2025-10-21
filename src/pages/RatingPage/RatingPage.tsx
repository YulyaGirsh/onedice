import React, { useState, useEffect, useMemo } from 'react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { useLanguage } from '../../hooks/useLanguage';
import { useGameData } from '../../hooks/useGameData';
import { FaTrophy, FaMedal, FaAward, FaStar } from 'react-icons/fa';
import styles from './RatingPage.module.css';
import { apiService } from '../../services/api';

interface RatingUser {
  id: string | number;
  username: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  rating: number;
  gamesWon: number;
  gamesPlayed: number;
  position: number;
}

const RatingCard: React.FC<{ 
  user: RatingUser; 
  isCurrentUser?: boolean;
  onOpenProfile?: (userId: string | number) => void;
  userAvatar?: string;
}> = ({ user, isCurrentUser, onOpenProfile, userAvatar }) => {
  const { t } = useLanguage();
  
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: 
        return <FaTrophy className={`${styles.positionIcon} ${styles.goldIcon}`} />;
      case 2: 
        return <FaMedal className={`${styles.positionIcon} ${styles.silverIcon}`} />;
      case 3: 
        return <FaAward className={`${styles.positionIcon} ${styles.bronzeIcon}`} />;
      default: 
        return <span className={styles.positionNumber}>#{position}</span>;
    }
  };

  const getWinRate = () => {
    return user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;
  };

  const handleCardClick = () => {
    if (!isCurrentUser && onOpenProfile) {
      onOpenProfile(user.id);
    }
  };

  return (
    <div 
      className={`${styles.ratingCard} ${isCurrentUser ? styles.currentUser : styles.clickableCard}`}
      onClick={handleCardClick}
    >
      <div className={styles.position}>
        {getPositionIcon(user.position)}
      </div>
      
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {userAvatar ? (
            <img 
              src={`/img/ava/${userAvatar}.jpg`} 
              alt={user.username}
              className={styles.avatarImage}
            />
          ) : (
            <span className={styles.avatarText}>
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        <div className={styles.userDetails}>
          <div className={styles.username}>
            {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username}
            {isCurrentUser && <span className={styles.youLabel}>{t('rating.you')}</span>}
          </div>
          <div className={styles.stats}>
            <span className={styles.winRate}>{getWinRate()}% {t('rating.wins')}</span>
            <span className={styles.gamesCount}>{user.gamesPlayed} {t('rating.games')}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.ratingSection}>
        <div className={styles.ratingValue}>{user.rating.toLocaleString()}</div>
        <div className={styles.ratingLabel}>{t('rating.points')}</div>
      </div>
    </div>
  );
};

const RatingPage: React.FC<{ onOpenUserProfile?: (userId: string | number) => void }> = ({ onOpenUserProfile }) => {
  const webApp = useTelegramWebApp();
  const { t } = useLanguage();
  const { playerStats } = useGameData();
  const [topUsers, setTopUsers] = useState<RatingUser[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  
  // Загрузка всех игроков из БД
  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.getTopPlayers(); // Убираем лимит чтобы получить всех игроков
        const mapped: RatingUser[] = data.map((u: any, idx: number) => {
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'anonymous';
          return {
            id: u.id,
            username: fullName, // Используем полное имя как username для совместимости
            firstName: u.first_name,
            lastName: u.last_name,
            rating: u.rating ?? 0,
            gamesWon: u.gamesWon ?? u.games_won ?? 0,
            gamesPlayed: u.gamesPlayed ?? u.games_played ?? 0,
            position: idx + 1
          };
        });
        setTopUsers(mapped);
        
        // Загружаем аватарки пользователей
        loadUserAvatars(mapped);
      } catch (e) {
        console.error('Не удалось получить рейтинг:', e);
        setTopUsers([]);
      }
    })();
  }, []);
  
  // Функция для загрузки аватарок пользователей
  const loadUserAvatars = async (users: RatingUser[]) => {
    const avatars: Record<string, string> = {};
    
    for (const user of users) {
      try {
        const avatar = await apiService.getUserAvatar(user.id.toString());
        if (avatar) {
          avatars[user.id.toString()] = avatar;
        }
      } catch (error) {
        console.log(`Не удалось загрузить аватар для пользователя ${user.id}:`, error);
      }
    }
    
    setUserAvatars(avatars);
  };
  
  // Список пользователей только из базы, пересчитываем позицию на всякий случай
  const allUsers = useMemo(() => {
    return topUsers
      .slice()
      .sort((a, b) => b.rating - a.rating)
      .map((user, index) => ({ ...user, position: index + 1 }));
  }, [topUsers]);

  return (
    <div className={styles.ratingPage} style={{ contain: 'content', willChange: 'transform' }}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <FaTrophy className={styles.trophy} />
          {t('rating.title')}
        </h1>
        <p className={styles.subtitle}>{t('rating.subtitle')}</p>
      </div>

      <div className={styles.topSection}>
        {playerStats && typeof playerStats.gamesPlayed === 'number' && playerStats.gamesPlayed === 0 && (
          <div className={styles.noGamesMessage}>
            <p className={styles.noGamesText}>{t('rating.playAtLeastOne')}</p>
          </div>
        )}
        
        <h2 className={styles.sectionTitle}>
          <FaStar className={styles.star} />
          {t('rating.playersTitle')}
        </h2>
        
        <div className={styles.ratingList}>
          {allUsers.map((user: RatingUser) => (
            <RatingCard 
              key={user.id} 
              user={user} 
              // Подсвечиваем текущего пользователя, если он есть в БД
              isCurrentUser={String(user.id) === String(webApp?.initDataUnsafe?.user?.id)}
              onOpenProfile={onOpenUserProfile}
              userAvatar={userAvatars[user.id.toString()]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingPage;
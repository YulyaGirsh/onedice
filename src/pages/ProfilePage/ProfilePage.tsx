import React, { useEffect, useState } from 'react';
import { useGameData } from '../../hooks/useGameData';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { useLanguage } from '../../hooks/useLanguage';
import { FaUser, FaHistory, FaTrophy } from 'react-icons/fa';
import styles from './ProfilePage.module.css';
import { apiService } from '../../services/api';

interface ProfilePageProps {
  userId?: string | number | null;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userId }) => {
  const { playerRating, playerStats } = useGameData();
  const webApp = useTelegramWebApp();
  const { t } = useLanguage();

  // Если пришёл внешний userId, используем его, иначе текущего пользователя из Telegram
  const currentTelegramUser = webApp?.initDataUnsafe?.user;
  const effectiveUserId = (userId ?? currentTelegramUser?.id)?.toString();

  const [profileUser, setProfileUser] = useState<{ id: string; username?: string; first_name?: string; last_name?: string; photo_url?: string } | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Подгружаем профиль пользователя (имя/username)
  useEffect(() => {
    const loadProfile = async () => {
      if (!effectiveUserId) return;
      try {
        // Если смотрим самого себя и Telegram доступен — возьмём данные из него
        if (!userId && currentTelegramUser) {
          setProfileUser({
            id: effectiveUserId,
            username: currentTelegramUser.username,
            first_name: currentTelegramUser.first_name,
            last_name: currentTelegramUser.last_name,
            photo_url: currentTelegramUser.photo_url,
          });
        } else {
          const p = await apiService.getUserProfile(effectiveUserId);
          setProfileUser(p);
        }
      } catch {
        setProfileUser(null);
      }
    };
    loadProfile();
  }, [effectiveUserId, userId]);

  // Загружаем аватарку пользователя
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (!effectiveUserId) return;
      try {
        const avatar = await apiService.getUserAvatar(effectiveUserId);
        setUserAvatar(avatar);
      } catch (error) {
        console.log('Аватарка не найдена или ошибка загрузки:', error);
        setUserAvatar(null);
      }
    };
    loadUserAvatar();
  }, [effectiveUserId]);

  // Подгружаем рейтинг/стату из бэкенда
  useEffect(() => {
    const loadStats = async () => {
      try {
        if (!effectiveUserId) return;
        const stats = await apiService.getUserStats(effectiveUserId);
        setBackendStats(stats);
      } catch {}
    };
    loadStats();
    // Обновление раз в 5 секунд и при SSE/LocalStorage триггерах
    const interval = setInterval(loadStats, 5000);
    const onStorage = (e: StorageEvent) => { if (e.key === 'user_stats_refresh') loadStats(); };
    window.addEventListener('storage', onStorage);
    // SSE подписка (если есть прокси на /events)
    let es: EventSource | null = null;
    try { es = new EventSource('/events'); es.addEventListener('lobby_update', loadStats); } catch {}
    return () => { clearInterval(interval); window.removeEventListener('storage', onStorage); if (es) es.close(); };
  }, [effectiveUserId]);

  const [backendStats, setBackendStats] = useState<{ rating: number; gamesPlayed: number; gamesWon: number; } | null>({ rating: 0, gamesPlayed: 0, gamesWon: 0 });

  const telegramUsername = profileUser?.username || '';
  const firstName = profileUser?.first_name || '';
  const lastName = profileUser?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || t('profile.player');
  const photoUrl = profileUser?.photo_url;
  // Вычисляем позицию пользователя на основе рейтинга
  const calculateUserPosition = (userRating: number) => {
    if (userRating >= 2000) return 150;
    if (userRating >= 1500) return 850;
    if (userRating >= 1000) return 2500;
    return 7500;
  };

  const ratingValue = backendStats?.rating ?? playerRating.rating;
  const gamesPlayedValue = backendStats?.gamesPlayed ?? playerStats.gamesPlayed;
  const gamesWonValue = backendStats?.gamesWon ?? playerStats.gamesWon;
  const userPosition = calculateUserPosition(ratingValue);



  return (
    <div className={styles.profilePage}>
      {/* Профиль пользователя */}
      <div className={styles.profileSection}>
        <div className={styles.avatarContainer}>
          {userAvatar ? (
            <img src={`/img/ava/${userAvatar}.jpg`} alt="Avatar" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <h1 className={styles.username}>{telegramUsername ? `@${telegramUsername}` : t('profile.noUsername')}</h1>
        <p className={styles.displayName}>{fullName}</p>
      </div>

      {/* Статистика */}
      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>
          <FaTrophy className={styles.sectionIcon} />
          {t('profile.statistics')}
        </h2>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{ratingValue}</div>
            <div className={styles.statLabel}>{t('profile.rating')}</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{userPosition}</div>
            <div className={styles.statLabel}>{t('profile.position')}</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{gamesPlayedValue}</div>
            <div className={styles.statLabel}>{t('profile.games')}</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{gamesPlayedValue > 0 ? Math.round((gamesWonValue / gamesPlayedValue) * 100) : 0}%</div>
            <div className={styles.statLabel}>{t('profile.wins')}</div>
          </div>
        </div>
      </div>

      {/* Основные разделы */}
      <div className={styles.sectionsContainer}>
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <FaUser className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>{t('profile.inventory')}</h3>
          </div>
          <p className={styles.sectionDescription}>
            {t('profile.inventoryDescription')}
          </p>
          <div className={styles.comingSoon}>{t('common.comingSoon')}</div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <FaHistory className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>{t('profile.gameHistory')}</h3>
          </div>
          <p className={styles.sectionDescription}>
            {t('profile.gameHistoryDescription')}
          </p>
          <div className={styles.comingSoon}>{t('common.comingSoon')}</div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <FaTrophy className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>{t('profile.rating')}</h3>
          </div>
          <p className={styles.sectionDescription}>
            {t('profile.ratingDescription')}
          </p>
          <div className={styles.ratingInfo}>
            <span className={styles.ratingPosition}>#{userPosition}</span>
            <span className={styles.ratingPoints}>{ratingValue} {t('rating.points')}</span>
          </div>
        </div>
      </div>


    </div>
  );
};

export default ProfilePage;
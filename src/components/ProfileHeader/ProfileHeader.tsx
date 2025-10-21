import React, { useState, useEffect } from 'react';
import { UserInfo } from '../../types';
import { useGameData } from '../../hooks/useGameData';
import { useBalance } from '../../hooks/useBalance';
import { useLanguage } from '../../hooks/useLanguage';
import { WalletConnect } from '../WalletConnect';
import { IoSettingsOutline, IoAdd } from 'react-icons/io5';
import styles from './ProfileHeader.module.css';
import { apiService } from '../../services/api';

interface ProfileHeaderProps {
  user?: any; // Пользователь Telegram
  onProfileClick: () => void;
  onDepositClick: () => void;
  onSettingsClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  user, 
  onProfileClick, 
  onDepositClick, 
  onSettingsClick 
}) => {
  const { t } = useLanguage();
  const { playerRating } = useGameData();
  const { balance, connected, loading } = useBalance();
  const [headerRating, setHeaderRating] = useState<number>(playerRating.rating || 0);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: t('common.player'),
    lastName: '',
    username: '',
    photoUrl: ''
  });

  // Рейтинг теперь приходит через пропсы из useGameData

  useEffect(() => {
    // Загружаем данные пользователя из Telegram WebApp
    if (user) {
      setUserInfo({
        firstName: user.first_name || t('common.player'),
        lastName: user.last_name || '',
        username: user.username || '',
        photoUrl: user.photo_url || ''
      });
    } else if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
      setUserInfo({
        firstName: telegramUser.first_name || t('common.player'),
        lastName: telegramUser.last_name || '',
        username: telegramUser.username || '',
        photoUrl: telegramUser.photo_url || ''
      });
    }
  }, [user]);

  // Загружаем аватарку пользователя
  useEffect(() => {
    const loadUserAvatar = async () => {
      const id = (user?.id ?? window.Telegram?.WebApp?.initDataUnsafe?.user?.id)?.toString();
      if (!id) return;
      try {
        const avatar = await apiService.getUserAvatar(id);
        setUserAvatar(avatar);
      } catch (error) {
        console.log('Аватарка не найдена или ошибка загрузки:', error);
        setUserAvatar(null);
      }
    };
    loadUserAvatar();
  }, [user?.id]);

  // Загружаем и держим в актуальном состоянии рейтинг из бэкенда
  useEffect(() => {
    const load = async () => {
      const id = (user?.id ?? window.Telegram?.WebApp?.initDataUnsafe?.user?.id)?.toString();
      if (!id) return;
      try {
        const stats = await apiService.getUserStats(id);
        setHeaderRating(stats.rating ?? 0);
      } catch {}
    };
    load();
    const onStorage = (e: StorageEvent) => { if (e.key === 'user_stats_refresh') load(); };
    window.addEventListener('storage', onStorage);
    let es: EventSource | null = null;
    try { es = new EventSource('/events'); es.addEventListener('lobby_update', load); } catch {}
    const interval = setInterval(load, 10000);
    return () => { window.removeEventListener('storage', onStorage); if (es) es.close(); clearInterval(interval); };
  }, [user?.id]);

  const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();
  const displayName = fullName || (userInfo.username ? `@${userInfo.username}` : t('common.player'));

  return (
    <div className={styles.profileHeader}>
      <div className={styles.profileLeft}>
        <div className={styles.profileAvatar} onClick={onProfileClick}>
          {userAvatar ? (
            <img src={`/img/ava/${userAvatar}.jpg`} alt="Avatar" className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarFallback}>
              {userInfo.firstName.charAt(0)}
            </span>
          )}
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.profileName}>{displayName}</div>
          <div className={styles.profileRating}>{headerRating}</div>
        </div>
      </div>
      
      <div className={styles.profileRight}>
        {!connected ? (
          <WalletConnect className={styles.walletConnect} />
        ) : (
          <div className={styles.profileBalance}>
            <div className={styles.balanceContainer}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.balanceTonIcon}>
                <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
              </svg>
              <span className={styles.balanceValue}>
                {loading ? '...' : balance}
              </span>
            </div>
            <button 
              className={styles.balanceAddIcon}
              onClick={onDepositClick}
              disabled={loading}
title={t('wallet.depositTitle')}
            >
              <IoAdd size={22} />
            </button>
          </div>
        )}
        <button className={styles.profileMenuBtn} onClick={onSettingsClick}>
          <IoSettingsOutline size={22} />
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;
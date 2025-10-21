import React, { useState } from 'react';
import { WalletConnect } from '../../components/WalletConnect';
import { useBalance } from '../../hooks/useBalance';
import { useTonConnect } from '../../hooks/useTonConnect';
import { useLanguage } from '../../hooks/useLanguage';
import { IoArrowDownOutline, IoArrowUpOutline, IoShareOutline } from 'react-icons/io5';
import { DepositModal } from '../../components/DepositModal';
import { WithdrawModal } from '../../components/WithdrawModal';
import styles from './SettingsPage.module.css';

const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { connected } = useBalance();
  const { disconnectWallet, getShortAddress } = useTonConnect();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ru');
  const [selectedTheme, setSelectedTheme] = useState('dark');

  const languages = [
    { code: 'ru', name: t('languages.ru'), flag: '🇷🇺' },
    { code: 'en', name: t('languages.en'), flag: '🇺🇸' },
    { code: 'zh', name: t('languages.zh'), flag: '🇨🇳' }
  ];

  const themes = [
    { code: 'dark', name: t('settings.themes.dark'), icon: '🌙' },
    { code: 'light', name: t('settings.themes.light'), icon: '☀️' },
    { code: 'auto', name: t('settings.themes.system'), icon: '🔄' }
  ];

  return (
    <div className={styles.settingsPage}>
      {/* Заголовок */}
      <div className={styles.pageHeader}>
        <h1>{t('settings.title')}</h1>
      </div>

      {/* Кошелек TON */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
          </svg>
{t('settings.wallet')}
        </div>
        
        <div className={styles.walletSection}>
          <div className={styles.walletConnectInSettings}>
            {!connected ? (
              <WalletConnect />
            ) : (
              <button 
                className={styles.connectedWalletBtn}
                onClick={async () => {
                  // Показываем уведомление Telegram
                  if (window.Telegram?.WebApp?.showConfirm) {
                    window.Telegram.WebApp.showConfirm(
                      t('settings.confirmDisconnect'),
                      async (confirmed) => {
                        if (confirmed) {
                          try {
                            await disconnectWallet();
                          } catch (error) {
                            console.error('Error disconnecting wallet:', error);
                          }
                        }
                      }
                    );
                  } else {
                    // Fallback если Telegram API недоступен
                    if (confirm(t('settings.confirmDisconnect'))) {
                      try {
                        await disconnectWallet();
                      } catch (error) {
                        console.error('Error disconnecting wallet:', error);
                      }
                    }
                  }
                }}
title={t('wallet.disconnect')}
              >
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
                </svg>
                <span className={styles.walletAddressShort}>
                  {getShortAddress().substring(3)}
                </span>
              </button>
            )}
          </div>
        </div>
        
        {/* Кнопки действий */}
        {connected && (
          <div className={styles.actionButtons}>
            <button 
              className={styles.actionButton}
              onClick={() => setIsDepositModalOpen(true)}
title={t('wallet.deposit')}
            >
              <IoArrowDownOutline size={20} />
            </button>
            <button 
              className={styles.actionButton}
              onClick={() => setIsWithdrawModalOpen(true)}
title={t('wallet.withdraw')}
            >
              <IoArrowUpOutline size={20} />
            </button>
            <button 
              className={styles.actionButton}
              onClick={() => console.log(t('settings.inviteFriend'))}
title={t('settings.inviteFriend')}
            >
              <IoShareOutline size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Язык */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
          </svg>
{t('settings.language')}
        </div>
        
        <div className={styles.optionsContainer}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`${styles.optionButton} ${selectedLanguage === lang.code ? styles.optionButtonActive : ''}`}
              onClick={() => setSelectedLanguage(lang.code)}
            >
              <span className={styles.optionIcon}>{lang.flag}</span>
              <span className={styles.optionText}>{lang.name}</span>
              {selectedLanguage === lang.code && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.checkIcon}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Тема */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" fill="currentColor"/>
          </svg>
{t('settings.theme')}
        </div>
        
        <div className={styles.optionsContainer}>
          {themes.map((theme) => (
            <button
              key={theme.code}
              className={`${styles.optionButton} ${selectedTheme === theme.code ? styles.optionButtonActive : ''}`}
              onClick={() => setSelectedTheme(theme.code)}
            >
              <span className={styles.optionIcon}>{theme.icon}</span>
              <span className={styles.optionText}>{theme.name}</span>
              {selectedTheme === theme.code && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.checkIcon}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Модальные окна */}
      <DepositModal
        visible={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
      <WithdrawModal
        visible={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />
    </div>
  );
};

export default SettingsPage;
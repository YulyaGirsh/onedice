import React, { useEffect, useState } from 'react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { useTheme } from '../../hooks/useTheme';
import { useBalance } from '../../hooks/useBalance';
import { useTonConnect } from '../../hooks/useTonConnect';
import { useLanguage } from '../../hooks/useLanguage';
import { WalletConnect } from '../WalletConnect';
import { IoArrowDownOutline, IoArrowUpOutline, IoShareOutline } from 'react-icons/io5';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onDepositClick?: () => void;
  onWithdrawClick?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  visible, 
  onClose, 
  onDepositClick, 
  onWithdrawClick 
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  
  const webApp = useTelegramWebApp();
  const { theme, setTheme, currentTheme } = useTheme();
  const { balance, connected, loading } = useBalance();
  const { wallet, disconnectWallet, getShortAddress } = useTonConnect();
  const { currentLanguage, changeLanguage, availableLanguages, t, getThemeNames } = useLanguage();

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setIsClosing(false);
    }
  }, [visible]);

  const handleClose = () => {
    setIsClosing(true);
    webApp?.hapticFeedback?.impactOccurred('light');
    
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleDepositClick = () => {
    if (onDepositClick) {
      onDepositClick();
    }
  };

  const handleWithdrawClick = () => {
    if (onWithdrawClick) {
      onWithdrawClick();
    }
  };

  const handleShareClick = () => {
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(t('settings.shareMessage'));
    }
  };

  if (!isVisible) return null;



  return (
    <div className={`${styles.modal} ${isClosing ? styles.fadeOut : ''}`}>
      <div className={`${styles.content} ${currentTheme === 'dark' ? styles.dark : styles.light}`}>
        {/* Кнопка закрытия сверху справа */}
        <button className={styles.closeTopButton} onClick={handleClose} aria-label={t('common.close')}>
          <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className={styles.imageWrapper}>
          <svg width="64" height="64" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.image}>
            <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
          </svg>
        </div>

        <div className={styles.textContent}>
          <h2 className={styles.title}>{t('settings.title')}</h2>
          
          <div className={styles.features}>
            {/* Кошелек TON */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                {t('settings.wallet')}
              </div>
              
              <div className={styles.walletSection}>
                {!connected ? (
                  <WalletConnect className={styles.walletConnectInSettings} />
                ) : (
                  <div className={styles.connectedWallet}>
                    <div className={styles.walletInfo}>
                      <div className={styles.walletIcon}>
                        <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className={styles.walletDetails}>
                        <div className={styles.walletName}>{wallet?.wallet?.name || t('wallet.connected')}</div>
                        <div className={styles.walletAddress}>{getShortAddress()}</div>
                      </div>
                    </div>
                    <button 
                      className={styles.disconnectBtn}
                      onClick={async () => {
                        try {
                          await disconnectWallet();
                        } catch (error) {
                          console.error('Error disconnecting wallet:', error);
                        }
                      }}
                      title={t('wallet.disconnect')}
                    >
                      {t('wallet.disconnect')}
                    </button>
                  </div>
                )}
                
                {connected && (
                  <div className={styles.balanceDisplay}>
                    <span className={styles.balanceLabel}>{t('wallet.balance', { amount: loading ? '...' : balance })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Кнопки действий */}
            {connected && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  {t('settings.actions')}
                </div>
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.actionButton}
                    onClick={handleDepositClick}
                    title={t('wallet.depositTitle')}
                  >
                    <IoArrowDownOutline size={20} />
                    <span>{t('wallet.deposit')}</span>
                  </button>
                  <button 
                    className={styles.actionButton}
                    onClick={handleWithdrawClick}
                    title={t('wallet.withdrawTitle')}
                  >
                    <IoArrowUpOutline size={20} />
                    <span>{t('wallet.withdraw')}</span>
                  </button>
                  <button 
                    className={styles.actionButton}
                    onClick={handleShareClick}
                    title={t('common.share')}
                  >
                    <IoShareOutline size={20} />
                    <span>{t('common.share')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Язык */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                {t('settings.language')}
              </div>
              <div className={styles.inlineButtons}>
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`${styles.inlineButton} ${currentLanguage === lang.code ? styles.selected : ''}`}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    <span className={styles.optionIcon}>{lang.flag}</span>
                    <span className={styles.optionName}>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Тема */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                {t('settings.theme')}
              </div>
              <div className={styles.inlineButtons}>
                {getThemeNames().map((themeOption) => (
                  <button
                    key={themeOption.code}
                    className={`${styles.inlineButton} ${theme === themeOption.code ? styles.selected : ''}`}
                    onClick={() => setTheme(themeOption.code as 'light' | 'dark' | 'system')}
                    title={themeOption.name}
                  >
                    {/* Векторные иконки, завязаны на currentColor */}
                    {themeOption.code === 'light' && (
                      <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4V2M12 22v-2M4.93 4.93L3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2M22 12h-2M4.93 19.07L3.51 20.49M20.49 3.51l-1.42 1.42M12 6a6 6 0 100 12 6 6 0 000-12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {themeOption.code === 'dark' && (
                      <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {themeOption.code === 'system' && (
                      <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                    <span className={styles.optionName}>{themeOption.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Информация о приложении */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                {t('settings.about')}
              </div>
              <div className={styles.appInfo}>
                <div className={styles.appVersion}>{t('settings.version')}</div>
                <div className={styles.appDescription}>
                  {t('settings.description')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Нижнюю кнопку закрытия убрали — теперь закрытие сверху справа */}
      </div>
    </div>
  );
};

export default SettingsModal;
import React from 'react';
import { useTonConnect } from '../../hooks/useTonConnect';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './WalletConnect.module.css';

interface WalletConnectProps {
  className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ className }) => {
  const {
    wallet,
    connected,
    loading,
    connectWallet,
    disconnectWallet,
    getShortAddress,
    getWalletAddress
  } = useTonConnect();
  const { t } = useLanguage();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // Здесь можно добавить уведомление об ошибке
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const copyAddress = async () => {
    const address = getWalletAddress();
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        // Здесь можно добавить уведомление об успешном копировании
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  if (connected && wallet && wallet.wallet) {
    return (
      <div className={`${styles.walletConnected} ${className || ''}`}>
        <div className={styles.walletInfo}>
          <div className={styles.walletIcon}>
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
            </svg>
          </div>
          <div className={styles.walletDetails}>
            <div className={styles.walletName}>{wallet?.wallet?.name || 'TON Wallet'}</div>
            <div className={styles.walletAddress} onClick={copyAddress} title={t('wallet.copyAddress')}>
              {getShortAddress()}
            </div>
          </div>
        </div>
        <button 
          className={styles.disconnectBtn}
          onClick={handleDisconnect}
          disabled={loading}
        >
          {loading ? t('wallet.disconnecting') : t('wallet.disconnect')}
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.walletConnect} ${className || ''}`}>
      <button 
        className={styles.connectBtn}
        onClick={handleConnect}
        disabled={loading}
      >
        <div className={styles.btnContent}>
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
          </svg>
          <span>{loading ? t('wallet.connecting') : t('wallet.connectTON')}</span>
        </div>
      </button>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { useTheme } from '../../hooks/useTheme';
import { useBalance } from '../../hooks/useBalance';
import { useTonConnect } from '../../hooks/useTonConnect';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './WithdrawModal.module.css';

interface WithdrawModalProps {
  visible: boolean;
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ visible, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  
  const webApp = useTelegramWebApp();
  const { currentTheme } = useTheme();
  const { connected } = useTonConnect();
  const { balance, withdrawBalance } = useBalance();
  const { t } = useLanguage();

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setIsClosing(false);
      setAmount('');
      setError('');
      document.body.classList.add('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [visible]);

  const handleClose = () => {
    setIsClosing(true);
    webApp?.hapticFeedback?.impactOccurred('light');
    
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleWithdraw = async () => {
    if (!connected) {
      setError(t('errors.walletNotConnected'));
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0.1) {
      setError(t('withdraw.minAmount'));
      return;
    }

    if (numAmount > parseFloat(balance)) {
      setError(t('withdraw.insufficientFunds'));
      return;
    }

    try {
      await withdrawBalance(amount);
      console.log(t('withdraw.withdrawing'), amount);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('withdraw.error'));
    }
  };

  const validateAmount = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0.1) {
      setError(t('withdraw.minAmount'));
      return false;
    }
    if (numValue > parseFloat(balance)) {
      setError(t('withdraw.insufficientFunds'));
      return false;
    }
    setError('');
    return true;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    validateAmount(value);
  };

  const handleMaxAmount = () => {
    const maxAmount = parseFloat(balance);
    if (maxAmount >= 0.1) {
      setAmount(maxAmount.toFixed(2));
      setError('');
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`${styles.modal} ${isClosing ? styles.fadeOut : ''}`}>
      <div className={`${styles.content} ${currentTheme === 'dark' ? styles.dark : styles.light}`}>
        <div className={styles.imageWrapper}>
          <svg width="64" height="64" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.image}>
            <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
          </svg>
        </div>

        <div className={styles.textContent}>
          <h2 className={styles.title}>{t('wallet.withdrawTitle')}</h2>
          
          {!connected ? (
            <div className={styles.features}>
              <div className={styles.feature}>
                {t('withdraw.walletRequired')}
              </div>
            </div>
          ) : (
            <div className={styles.features}>
              <div className={styles.balanceInfo}>
                <span>{t('withdraw.available')}: {balance} TON</span>
              </div>
              
              <div className={styles.inputContainer}>
                <input
                  type="number"
                  className={styles.amountInput}
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.1"
                  step="0.1"
                  min="0.1"
                  max={balance}
                />
                <div className={styles.tonIcon}>
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
              
              <button 
                className={styles.maxButton}
                onClick={handleMaxAmount}
                type="button"
              >
                {t('withdraw.maximum')}
              </button>
              
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.buttonContainer}>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
          >
            <span className={styles.buttonText}>
              {t('common.cancel')}
            </span>
          </button>
          
          {connected && (
            <button 
              className={styles.withdrawButton}
              onClick={handleWithdraw}
              disabled={!!error || !amount}
            >
              <span className={styles.buttonText}>
                {t('wallet.withdraw')}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
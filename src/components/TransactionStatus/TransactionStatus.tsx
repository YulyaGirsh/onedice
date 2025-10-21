import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './TransactionStatus.module.css';

interface TransactionStatusProps {
  status: 'idle' | 'pending' | 'success' | 'error';
  transactionHash?: string;
  error?: string;
  onClose: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  transactionHash,
  error,
  onClose
}) => {
  const { t } = useLanguage();
  
  if (status === 'idle') return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.content}>
          {status === 'pending' && (
            <div className={styles.pending}>
              <div className={styles.spinner}></div>
              <h3>{t('transaction.processing')}</h3>
              <p>{t('transaction.processingDescription')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className={styles.success}>
              <div className={styles.successIcon}>✓</div>
              <h3>{t('transaction.successful')}</h3>
              <p>{t('transaction.balanceUpdated')}</p>
              {transactionHash && (
                <div className={styles.hashContainer}>
                  <p>{t('transaction.hash')}:</p>
                  <code className={styles.hash}>{transactionHash}</code>
                </div>
              )}
              <button className={styles.closeBtn} onClick={onClose}>
                {t('common.close')}
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.error}>
              <div className={styles.errorIcon}>✗</div>
              <h3>{t('transaction.error')}</h3>
              <p>{error || t('transaction.errorDescription')}</p>
              <button className={styles.closeBtn} onClick={onClose}>
                {t('common.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './TransactionModal.module.css';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: string;
  defaultTo?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  defaultAmount = '0.1',
  defaultTo = ''
}) => {
  const { t } = useLanguage();
  const [to, setTo] = useState(defaultTo);
  const [amount, setAmount] = useState(defaultAmount);
  const [data, setData] = useState('');

  const {
    sendTONTransaction,
    transactionStatus,
    transactionHash,
    error,
    resetTransactionStatus,
    parseTONAmount,
    connected,
    loading
  } = useTransactions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!to.trim()) {
      alert(t('transaction.enterRecipientAddress'));
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert(t('transaction.enterValidAmount'));
      return;
    }

    const transactionData = {
      to: to.trim(),
      value: parseTONAmount(amount),
      data: data.trim() || undefined
    };

    await sendTONTransaction(transactionData);
  };

  const handleClose = () => {
    resetTransactionStatus();
    onClose();
  };

  const handleAmountChange = (value: string) => {
    // Разрешаем только цифры и точку
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === '') {
      setAmount(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('transaction.sendTON')}</h3>
          <button className="modal-close-btn" onClick={handleClose}>×</button>
        </div>

        {!connected ? (
          <div className={styles.notConnected}>
            <p>{t('transaction.walletRequired')}</p>
            <button className={styles.connectWalletBtn} onClick={handleClose}>
              {t('wallet.connect')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.transactionForm}>
            {/* Адрес получателя */}
            <div className={styles.formGroup}>
              <label>{t('transaction.recipientAddress')}</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="EQCD39SSkAeAq21X16uQ_4yvL-lP9W792ZJ_LpS578L_M6eJ"
                className={styles.formInput}
                required
                disabled={loading}
              />
            </div>

            {/* Сумма */}
            <div className={styles.formGroup}>
              <label>
                <span>{t('transaction.amount')}</span>
                <div className="ton-label">
                  <svg width="16" height="16" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="ton-icon-label">
                    <path d="M19.4687 6.33953L11.7971 18.52C11.7037 18.6671 11.5745 18.7882 11.4216 18.8721C11.2686 18.956 11.0969 19 10.9223 19C10.7464 19.0003 10.5732 18.956 10.4193 18.8711C10.2653 18.7862 10.1356 18.6636 10.0423 18.5148L2.5209 6.33437C2.31019 5.99296 2.19906 5.59977 2.19996 5.1989C2.2095 4.60707 2.45412 4.04319 2.88016 3.63099C3.30619 3.21879 3.87883 2.99194 4.47243 3.00022H17.5378C18.7854 3.00022 19.8 3.98085 19.8 5.19374C19.8 5.59631 19.6861 5.99373 19.4687 6.33953ZM4.3689 5.93179L9.96466 14.5355V5.06471H4.95384C4.37407 5.06471 4.11525 5.44664 4.3689 5.93179ZM12.0352 14.5355L17.631 5.93179C17.8898 5.44664 17.6258 5.06471 17.0461 5.06471H12.0352V14.5355Z" fill="currentColor"/>
                  </svg>
                  <span>TON</span>
                </div>
              </label>
              <div className={styles.amountInputContainer}>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={styles.amountInput}
                  placeholder="0.1"
                  required
                  disabled={loading}
                />
                <div className={styles.amountSuggestions}>
                  {['0.1', '0.5', '1', '2', '5'].map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      className={`${styles.amountSuggestion} ${amount === suggestion ? styles.active : ''}`}
                      onClick={() => setAmount(suggestion)}
                      disabled={loading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Дополнительные данные */}
            <div className={styles.formGroup}>
              <label>{t('transaction.additionalData')}</label>
              <textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder={t('transaction.additionalDataPlaceholder')}
                className={styles.formTextarea}
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Статус транзакции */}
            {transactionStatus === 'pending' && (
              <div className={`${styles.transactionStatus} ${styles.pending}`}>
                <div className={styles.spinner}></div>
                <span>{t('transaction.sending')}</span>
              </div>
            )}

            {transactionStatus === 'success' && (
              <div className={`${styles.transactionStatus} ${styles.success}`}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.667 5L7.5 14.167L3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('transaction.sentSuccessfully')}</span>
                {transactionHash && (
                  <div className={styles.transactionHash}>
                    <span>{t('transaction.hash')}: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(transactionHash)}
                      className={styles.copyHashBtn}
                    >
                      {t('transaction.copy')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {transactionStatus === 'error' && (
              <div className={`${styles.transactionStatus} ${styles.error}`}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-3H9V5h2v7z" fill="currentColor"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Кнопки действий */}
            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={handleClose}
                disabled={loading}
              >
{t('common.cancel')}
              </button>
              <button 
                type="submit" 
                className={styles.sendBtn}
                disabled={loading || !to.trim() || !amount}
              >
{loading ? t('transaction.sending') : t('transaction.send')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
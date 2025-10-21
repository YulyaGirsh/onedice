import { useState } from 'react';
import { useTonConnect } from './useTonConnect';
import { useLanguage } from './useLanguage';

export interface TransactionData {
  to: string;
  value: string; // в нанотоннах
  data?: string;
}

export const useTransactions = () => {
  const { sendTransaction, connected, loading } = useTonConnect();
  const { t } = useLanguage();
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendTONTransaction = async (transactionData: TransactionData) => {
    if (!connected) {
      setError(t('wallet.notConnected'));
      setTransactionStatus('error');
      return;
    }

    try {
      setTransactionStatus('pending');
      setError(null);
      setTransactionHash(null);

      const result = await sendTransaction(transactionData);
      
      if (result) {
        setTransactionHash(result as unknown as string);
        setTransactionStatus('success');
      } else {
        setError(t('transaction.error'));
        setTransactionStatus('error');
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err instanceof Error ? err.message : t('transaction.error'));
      setTransactionStatus('error');
    }
  };

  const resetTransactionStatus = () => {
    setTransactionStatus('idle');
    setTransactionHash(null);
    setError(null);
  };

  const formatTONAmount = (nanotons: string): string => {
    const amount = parseFloat(nanotons);
    const tons = amount / 1e9; // 1 TON = 10^9 нанотонн
    return tons.toFixed(9).replace(/\.?0+$/, ''); // Убираем лишние нули
  };

  const parseTONAmount = (tons: string): string => {
    const amount = parseFloat(tons);
    const nanotons = Math.floor(amount * 1e9); // Конвертируем в нанотонны
    return nanotons.toString();
  };

  return {
    sendTONTransaction,
    transactionStatus,
    transactionHash,
    error,
    resetTransactionStatus,
    formatTONAmount,
    parseTONAmount,
    connected,
    loading
  };
};
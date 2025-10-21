import { useState, useEffect } from 'react';
import { useTonConnect } from './useTonConnect';
import { useLanguage } from './useLanguage';

export const useBalance = () => {
  const { t } = useLanguage();
  const { connected, sendTransaction } = useTonConnect();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Имитация получения баланса из TON кошелька
  const fetchBalance = async () => {
    if (!connected) {
      setBalance('0');
      setHasInitialized(false);
      return;
    }

    setLoading(true);
    try {
      // Если кошелек не подключен, показываем 0
      if (!connected) {
        setBalance('0');
        setHasInitialized(false);
      } else {
        // Если это первое подключение кошелька, показываем 0
        if (!hasInitialized) {
          setBalance('0');
          setHasInitialized(true);
        } else {
          // Для последующих запросов используем реальный баланс
          const mockBalance = Math.random() * 10; // Случайный баланс от 0 до 10 TON
          setBalance(mockBalance.toFixed(2));
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  // Обновляем баланс при изменении подключения кошелька
  useEffect(() => {
    fetchBalance();
  }, [connected]);

  // Функция для пополнения баланса
  const depositBalance = async (amount: string) => {
    if (!connected) {
      throw new Error(t('wallet.notConnected'));
    }

    setLoading(true);
    try {
      // Конвертируем TON в нанотоны (1 TON = 10^9 нанотонн)
      const amountInNanotons = (parseFloat(amount) * 1000000000).toString();
      
      // Адрес кошелька приложения (замените на реальный адрес)
      const appWalletAddress = 'EQCD39SSkAeAq21X16uQ_4yvL-lP9W792ZJ_LpS578L_M6eJ';
      
      // Создаем транзакцию для пополнения
      const transaction = {
        to: appWalletAddress, // Адрес кошелька приложения
        value: amountInNanotons, // Сумма в нанотонах
        data: 'deposit', // Дополнительные данные для идентификации депозита
      };

      // Отправляем транзакцию через TON Connect
      const result = await sendTransaction(transaction);
      
      if (result) {
        // Если транзакция успешна, обновляем баланс
        const currentBalance = parseFloat(balance);
        const depositAmount = parseFloat(amount);
        const newBalance = currentBalance + depositAmount;
        setBalance(newBalance.toFixed(2));
        
        return { 
          success: true, 
          newBalance: newBalance.toFixed(2),
          transactionHash: result
        };
      } else {
        throw new Error(t('errors.transactionNotSent'));
      }
    } catch (error) {
      console.error('Error depositing balance:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Функция для снятия баланса
  const withdrawBalance = async (amount: string) => {
    if (!connected) {
      throw new Error(t('wallet.notConnected'));
    }

    const currentBalance = parseFloat(balance);
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount > currentBalance) {
      throw new Error(t('wallet.insufficientFunds'));
    }

    setLoading(true);
    try {
      // Здесь будет реальная логика снятия баланса
      const newBalance = currentBalance - withdrawAmount;
      setBalance(newBalance.toFixed(2));
      
      return { success: true, newBalance: newBalance.toFixed(2) };
    } catch (error) {
      console.error('Error withdrawing balance:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    balance,
    loading,
    connected,
    fetchBalance,
    depositBalance,
    withdrawBalance
  };
};
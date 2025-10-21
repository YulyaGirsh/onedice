import { useState, useEffect } from 'react';
import { TonConnectUI } from '@tonconnect/ui';

// Инициализация TON Connect UI (динамический манифест для dev/prod)
const manifestUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/tonconnect-manifest.json`
  : 'https://sosaaaal-da.cloudpub.ru/tonconnect-manifest.json';

const tonConnectUI = new TonConnectUI({ manifestUrl });

export interface WalletInfo {
  account: {
    address: string;
    chain: string;
    publicKey: string;
  };
  walletStateSource: string;
  wallet: {
    name: string;
    version: string;
    device: string;
  };
}

export const useTonConnect = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        // Восстанавливаем соединение после перезагрузки страницы, если возможно
        const restored = await (tonConnectUI as any).connectionRestored;
        if (restored && tonConnectUI.wallet) {
          setWallet(tonConnectUI.wallet as unknown as WalletInfo);
          setConnected(true);
        }
      } catch {
        // игнорируем, если API недоступно
      }

      // Подписка на изменение статуса вместо polling
      if (typeof (tonConnectUI as any).onStatusChange === 'function') {
        unsubscribe = (tonConnectUI as any).onStatusChange((w: unknown) => {
          if (w) {
            setWallet(w as WalletInfo);
            setConnected(true);
          } else {
            setWallet(null);
            setConnected(false);
          }
        });
      } else {
        // Фолбэк: одноразовая проверка текущего состояния
        if (tonConnectUI.wallet) {
          setWallet(tonConnectUI.wallet as unknown as WalletInfo);
          setConnected(true);
        }
      }
    })();

    return () => {
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch { /* noop */ }
      }
    };
  }, []);

  const connectWallet = async () => {
    try {
      setLoading(true);
      await tonConnectUI.connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setLoading(true);
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendTransaction = async (transaction: {
    to: string;
    value: string;
    data?: string;
  }) => {
    if (!connected) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // 60 секунд
        messages: [
          {
            address: transaction.to,
            amount: transaction.value,
            data: transaction.data || ''
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(tx);
      console.log('Transaction sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getWalletAddress = () => {
    return wallet?.account?.address || null;
  };

  const getShortAddress = () => {
    const address = getWalletAddress();
    if (!address) return '';
    
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    wallet,
    connected,
    loading,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    getWalletAddress,
    getShortAddress,
    tonConnectUI
  };
}; 
# Интеграция TON Connect в мини-приложение Telegram

Этот документ описывает интеграцию TON Connect в мини-приложение Telegram для работы с TON кошельками.

## Установленные зависимости

```bash
npm install @tonconnect/ui @tonconnect/sdk
```

## Структура интеграции

### 1. Файл манифеста

Создан файл `public/tonconnect-manifest.json` с настройками приложения:

```json
{
  "url": "https://your-app-domain.com",
  "name": "Dice Game TON",
  "iconUrl": "https://your-app-domain.com/icon.png",
  "termsOfUseUrl": "https://your-app-domain.com/terms",
  "privacyPolicyUrl": "https://your-app-domain.com/privacy",
  "features": [
    {
      "name": "ton_addr"
    },
    {
      "name": "ton_proof"
    }
  ]
}
```

### 2. Хук useTonConnect

Файл `src/hooks/useTonConnect.ts` предоставляет функциональность для:

- Подключения/отключения кошелька
- Отправки транзакций
- Получения информации о кошельке
- Отслеживания состояния подключения

### 3. Компонент WalletConnect

Файл `src/components/WalletConnect/WalletConnect.tsx` - UI компонент для:

- Отображения кнопки подключения кошелька
- Показа информации о подключенном кошельке
- Возможности отключения кошелька

### 4. Хук useTransactions

Файл `src/hooks/useTransactions.ts` для работы с транзакциями:

- Отправка TON транзакций
- Отслеживание статуса транзакций
- Конвертация сумм между TON и нанотоннами

### 5. Компонент TransactionModal

Файл `src/components/TransactionModal/TransactionModal.tsx` - модальное окно для:

- Ввода адреса получателя
- Указания суммы транзакции
- Добавления дополнительных данных
- Отображения статуса транзакции

## Использование

### Подключение кошелька

```tsx
import { WalletConnect } from './components/WalletConnect';

function App() {
  return (
    <div>
      <WalletConnect />
    </div>
  );
}
```

### Отправка транзакции

```tsx
import { TransactionModal } from './components/TransactionModal';
import { useState } from 'react';

function App() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsTransactionModalOpen(true)}>
        Отправить TON
      </button>
      
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        defaultAmount="0.1"
        defaultTo="EQCD39SSkAeAq21X16uQ_4yvL-lP9W792ZJ_LpS578L_M6eJ"
      />
    </div>
  );
}
```

### Программная работа с кошельком

```tsx
import { useTonConnect } from './hooks/useTonConnect';

function MyComponent() {
  const {
    wallet,
    connected,
    loading,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    getWalletAddress,
    getShortAddress
  } = useTonConnect();

  const handleSendTransaction = async () => {
    if (!connected) {
      await connectWallet();
      return;
    }

    try {
      await sendTransaction({
        to: 'EQCD39SSkAeAq21X16uQ_4yvL-lP9W792ZJ_LpS578L_M6eJ',
        value: '1000000000', // 1 TON в нанотоннах
        data: 'Hello TON!'
      });
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      {connected ? (
        <div>
          <p>Кошелек подключен: {getShortAddress()}</p>
          <button onClick={handleSendTransaction}>Отправить 1 TON</button>
          <button onClick={disconnectWallet}>Отключить</button>
        </div>
      ) : (
        <button onClick={connectWallet} disabled={loading}>
          {loading ? 'Подключение...' : 'Подключить кошелек'}
        </button>
      )}
    </div>
  );
}
```

## Настройка для продакшена

### 1. Обновите манифест

Замените `https://your-app-domain.com` на реальный домен вашего приложения в файле `public/tonconnect-manifest.json`.

### 2. Настройте возврат в мини-приложение

Для корректной работы с мини-приложением Telegram добавьте в инициализацию TON Connect:

```tsx
const tonConnectUI = new TonConnectUI({
  manifestUrl: 'https://your-app-domain.com/tonconnect-manifest.json'
});
```

### 3. Разместите манифест

Убедитесь, что файл `tonconnect-manifest.json` доступен по URL, указанному в `manifestUrl`.

## Поддерживаемые кошельки

TON Connect поддерживает следующие кошельки:

- Tonkeeper
- TonHub
- MyTonWallet
- TonFlow
- И другие кошельки, совместимые с TON Connect

## Безопасность

1. **Никогда не храните приватные ключи** в коде приложения
2. **Всегда проверяйте адреса** перед отправкой транзакций
3. **Используйте HTTPS** в продакшене
4. **Валидируйте входные данные** перед отправкой транзакций

## Тестирование

Для тестирования используйте тестовую сеть TON:

1. Установите тестовый кошелек (например, Tonkeeper в тестовом режиме)
2. Получите тестовые TON через краны
3. Тестируйте функциональность в тестовой сети перед деплоем в основную

## Полезные ссылки

- [TON Connect документация](https://docs.ton.org/develop/dapps/ton-connect)
- [TON Connect UI SDK](https://github.com/ton-connect/ui)
- [TON кошельки](https://ton.org/wallets)
- [TON тестовая сеть](https://t.me/testgiver_ton_bot) 
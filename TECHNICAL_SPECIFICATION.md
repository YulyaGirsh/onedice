# 🎲 Dice Game TON - Полное техническое описание

## 📋 Обзор проекта

**Dice Game TON** - это Telegram Mini App для игры в кости с интеграцией блокчейна TON. Приложение позволяет пользователям подключать TON кошельки, пополнять баланс и участвовать в играх с использованием криптовалюты.

## 🏗️ Архитектура приложения

### Frontend Stack
- **React 18** + TypeScript
- **Vite** - сборщик и dev-сервер
- **CSS Modules** - стилизация компонентов
- **TON Connect SDK** - интеграция с блокчейном TON

### Структура проекта
```
dice-game-ton/
├── src/
│   ├── components/          # React компоненты
│   │   ├── ProfileHeader/   # Хедер с профилем и кошельком
│   │   ├── WalletConnect/   # Компонент подключения кошелька
│   │   ├── SettingsModal/   # Модальное окно настроек
│   │   ├── DepositModal/    # Модальное окно пополнения
│   │   ├── TransactionStatus/ # Статус транзакций
│   │   └── ...
│   ├── hooks/              # Кастомные React хуки
│   │   ├── useTonConnect.ts # Логика TON Connect
│   │   ├── useBalance.ts    # Управление балансом
│   │   ├── useTransactions.ts # Обработка транзакций
│   │   └── ...
│   ├── pages/              # Страницы приложения
│   │   ├── PlayPage/       # Игровая страница
│   │   ├── ProfilePage/    # Профиль пользователя
│   │   ├── RatingPage/     # Рейтинг игроков
│   │   └── ShopPage/       # Магазин (в разработке)
│   └── types/              # TypeScript типы
├── public/                 # Статические файлы
│   ├── tonconnect-manifest.json # Манифест TON Connect
│   ├── icon.svg           # Иконка приложения
│   └── ...
└── package.json
```

## 🔐 TON Connect Интеграция

### Конфигурация
- **Манифест**: `public/tonconnect-manifest.json`
- **Домен**: `https://sosaaaal-da.cloudpub.ru`
- **Поддерживаемые функции**: `ton_addr`, `ton_proof`

### Подключение кошелька
```typescript
// Инициализация TON Connect UI
const tonConnectUI = new TonConnectUI({
  manifestUrl: 'https://sosaaaal-da.cloudpub.ru/tonconnect-manifest.json'
});

// Подключение кошелька
const connectWallet = async () => {
  await tonConnectUI.connectWallet();
};

// Отключение кошелька
const disconnectWallet = async () => {
  await tonConnectUI.disconnect();
};
```

### Обработка транзакций
```typescript
// Отправка транзакции
const sendTransaction = async (transaction: {
  to: string;
  value: string;
  data?: string;
}) => {
  const tx = {
    validUntil: Math.floor(Date.now() / 1000) + 60,
    messages: [{
      address: transaction.to,
      amount: transaction.value,
      data: transaction.data || ''
    }]
  };
  
  return await tonConnectUI.sendTransaction(tx);
};
```

## 💰 Система баланса

### Логика баланса
- **Начальный баланс**: 0 TON при первом подключении
- **Пополнение**: Через TON транзакции на адрес приложения
- **Хранение**: В кошельке приложения `EQCD39SSkAeAq21X16uQ_4yvL-lP9W792ZJ_LpS578L_M6eJ`

### Пополнение баланса
```typescript
const depositBalance = async (amount: string) => {
  const amountInNanotons = (parseFloat(amount) * 1000000000).toString();
  
  const transaction = {
    to: appWalletAddress,
    value: amountInNanotons,
    data: 'deposit'
  };
  
  const result = await sendTransaction(transaction);
  // Обновление баланса после успешной транзакции
};
```

### Отображение баланса
- **В хедере**: Показывается только при подключенном кошельке
- **В настройках**: Полная информация о кошельке и балансе
- **Обновление**: Автоматическое при изменении состояния подключения

## 🎮 Игровая механика (планируется)

### Типы игр
1. **Классические кости** - ставка на результат броска
2. **Турниры** - соревнования между игроками
3. **Ежедневные бонусы** - бесплатные игры

### Игровой процесс
```typescript
interface GameSession {
  id: string;
  playerId: string;
  walletAddress: string;
  betAmount: number;
  gameType: 'dice' | 'tournament';
  status: 'pending' | 'active' | 'completed';
  result?: number;
  winAmount?: number;
  timestamp: Date;
}
```

### Ставки и выигрыши
- **Минимальная ставка**: 0.1 TON
- **Максимальная ставка**: 10 TON
- **Коэффициенты**: Зависят от типа игры и результата
- **Комиссия**: 2% от выигрыша

## 👤 Система пользователей

### Профиль пользователя
```typescript
interface UserProfile {
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  walletAddress?: string;
  rating: number;
  gamesPlayed: number;
  totalWon: number;
  totalLost: number;
  joinDate: Date;
}
```

### Рейтинговая система
- **Базовый рейтинг**: 1000
- **Изменение**: ±25 за игру
- **Уровни**: Новичок, Любитель, Профессионал, Мастер
- **Топ-игроки**: Еженедельный и месячный рейтинг

## ⚙️ Настройки приложения

### Языки
- **Русский** (по умолчанию)
- **English**
- **中文**

### Темы
- **Темная** (по умолчанию)
- **Светлая**
- **Авто** (следует системным настройкам)

### Кошелек
- **Подключение/отключение**
- **Просмотр баланса**
- **Пополнение средств**
- **История транзакций**

## 🔄 API Endpoints (для бэкенда)

### Пользователи
```
POST /api/users/register
GET /api/users/profile/:telegramId
PUT /api/users/profile/:telegramId
GET /api/users/rating
```

### Игры
```
POST /api/games/create
GET /api/games/:gameId
PUT /api/games/:gameId/result
GET /api/games/history/:userId
```

### Транзакции
```
POST /api/transactions/deposit
POST /api/transactions/withdraw
GET /api/transactions/history/:walletAddress
POST /api/transactions/verify
```

### Рейтинг
```
GET /api/rating/leaderboard
GET /api/rating/user/:userId
POST /api/rating/update
```

## 🗄️ База данных

### Основные таблицы

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  photo_url TEXT,
  wallet_address VARCHAR(255),
  rating INTEGER DEFAULT 1000,
  games_played INTEGER DEFAULT 0,
  total_won DECIMAL(20,9) DEFAULT 0,
  total_lost DECIMAL(20,9) DEFAULT 0,
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### games
```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id BIGINT REFERENCES users(telegram_id),
  wallet_address VARCHAR(255),
  game_type VARCHAR(50) NOT NULL,
  bet_amount DECIMAL(20,9) NOT NULL,
  result INTEGER,
  win_amount DECIMAL(20,9),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(255) NOT NULL,
  transaction_hash VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'deposit', 'withdraw', 'bet', 'win'
  amount DECIMAL(20,9) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  game_id UUID REFERENCES games(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP
);
```

#### rating_history
```sql
CREATE TABLE rating_history (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(telegram_id),
  old_rating INTEGER NOT NULL,
  new_rating INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  game_id UUID REFERENCES games(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 Безопасность

### Валидация транзакций
- **Проверка подписи** TON транзакций
- **Верификация адреса** отправителя
- **Защита от двойных трат**
- **Лимиты на ставки**

### Telegram WebApp
- **Валидация initData** от Telegram
- **Проверка пользователя** через Telegram API
- **Защита от подмены** данных

### Кошелек приложения
- **Холодное хранение** ключей
- **Мультисиг** для больших сумм
- **Автоматическое резервное копирование**

## 📊 Мониторинг и аналитика

### Метрики для отслеживания
- **Количество активных пользователей**
- **Объем транзакций**
- **Популярность игр**
- **Конверсия ставок**
- **Технические ошибки**

### Логирование
```typescript
interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  userId?: string;
  walletAddress?: string;
  gameId?: string;
  transactionHash?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

## 🚀 Развертывание

### Требования к серверу
- **Node.js 18+**
- **PostgreSQL 14+**
- **Redis** (для кеширования)
- **Nginx** (обратный прокси)

### Переменные окружения
```env
# База данных
DATABASE_URL=postgresql://user:pass@localhost/dicegame
REDIS_URL=redis://localhost:6379

# TON
TON_NETWORK=mainnet
TON_WALLET_ADDRESS=EQCD39SSkAeAq21X16uQ_4yvL-lP9W792ZJ_LpS578L_M6eJ
TON_WALLET_PRIVATE_KEY=your_private_key

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBAPP_URL=https://sosaaaal-da.cloudpub.ru

# Приложение
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db/dicegame
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: dicegame
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 🔄 CI/CD Pipeline

### Этапы развертывания
1. **Тестирование** - Unit и интеграционные тесты
2. **Сборка** - Создание production build
3. **Валидация** - Проверка безопасности и качества кода
4. **Развертывание** - Автоматическое обновление на сервере
5. **Мониторинг** - Проверка работоспособности

## 📈 Масштабирование

### Горизонтальное масштабирование
- **Load Balancer** для распределения нагрузки
- **Кластеризация** приложения
- **Шардинг** базы данных

### Кеширование
- **Redis** для сессий и временных данных
- **CDN** для статических файлов
- **Кеширование** результатов игр

## 🐛 Отладка и поддержка

### Инструменты отладки
- **Sentry** - отслеживание ошибок
- **LogRocket** - воспроизведение пользовательских сессий
- **Grafana** - мониторинг производительности

### Поддержка пользователей
- **Telegram Bot** для обратной связи
- **FAQ** и документация
- **Система тикетов**

## 📝 Документация API

### Swagger/OpenAPI
Полная документация API будет доступна по адресу:
```
https://api.dicegame.ton/docs
```

### Webhook интеграции
```typescript
interface WebhookPayload {
  event: 'game_created' | 'game_completed' | 'transaction_confirmed';
  data: {
    gameId?: string;
    userId?: string;
    walletAddress?: string;
    amount?: number;
    timestamp: Date;
  };
  signature: string; // HMAC подпись для безопасности
}
```

---

**Версия документации**: 1.0  
**Дата обновления**: 1 августа 2025  
**Автор**: Frontend Team  
**Статус**: В разработке 
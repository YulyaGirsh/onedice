# 🏆 Интеграция рейтинговой системы

## 📋 Обзор

Рейтинговая система полностью интегрирована в приложение. Рейтинг пользователя централизованно хранится в хуке `useGameData` и используется во всех компонентах.

**🔄 Мгновенная синхронизация:** Все компоненты используют `useGameData()` напрямую, что обеспечивает автоматическое обновление рейтинга во всем приложении при изменении данных.

## 🎯 Ключевые файлы

### 1. `src/hooks/useGameData.ts` - Центральное хранилище
```typescript
// Экспортирует:
const { playerRating, updatePlayerRating } = useGameData();

// playerRating содержит:
{
  rating: 1000,           // Числовой рейтинг пользователя
  ratingTitle: 'Стартовый' // Название уровня (не отображается в UI)
}
```

### 2. `src/components/ProfileHeader/ProfileHeader.tsx` - Отображение в профиле
- Показывает только числовой рейтинг `1000` в профиле
- Получает данные напрямую через `useGameData()`

### 3. `src/pages/RatingPage/RatingPage.tsx` - Страница рейтинга
- Показывает топ игроков
- Отображает позицию текущего пользователя
- Получает данные напрямую через `useGameData()`
- Использует реальный рейтинг из `playerRating.rating`

### 4. `src/types/index.ts` - Типы
```typescript
export interface PlayerRating {
  rating: number;
  ratingTitle: string;
}
```

## 🔧 Интеграция с бэкендом

### Шаг 1: Загрузка рейтинга при старте приложения

В `src/App.tsx` или любом компоненте добавьте:

```typescript
import { useGameData } from './hooks/useGameData';

function App() {
  const { updatePlayerRating } = useGameData();
  
  useEffect(() => {
    // Загружаем профиль пользователя с сервера
    api.getUserProfile().then(profile => {
      updatePlayerRating(profile.rating, profile.ratingTitle);
    });
  }, []);
}
```

### Шаг 2: Обновление рейтинга после игр

```typescript
// ВАРИАНТ 1: Полное обновление с сервера (рекомендуется)
const finishGameAPI = async (gameId) => {
  const result = await api.finishGame(gameId);
  
  // Обновляем рейтинг и статистику с сервера
  updatePlayerRating(result.newRating, result.newRatingTitle);
  updatePlayerStats(result.gamesPlayed, result.gamesWon);
  
  // Показываем уведомление
  WebApp.showAlert(`Рейтинг: ${result.newRating} (${result.ratingChange >= 0 ? '+' : ''}${result.ratingChange})`);
};

// ВАРИАНТ 2: Локальная логика (для оффлайн режима)
const { finishGame } = useGameData();

// При завершении 1v1 игры
const result = finishGame(isWin); // true для победы, false для поражения

console.log(`Новый рейтинг: ${result.newRating} (${result.ratingChange >= 0 ? '+' : ''}${result.ratingChange})`);
console.log(`Процент побед: ${result.newWinRate}%`);
```

### Шаг 3: API для страницы рейтинга

В `src/pages/RatingPage/RatingPage.tsx` замените моковые данные:

```typescript
// Заменить generateMockRatingData() на:
const [topUsers, setTopUsers] = useState([]);
const [userPosition, setUserPosition] = useState(null);

useEffect(() => {
  api.getLeaderboard().then(data => {
    setTopUsers(data.topUsers);
    setUserPosition(data.userPosition);
  });
}, []);
```

## 📊 Структура API (рекомендации)

### GET /api/profile
```json
{
  "rating": 1250,
  "ratingTitle": "Продвинутый",
  "gamesPlayed": 45,
  "gamesWon": 28
}
```

### GET /api/leaderboard
```json
{
  "topUsers": [
    {
      "id": 1,
      "username": "player1",
      "rating": 2500,
      "position": 1
    }
  ],
  "userPosition": {
    "position": 1337,
    "rating": 1250
  }
}
```

### POST /api/game/{id}/finish
```json
{
  "winner": "user123",
  "newRating": 1275,
  "newRatingTitle": "Продвинутый",
  "ratingChanged": true,
  "ratingDelta": +25
}
```

## ✅ Что уже готово

- ✅ Централизованное хранение рейтинга и статистики игр
- ✅ Отображение в профиле
- ✅ Страница рейтинга с топом игроков
- ✅ Позиция текущего пользователя
- ✅ Типизация TypeScript
- ✅ Функция обновления рейтинга и статистики
- ✅ Адаптивный дизайн
- ✅ **Логика начисления очков: +5 за победу, -3 за поражение**
- ✅ **Рейтинг не может быть ниже 0**
- ✅ **Правильный подсчет процента побед (0% если игр нет)**
- ✅ **Красивые значки для топ-3 (золото, серебро, бронза)**
- ✅ **Загрузка аватара пользователя из Telegram**
- ✅ **Правильная сортировка топ-10**
- ✅ **Тестирование рейтинговой системы в DebugPage**

## 🚀 Что нужно добавить (бэкенд)

- [ ] API для получения профиля пользователя
- [ ] API для получения таблицы лидеров
- [ ] Логика начисления/списания рейтинга после игр
- [ ] Система уровней рейтинга (Стартовый → Новичок → Продвинутый → Эксперт → Мастер)

## 🧪 Тестирование

Для тестирования рейтинговой системы:

1. Откройте приложение
2. Перейдите на вкладку **"Профиль"** (в нижнем меню)
3. В разделе "🏆 Тестирование рейтинга" нажимайте:
   - **"✅ Выиграть игру (+5)"** - добавляет победу
   - **"❌ Проиграть игру (-3)"** - добавляет поражение

После каждого действия обновляется:
- Рейтинг (с логикой +5/-3)
- Количество игр  
- Процент побед
- Позиция в рейтинге (на странице "Рейтинг")

**📱 Интеграция с Telegram:** Тактильная обратная связь (`HapticFeedback`) при нажатии кнопок. Статистика обновляется мгновенно во всех компонентах.

## 💡 Дополнительные возможности

1. **Анимации изменения рейтинга** - показывать +/-25 очков
2. **История рейтинга** - график изменений за период
3. **Достижения** - бейджи за определенные рейтинги
4. **Сезонные рейтинги** - обнуление каждый месяц
5. **Разные типы игр** - разная логика очков для лобби vs 1v1
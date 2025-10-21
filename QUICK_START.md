# 🚀 OneDice - Быстрый старт

## 📋 Команды для запуска

### Из корневой папки проекта:

```bash
# Frontend (React + Vite)
npm start
# или
npm run dev

# Backend (Node.js + Express)  
npm run server

# Telegram Bot (Python)
npm run bot
```

### Или используйте готовый скрипт:

```bash
# Запуск всех сервисов
.\start-local.bat
```

## 🔗 Ссылки после запуска

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/ping
- **Тестовая страница**: test-local.html

## 📊 Проверка статуса

```bash
.\check-status.bat
```

## 🎯 Доступные npm скрипты

| Команда | Описание |
|---------|----------|
| `npm start` | Запуск frontend (Vite) |
| `npm run dev` | Запуск frontend (Vite) |
| `npm run build` | Сборка frontend |
| `npm run server` | Запуск backend |
| `npm run bot` | Запуск Telegram бота |
| `npm run preview` | Превью собранного frontend |

## 🔧 Структура проекта

```
onedice/
├── src/                    # Frontend (React)
├── server/                 # Backend (Node.js)
├── main-simple.py          # Telegram Bot
├── package.json            # Frontend зависимости + скрипты
├── server/package.json     # Backend зависимости
└── requirements.txt        # Python зависимости
```

## ⚡ Быстрый тест

1. Запустите: `.\start-local.bat`
2. Откройте: http://localhost:3000
3. Проверьте: http://localhost:4000/ping

## 🐛 Решение проблем

### Ошибка "Missing script: start"
- Убедитесь, что вы в корневой папке проекта
- Выполните команды из этой папки

### Порт занят
```bash
# Остановить все процессы
taskkill /f /im node.exe
taskkill /f /im python.exe
```

### Backend не отвечает
- Проверьте, что в папке `server` установлены зависимости: `cd server && npm install`

---

**Готово!** 🎉 Все сервисы должны работать корректно.

# ✅ OneDice - Чеклист готовности к деплою

## 🔍 Проверка конфигурации

### ✅ API Configuration
- [x] `src/config/api.ts` - автоматическое определение окружения
- [x] Локальная разработка: относительные пути (прокси Vite)
- [x] Продакшен: абсолютные URL (https://onedice.ru/api)

### ✅ Telegram Bot
- [x] `main.py` - URL приложения: `https://onedice.ru/`
- [x] Канал: `https://t.me/onedices`
- [x] Чат: `https://t.me/myonedice`
- [x] Токен бота в `.env`

### ✅ Frontend
- [x] `vite.config.ts` - прокси настроен для локальной разработки
- [x] `package.json` - скрипты сборки готовы
- [x] Иконки аватаров в `public/icons/`
- [x] CSP заголовки настроены для Telegram

### ✅ Backend
- [x] `server/index.js` - порт настраивается через PORT
- [x] CORS настроен для onedice.ru
- [x] SQLite база данных готова
- [x] API endpoints работают

### ✅ Database
- [x] Таблица `users` с полями `avatar` и `username`
- [x] Функция `updateUserProfile` добавлена
- [x] Валидация аватаров настроена

## 📁 Файлы для деплоя

### ✅ Конфигурационные файлы
- [x] `production.config.js` - конфигурация продакшена
- [x] `nginx.conf` - конфигурация веб-сервера
- [x] `onedice-backend.service` - systemd сервис backend
- [x] `onedice-bot.service` - systemd сервис бота
- [x] `deploy.sh` - скрипт автоматического деплоя
- [x] `build-production.bat` - сборка для Windows

### ✅ Документация
- [x] `DEPLOYMENT.md` - подробное руководство по деплою
- [x] `deployment-checklist.md` - этот чеклист

## 🚀 Готовность к деплою

### ✅ Все локальные ссылки заменены
- [x] Нет hardcoded localhost в коде
- [x] API URL определяется автоматически
- [x] Telegram Bot использует onedice.ru

### ✅ Сборка готова
- [x] `npm run build` работает
- [x] Статические файлы генерируются в `dist/`
- [x] Иконки копируются в `public/icons/`

### ✅ Серверная конфигурация
- [x] Nginx настроен для onedice.ru
- [x] SSL/TLS конфигурация готова
- [x] Systemd сервисы настроены
- [x] Права доступа настроены

## 🎯 Финальные шаги

### 1. Сборка проекта
```bash
# Windows
build-production.bat

# Linux/Mac
npm run build
```

### 2. Деплой на сервер
```bash
# Автоматический деплой
./deploy.sh

# Или ручной деплой по инструкции в DEPLOYMENT.md
```

### 3. Настройка в BotFather
1. Откройте @BotFather
2. Выберите вашего бота
3. `/setmenubutton`
4. URL: `https://onedice.ru/`

## ✅ Статус: ГОТОВ К ДЕПЛОЮ

Все компоненты проверены и готовы для развертывания на https://onedice.ru

### 🌐 После деплоя будет доступно:
- **Frontend**: https://onedice.ru
- **API**: https://onedice.ru/api
- **Telegram Bot**: @your_bot_name
- **Канал**: https://t.me/onedices
- **Чат**: https://t.me/myonedice

---

**Проект полностью готов к продакшену!** 🚀

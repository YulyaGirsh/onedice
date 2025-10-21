# 🏗️ OneDice Build Guide

## 📋 Обзор сборки

Проект OneDice состоит из трех основных компонентов, которые нужно собирать:

1. **Frontend** - React + TypeScript приложение
2. **Backend** - Node.js + Express сервер
3. **Telegram Bot** - Python бот

## 🚀 Быстрая сборка

### Автоматическая сборка всего проекта

```bash
# Windows Batch
build-all.bat

# PowerShell
.\build-all.ps1
```

### Ручная сборка по компонентам

#### 1. Frontend (React + TypeScript)
```bash
# Установка зависимостей
npm install

# Сборка TypeScript
npx tsc

# Сборка Vite bundle
npm run build

# Или одной командой
npm run build
```

#### 2. Backend (Node.js)
```bash
cd server
npm install
```

#### 3. Telegram Bot (Python)
```bash
# Активация виртуального окружения
.\venv\Scripts\Activate.ps1

# Установка зависимостей
pip install -r requirements.txt
```

## 📁 Структура сборки

### Frontend
```
dist/                    # Собранное приложение
├── assets/             # Оптимизированные ресурсы
├── index.html          # Главная страница
└── ...
```

### Backend
```
server/
├── node_modules/       # Зависимости
├── index.js           # Основной файл
├── database.js        # База данных
└── package.json       # Конфигурация
```

### Bot
```
main.py                # Основной файл бота
.env                   # Переменные окружения
venv/                  # Виртуальное окружение
```

## 🔧 Команды сборки

### Frontend команды
```bash
npm run dev          # Разработка с hot reload
npm run build        # Продакшен сборка
npm run preview      # Превью продакшен сборки
npm run lint         # Проверка кода
```

### Backend команды
```bash
npm start            # Запуск сервера
npm run dev          # Разработка с nodemon
```

### Bot команды
```bash
python main.py       # Запуск бота
```

## ⚙️ Конфигурация сборки

### Vite конфигурация
- **Порт**: 3000 (dev), 5173 (preview)
- **Прокси**: API запросы перенаправляются на backend
- **HTTPS**: Поддержка для Telegram Web App

### TypeScript конфигурация
- **Строгий режим**: Включен
- **Целевая версия**: ES2020
- **Модули**: ES2020

### Backend конфигурация
- **Порт**: 4000
- **База данных**: SQLite
- **CORS**: Настроен для frontend

## 🐛 Решение проблем

### Frontend ошибки
```bash
# Очистка кеша
npm run build -- --force

# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install
```

### Backend ошибки
```bash
# Очистка node_modules
cd server
rm -rf node_modules package-lock.json
npm install
```

### Bot ошибки
```bash
# Переустановка Python зависимостей
pip install -r requirements.txt --force-reinstall
```

## 📊 Размеры сборки

### Frontend (продакшен)
- **Размер**: ~2-5 MB
- **Gzip**: ~500KB-1MB
- **Файлы**: HTML, CSS, JS, изображения

### Backend
- **Размер**: ~50-100 MB (с node_modules)
- **Зависимости**: Express, SQLite, CORS

### Bot
- **Размер**: ~10-20 MB (с venv)
- **Зависимости**: aiogram, python-dotenv

## 🚀 Развертывание

### Локальная разработка
```bash
# Терминал 1: Frontend
npm run dev

# Терминал 2: Backend
cd server && npm start

# Терминал 3: Bot
python main.py
```

### Продакшен
```bash
# Сборка frontend
npm run build

# Запуск backend
cd server && npm start

# Запуск bot
python main.py
```

## 📝 Чек-лист сборки

- [ ] Frontend зависимости установлены
- [ ] TypeScript компилируется без ошибок
- [ ] Vite сборка успешна
- [ ] Backend зависимости установлены
- [ ] Python зависимости установлены
- [ ] База данных инициализирована
- [ ] Переменные окружения настроены
- [ ] Все сервисы запускаются

---

**Статус**: ✅ Готово к сборке
**Последнее обновление**: $(Get-Date)

# 🚀 OneDice - Простое развертывание

## 📋 Упрощенная версия без сборки

Эта версия OneDice работает без сборки - просто загрузите файлы на сервер и они сразу заработают!

## 📁 Файлы для развертывания

### Основные файлы:
- `index-simple.html` - Простая игра в кости (без backend)
- `index-mini-app.html` - Полная версия с подключением к backend
- `main.py` - Telegram бот
- `server/` - Backend сервер

### Статические файлы:
- `public/` - Изображения, иконки, манифесты
- `public/tonconnect-manifest-simple.json` - Манифест TON Connect

## 🌐 Развертывание на сервере

### 1. Загрузите файлы на сервер

```bash
# Основные файлы
index-simple.html          # Простая версия
index-mini-app.html        # Полная версия
main.py                    # Telegram бот
requirements.txt           # Python зависимости

# Папки
server/                    # Backend
public/                    # Статические файлы
```

### 2. Настройте веб-сервер

#### Nginx конфигурация:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/onedice;
    index index-mini-app.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Apache .htaccess:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index-mini-app.html [QSA,L]
```

### 3. Запустите сервисы

#### Backend (Node.js):
```bash
cd server
npm install
npm start
```

#### Telegram Bot (Python):
```bash
pip install -r requirements.txt
python main.py
```

## 🎯 Варианты использования

### Вариант 1: Простая игра (только frontend)
- Используйте `index-simple.html`
- Работает без backend
- Только игра в кости
- Подключение TON кошелька

### Вариант 2: Полная версия (frontend + backend)
- Используйте `index-mini-app.html`
- Требует запущенный backend
- Многопользовательские лобби
- Рейтинговая система

## 🔧 Настройка

### 1. Обновите API URL
В `index-mini-app.html` измените:
```javascript
const API_BASE_URL = 'https://your-domain.com/api';
```

### 2. Настройте TON Connect
В `public/tonconnect-manifest-simple.json`:
```json
{
  "url": "https://your-domain.com",
  "iconUrl": "https://your-domain.com/icon.svg"
}
```

### 3. Настройте Telegram Bot
В `main.py` обновите URL приложения:
```python
# В приветственном сообщении
"Приложение - https://your-domain.com/"
```

## 📱 Настройка в BotFather

1. Создайте бота через @BotFather
2. Используйте команду `/newapp`
3. Укажите URL: `https://your-domain.com/index-mini-app.html`
4. Загрузите иконку 512x512

## 🎮 Функциональность

### Простая версия (`index-simple.html`):
- ✅ Игра в кости
- ✅ TON Connect интеграция
- ✅ Адаптивный дизайн
- ✅ Telegram Web App API

### Полная версия (`index-mini-app.html`):
- ✅ Все функции простой версии
- ✅ Многопользовательские лобби
- ✅ Создание и присоединение к играм
- ✅ Рейтинговая система
- ✅ Real-time обновления

## 🔒 Безопасность

### HTTPS обязательно для Telegram Web App:
```bash
# Получите SSL сертификат
certbot --nginx -d your-domain.com
```

### CORS настройки:
Backend уже настроен для работы с frontend через CORS.

## 📊 Мониторинг

### Проверка работы:
- Frontend: `https://your-domain.com/index-mini-app.html`
- Backend: `https://your-domain.com/api/ping`
- Bot: Отправьте `/start` боту

### Логи:
```bash
# Backend логи
cd server && npm start

# Bot логи
python main.py
```

## 🚀 Быстрый старт

1. **Загрузите файлы на сервер**
2. **Настройте веб-сервер** (Nginx/Apache)
3. **Запустите backend**: `cd server && npm start`
4. **Запустите bot**: `python main.py`
5. **Настройте в BotFather**
6. **Готово!** 🎉

## 📞 Поддержка

- **Документация**: `BUILD_GUIDE.md`
- **GitHub**: https://github.com/YulyaGirsh/onedice.git
- **Канал**: http://t.me/onedices
- **Чат**: http://t.me/myonedice

---

**Статус**: ✅ Готово к развертыванию
**Версия**: 1.0.0 (Упрощенная)

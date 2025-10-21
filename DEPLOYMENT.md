# 🚀 OneDice - Руководство по деплою

## 📋 Подготовка к продакшену

### ✅ Проверка готовности проекта

1. **API конфигурация** - ✅ Готова
   - Автоматическое определение окружения
   - Локальная разработка: относительные пути
   - Продакшен: абсолютные URL

2. **Telegram Bot** - ✅ Готов
   - URL приложения: `https://onedice.ru/`
   - Канал: `https://t.me/onedices`
   - Чат: `https://t.me/myonedice`

3. **Frontend** - ✅ Готов
   - Сборка через `npm run build`
   - Статические файлы в `dist/`
   - Иконки в `public/icons/`

4. **Backend** - ✅ Готов
   - Порт: 4000 (настраивается через PORT)
   - База данных: SQLite
   - CORS настроен для onedice.ru

## 🛠️ Файлы для деплоя

### Основные файлы:
- `production.config.js` - Конфигурация продакшена
- `nginx.conf` - Конфигурация веб-сервера
- `onedice-backend.service` - Systemd сервис для backend
- `onedice-bot.service` - Systemd сервис для бота
- `deploy.sh` - Скрипт автоматического деплоя
- `build-production.bat` - Сборка для Windows

### Структура на сервере:
```
/var/www/onedice/
├── public/                 # Frontend (собранный)
│   ├── index.html
│   ├── assets/
│   └── icons/
├── server/                 # Backend
│   ├── index.js
│   ├── database.js
│   ├── game.db
│   └── node_modules/
├── main-simple.py          # Telegram Bot
├── production.config.js
├── package.json
├── requirements.txt
└── .env
```

## 🚀 Автоматический деплой

### 1. Подготовка сервера

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем необходимые пакеты
sudo apt install -y nginx nodejs npm python3 python3-pip sqlite3

# Создаем пользователя для приложения
sudo useradd -r -s /bin/false onedice
sudo mkdir -p /var/www/onedice
sudo chown -R onedice:onedice /var/www/onedice
```

### 2. Настройка SSL

```bash
# Устанавливаем Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получаем SSL сертификат
sudo certbot --nginx -d onedice.ru -d www.onedice.ru
```

### 3. Запуск деплоя

```bash
# Делаем скрипт исполняемым
chmod +x deploy.sh

# Запускаем деплой
./deploy.sh
```

## 🔧 Ручной деплой

### 1. Сборка проекта

```bash
# Windows
build-production.bat

# Linux/Mac
npm run build
mkdir -p deploy/public deploy/server
cp -r dist/* deploy/public/
cp -r server/* deploy/server/
cp production.config.js package.json requirements.txt .env main-simple.py deploy/
```

### 2. Загрузка на сервер

```bash
# Загружаем файлы
rsync -avz --delete deploy/ root@onedice.ru:/var/www/onedice/

# Устанавливаем зависимости
ssh root@onedice.ru
cd /var/www/onedice/server
npm install --production
cd /var/www/onedice
pip3 install -r requirements.txt
```

### 3. Настройка Nginx

```bash
# Копируем конфигурацию
cp nginx.conf /etc/nginx/sites-available/onedice

# Включаем сайт
ln -s /etc/nginx/sites-available/onedice /etc/nginx/sites-enabled/

# Тестируем конфигурацию
nginx -t

# Перезагружаем nginx
systemctl reload nginx
```

### 4. Настройка сервисов

```bash
# Копируем systemd сервисы
cp onedice-backend.service /etc/systemd/system/
cp onedice-bot.service /etc/systemd/system/

# Перезагружаем systemd
systemctl daemon-reload

# Включаем сервисы
systemctl enable onedice-backend
systemctl enable onedice-bot

# Запускаем сервисы
systemctl start onedice-backend
systemctl start onedice-bot
```

## 📊 Мониторинг

### Проверка статуса сервисов

```bash
# Статус всех сервисов
systemctl status onedice-backend onedice-bot

# Логи backend
journalctl -u onedice-backend -f

# Логи бота
journalctl -u onedice-bot -f

# Логи nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Проверка работы

```bash
# Frontend
curl -I https://onedice.ru

# Backend API
curl https://onedice.ru/api/ping

# База данных
sqlite3 /var/www/onedice/server/game.db ".tables"
```

## 🔄 Обновление

### Автоматическое обновление

```bash
# Запускаем деплой заново
./deploy.sh
```

### Ручное обновление

```bash
# Останавливаем сервисы
systemctl stop onedice-backend onedice-bot

# Обновляем код
git pull origin main
npm run build

# Копируем новые файлы
cp -r dist/* /var/www/onedice/public/
cp -r server/* /var/www/onedice/server/

# Перезапускаем сервисы
systemctl start onedice-backend
systemctl start onedice-bot
```

## 🛡️ Безопасность

### Firewall

```bash
# Настраиваем UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### SSL/TLS

- ✅ SSL сертификат от Let's Encrypt
- ✅ TLS 1.2+ только
- ✅ HSTS заголовки
- ✅ Security headers

### Права доступа

```bash
# Устанавливаем правильные права
sudo chown -R www-data:www-data /var/www/onedice
sudo chmod -R 755 /var/www/onedice
sudo chmod 600 /var/www/onedice/.env
```

## 🎯 Настройка в BotFather

1. Откройте @BotFather в Telegram
2. Выберите вашего бота
3. Используйте команду `/setmenubutton`
4. Укажите URL: `https://onedice.ru/`

## 📞 Поддержка

- **GitHub**: https://github.com/YulyaGirsh/onedice.git
- **Канал**: https://t.me/onedices
- **Чат**: https://t.me/myonedice

---

**Готово!** 🎉 OneDice развернут на https://onedice.ru

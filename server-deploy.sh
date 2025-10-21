#!/bin/bash

# OneDice Server Auto-Deploy Script
# Запускается на сервере после git pull

echo "🚀 OneDice - Auto Deploy"
echo "========================"

# Переходим в директорию проекта
cd /var/www/onedice

echo "📦 Installing/updating dependencies..."

# Обновляем frontend зависимости
npm install

# Обновляем backend зависимости
cd server
npm install --production
cd ..

# Устанавливаем Python зависимости
pip3 install -r requirements.txt

# Копируем production версию бота
cp main-production.py main.py

echo "🎨 Building frontend..."

# Собираем frontend
npm run build

echo "📁 Copying files..."

# Копируем собранный frontend в public директорию
rm -rf public/*
cp -r dist/* public/

# Копируем иконки
cp -r public/icons public/icons 2>/dev/null || true

echo "🔧 Setting permissions..."

# Устанавливаем правильные права
chown -R www-data:www-data /var/www/onedice
chmod -R 755 /var/www/onedice
chmod 600 .env

echo "🔄 Restarting services..."

# Перезапускаем сервисы
systemctl restart onedice-backend
systemctl restart onedice-bot

# Перезагружаем nginx
systemctl reload nginx

echo "✅ Deploy completed successfully!"
echo "🌐 App available at: https://onedice.ru"

# Проверяем статус сервисов
echo ""
echo "📊 Service status:"
systemctl is-active onedice-backend onedice-bot nginx

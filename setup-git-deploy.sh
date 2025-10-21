#!/bin/bash

# OneDice Git Deploy Setup Script
# Настройка автоматического деплоя через Git

echo "🔧 OneDice - Git Deploy Setup"
echo "============================="

# Конфигурация
PROJECT_DIR="/var/www/onedice"
GIT_DIR="/var/www/onedice.git"

echo "📁 Setting up Git repository..."

# Создаем bare Git репозиторий
mkdir -p $GIT_DIR
cd $GIT_DIR
git init --bare

echo "🔗 Setting up post-receive hook..."

# Копируем post-receive hook
cp /var/www/onedice/post-receive hooks/post-receive
chmod +x hooks/post-receive

echo "📋 Setting up working directory..."

# Клонируем репозиторий в рабочую директорию
cd /var/www
if [ -d "onedice" ]; then
    echo "Project directory already exists, updating..."
    cd onedice
    git remote set-url origin $GIT_DIR
else
    echo "Cloning repository..."
    git clone $GIT_DIR onedice
fi

cd $PROJECT_DIR

# Добавляем remote origin если его нет
if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin $GIT_DIR
fi

echo "🔧 Setting up permissions..."

# Устанавливаем права
chown -R www-data:www-data $PROJECT_DIR
chown -R www-data:www-data $GIT_DIR
chmod +x $PROJECT_DIR/server-deploy.sh

echo "✅ Git deploy setup completed!"
echo ""
echo "📋 To deploy from your local machine:"
echo "   git remote add production root@onedice.ru:/var/www/onedice.git"
echo "   git push production main"
echo ""
echo "📋 Or manually on server:"
echo "   git pull origin main"
echo "   sudo systemctl reload nginx"

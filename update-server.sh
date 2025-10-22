#!/bin/bash

# OneDice Server Update Script
# Автоматическое обновление проекта на сервере

set -e  # Остановить выполнение при ошибке

echo "🚀 Начинаем обновление OneDice на сервере..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Проверка, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    error "Пожалуйста, запустите скрипт с правами root: sudo ./update-server.sh"
fi

# Переменные
PROJECT_DIR="/var/www/onedice"
BACKUP_DIR="/var/www/onedice_backup_$(date +%Y%m%d_%H%M%S)"
SERVICES=("onedice-backend" "onedice-bot")

log "Переходим в директорию проекта: $PROJECT_DIR"
cd "$PROJECT_DIR" || error "Не удалось перейти в директорию проекта"

log "Создаем резервную копию..."
cp -r "$PROJECT_DIR" "$BACKUP_DIR"
log "Резервная копия создана: $BACKUP_DIR"

# Создаем резервную копию базы данных
if [ -f "server/game.db" ]; then
    cp "server/game.db" "server/game_backup_$(date +%Y%m%d_%H%M%S).db"
    log "Резервная копия базы данных создана"
fi

log "Останавливаем сервисы..."
for service in "${SERVICES[@]}"; do
    if systemctl is-active --quiet "$service"; then
        systemctl stop "$service"
        log "Сервис $service остановлен"
    else
        warn "Сервис $service уже остановлен"
    fi
done

log "Обновляем код из GitHub..."
git fetch origin
git checkout main
git pull origin main
log "Код обновлен"

log "Обновляем зависимости frontend..."
npm install
log "Зависимости frontend обновлены"

log "Собираем проект..."
npm run build
if [ ! -d "dist" ]; then
    error "Папка dist не создана. Сборка не удалась."
fi
log "Проект собран успешно"

log "Обновляем зависимости backend..."
cd server
npm install
cd ..
log "Зависимости backend обновлены"

log "Обновляем зависимости Python..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    log "Зависимости Python обновлены"
fi

log "Копируем статические файлы..."
cp -r dist/* public/
chown -R www-data:www-data public/
chmod -R 755 public/
log "Статические файлы обновлены"

log "Проверяем конфигурацию NGINX..."
if nginx -t; then
    log "Конфигурация NGINX корректна"
else
    error "Ошибка в конфигурации NGINX"
fi

log "Перезагружаем NGINX..."
systemctl reload nginx
log "NGINX перезагружен"

log "Запускаем сервисы..."
for service in "${SERVICES[@]}"; do
    systemctl start "$service"
    if systemctl is-active --quiet "$service"; then
        log "Сервис $service запущен успешно"
    else
        error "Не удалось запустить сервис $service"
    fi
done

log "Проверяем работоспособность..."
sleep 5

# Проверка API
if curl -s -f "https://onedice.ru/api/ping" > /dev/null; then
    log "✅ API работает корректно"
else
    warn "⚠️ API не отвечает"
fi

# Проверка веб-сайта
if curl -s -f "https://onedice.ru" > /dev/null; then
    log "✅ Веб-сайт работает корректно"
else
    warn "⚠️ Веб-сайт не отвечает"
fi

log "🎉 Обновление завершено успешно!"
log "Резервная копия сохранена в: $BACKUP_DIR"
log "Проверьте логи сервисов:"
log "  sudo journalctl -u onedice-backend -f"
log "  sudo journalctl -u onedice-bot -f"

echo ""
echo "📊 Статус сервисов:"
systemctl status onedice-backend onedice-bot --no-pager -l

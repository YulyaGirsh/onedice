# 🚀 Инструкция по обновлению OneDice на сервере

## 📋 Обзор

Это руководство поможет вам обновить проект OneDice на сервере с NGINX после очистки и оптимизации кода.

## 🔧 Предварительные требования

- Сервер с NGINX
- Git установлен на сервере
- Node.js и npm
- Python 3.x
- Доступ к серверу по SSH

## 📁 Структура на сервере

```
/var/www/onedice/
├── public/                 # Статические файлы (dist/)
├── server/                 # Backend (Node.js)
├── main.py                 # Telegram бот
├── requirements.txt        # Python зависимости
├── .env                    # Переменные окружения
└── .git/                   # Git репозиторий
```

## 🚀 Пошаговое обновление

### 1. Подключение к серверу

```bash
ssh root@217.25.92.203
```

### 2. Переход в директорию проекта

```bash
cd /var/www/onedice
```

### 3. Остановка сервисов

```bash
# Остановить Telegram бот
sudo systemctl stop onedice-bot

# Остановить Backend
sudo systemctl stop onedice-backend

# Проверить статус
sudo systemctl status onedice-bot onedice-backend
```

### 4. Создание резервной копии

```bash
# Создать резервную копию текущей версии
sudo cp -r /var/www/onedice /var/www/onedice_backup_$(date +%Y%m%d_%H%M%S)

# Создать резервную копию базы данных
sudo cp /var/www/onedice/server/game.db /var/www/onedice/server/game_backup_$(date +%Y%m%d_%H%M%S).db
```

### 5. Обновление кода из GitHub

```bash
# Получить последние изменения
git fetch origin

# Переключиться на main ветку
git checkout main

# Обновить код
git pull origin main

# Проверить статус
git status
```

### 6. Обновление зависимостей

#### Frontend (Node.js)
```bash
# Обновить зависимости
npm install

# Собрать проект
npm run build

# Проверить, что dist/ папка создана
ls -la dist/
```

#### Backend (Node.js)
```bash
# Перейти в папку сервера
cd server

# Обновить зависимости
npm install

# Вернуться в корень
cd ..
```

#### Python (Telegram Bot)
```bash
# Активировать виртуальное окружение (если есть)
source venv/bin/activate

# Обновить зависимости
pip install -r requirements.txt

# Деактивировать виртуальное окружение
deactivate
```

### 7. Обновление статических файлов

```bash
# Скопировать собранные файлы в public директорию
sudo cp -r dist/* public/

# Установить правильные права доступа
sudo chown -R www-data:www-data public/
sudo chmod -R 755 public/
```

### 8. Обновление конфигурации NGINX (если нужно)

```bash
# Проверить текущую конфигурацию
sudo nginx -t

# Если нужно обновить конфигурацию
sudo cp nginx.conf /etc/nginx/sites-available/onedice.ru

# Перезагрузить NGINX
sudo systemctl reload nginx
```

### 9. Запуск сервисов

```bash
# Запустить Backend
sudo systemctl start onedice-backend

# Запустить Telegram бот
sudo systemctl start onedice-bot

# Проверить статус
sudo systemctl status onedice-backend onedice-bot
```

### 10. Проверка работоспособности

```bash
# Проверить, что сервисы запущены
sudo systemctl is-active onedice-backend onedice-bot

# Проверить логи
sudo journalctl -u onedice-backend -f
sudo journalctl -u onedice-bot -f

# Проверить веб-сайт
curl -I https://onedice.ru
curl -I https://onedice.ru/api/ping
```

## 🔍 Проверка обновления

### 1. Веб-интерфейс
- Откройте https://onedice.ru
- Проверьте, что сайт загружается без ошибок
- Проверьте консоль браузера на наличие ошибок

### 2. API
```bash
# Проверить API
curl https://onedice.ru/api/ping

# Ожидаемый ответ: {"status": "ok", "timestamp": "..."}
```

### 3. Telegram бот
- Найдите бота в Telegram
- Отправьте команду `/start`
- Проверьте, что бот отвечает

## 🚨 Откат в случае проблем

Если что-то пошло не так:

```bash
# Остановить сервисы
sudo systemctl stop onedice-bot onedice-backend

# Восстановить из резервной копии
sudo rm -rf /var/www/onedice
sudo mv /var/www/onedice_backup_YYYYMMDD_HHMMSS /var/www/onedice

# Восстановить базу данных
sudo cp /var/www/onedice/server/game_backup_YYYYMMDD_HHMMSS.db /var/www/onedice/server/game.db

# Запустить сервисы
sudo systemctl start onedice-backend onedice-bot
```

## 📊 Мониторинг

### Просмотр логов
```bash
# Логи Backend
sudo journalctl -u onedice-backend -f

# Логи Telegram бота
sudo journalctl -u onedice-bot -f

# Логи NGINX
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Проверка ресурсов
```bash
# Использование памяти и CPU
htop

# Использование диска
df -h

# Сетевые соединения
netstat -tulpn | grep :4000
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

## 🔧 Полезные команды

### Управление сервисами
```bash
# Статус всех сервисов
sudo systemctl status onedice-backend onedice-bot nginx

# Перезапуск сервисов
sudo systemctl restart onedice-backend onedice-bot nginx

# Остановка сервисов
sudo systemctl stop onedice-backend onedice-bot nginx

# Запуск сервисов
sudo systemctl start onedice-backend onedice-bot nginx
```

### Управление Git
```bash
# Посмотреть историю коммитов
git log --oneline -10

# Откатиться к предыдущему коммиту
git reset --hard HEAD~1

# Вернуться к последнему коммиту
git reset --hard origin/main
```

### Очистка системы
```bash
# Очистить кэш npm
npm cache clean --force

# Очистить логи
sudo journalctl --vacuum-time=7d

# Очистить временные файлы
sudo apt autoremove
sudo apt autoclean
```

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте логи сервисов
2. Убедитесь, что все порты свободны
3. Проверьте права доступа к файлам
4. Убедитесь, что все зависимости установлены

## ✅ Чек-лист обновления

- [ ] Создана резервная копия
- [ ] Код обновлен из GitHub
- [ ] Зависимости обновлены
- [ ] Проект собран (npm run build)
- [ ] Статические файлы скопированы
- [ ] Сервисы перезапущены
- [ ] Веб-сайт работает
- [ ] API отвечает
- [ ] Telegram бот работает
- [ ] Логи не содержат ошибок

---

**Время выполнения:** ~10-15 минут  
**Время простоя:** ~2-3 минуты  
**Риск:** Низкий (есть резервные копии)

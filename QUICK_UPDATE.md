# ⚡ Быстрое обновление OneDice на сервере

## 🚀 Автоматическое обновление (рекомендуется)

### 1. Подключитесь к серверу
```bash
ssh root@217.25.92.203
```

### 2. Перейдите в папку проекта
```bash
cd /var/www/onedice
```

### 3. Запустите скрипт обновления
```bash
sudo ./update-server.sh
```

**Готово!** Скрипт автоматически:
- ✅ Создаст резервную копию
- ✅ Остановит сервисы
- ✅ Обновит код из GitHub
- ✅ Обновит зависимости
- ✅ Соберет проект
- ✅ Запустит сервисы
- ✅ Проверит работоспособность

---

## 🔧 Ручное обновление

Если автоматический скрипт не работает:

### 1. Остановите сервисы
```bash
sudo systemctl stop onedice-bot onedice-backend
```

### 2. Обновите код
```bash
cd /var/www/onedice
git pull origin main
```

### 3. Соберите проект
```bash
npm install
npm run build
```

### 4. Обновите файлы
```bash
cp -r dist/* public/
sudo chown -R www-data:www-data public/
```

### 5. Запустите сервисы
```bash
sudo systemctl start onedice-backend onedice-bot
```

---

## 🔍 Проверка

После обновления проверьте:

- **Веб-сайт**: https://onedice.ru
- **API**: https://onedice.ru/api/ping
- **Telegram бот**: `/start` в боте

## 📞 Если что-то пошло не так

```bash
# Посмотреть логи
sudo journalctl -u onedice-backend -f
sudo journalctl -u onedice-bot -f

# Перезапустить сервисы
sudo systemctl restart onedice-backend onedice-bot

# Проверить статус
sudo systemctl status onedice-backend onedice-bot
```

---

**Время обновления:** ~5 минут  
**Время простоя:** ~1 минута

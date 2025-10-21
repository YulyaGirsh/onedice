# 🚀 OneDice - Быстрый деплой

## 📋 Настройка один раз на сервере

### 1. Первоначальная настройка

```bash
# На сервере onedice.ru
cd /var/www
git clone https://github.com/YulyaGirsh/onedice.git
cd onedice

# Настраиваем Git deploy
chmod +x setup-git-deploy.sh
./setup-git-deploy.sh

# Устанавливаем зависимости
npm install
cd server && npm install --production && cd ..
pip3 install -r requirements.txt

# Настраиваем nginx
cp nginx.conf /etc/nginx/sites-available/onedice
ln -s /etc/nginx/sites-available/onedice /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Настраиваем systemd сервисы
cp onedice-backend.service /etc/systemd/system/
cp onedice-bot.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable onedice-backend onedice-bot
systemctl start onedice-backend onedice-bot
```

## 🔄 Ежедневный деплой (2 команды!)

### Вариант 1: Через Git push (рекомендуется)

```bash
# На вашем локальном компьютере
git add .
git commit -m "Your changes"
git push origin main

# На сервере (автоматически через Git hook)
# Ничего делать не нужно - все обновится автоматически!
```

### Вариант 2: Ручной деплой

```bash
# На сервере onedice.ru
cd /var/www/onedice
git pull origin main
sudo systemctl reload nginx
```

## 🎯 Что происходит автоматически

1. **Git pull** - получает последние изменения
2. **npm install** - обновляет зависимости (если нужно)
3. **npm run build** - собирает frontend
4. **Копирование файлов** - обновляет public директорию
5. **Перезапуск сервисов** - backend и bot
6. **Reload nginx** - применяет изменения

## 📊 Проверка работы

```bash
# Статус сервисов
systemctl status onedice-backend onedice-bot

# Логи
journalctl -u onedice-backend -f
journalctl -u onedice-bot -f

# Проверка сайта
curl -I https://onedice.ru
curl https://onedice.ru/api/ping
```

## 🔧 Настройка Git remote (один раз)

```bash
# На вашем локальном компьютере
git remote add production root@onedice.ru:/var/www/onedice.git

# Теперь можно деплоить одной командой:
git push production main
```

## ⚡ Преимущества этого подхода

- ✅ **Быстро** - 2 команды для деплоя
- ✅ **Автоматично** - сборка происходит на сервере
- ✅ **Безопасно** - код всегда актуальный
- ✅ **Просто** - не нужно помнить сложные команды
- ✅ **Надежно** - автоматическая проверка зависимостей

## 🎉 Готово!

Теперь для деплоя достаточно:
1. `git pull origin main` (на сервере)
2. `sudo systemctl reload nginx` (на сервере)

Или еще проще - просто `git push production main` с локального компьютера!

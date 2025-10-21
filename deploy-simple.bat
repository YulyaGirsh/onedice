@echo off
echo 🚀 OneDice - Простое развертывание
echo ==================================

echo.
echo 📁 Создание структуры для развертывания...

mkdir deploy 2>nul
mkdir deploy\public 2>nul
mkdir deploy\server 2>nul

echo.
echo 📋 Копирование файлов...

copy index-simple.html deploy\ 2>nul
copy index-mini-app.html deploy\ 2>nul
copy main.py deploy\ 2>nul
copy requirements.txt deploy\ 2>nul
copy .env deploy\ 2>nul

xcopy public deploy\public\ /E /I /Q 2>nul
xcopy server deploy\server\ /E /I /Q 2>nul

echo.
echo ✅ Файлы готовы для развертывания!
echo.
echo 📁 Структура:
echo    deploy\
echo    ├── index-simple.html      (Простая версия)
echo    ├── index-mini-app.html    (Полная версия)
echo    ├── main.py                (Telegram бот)
echo    ├── requirements.txt       (Python зависимости)
echo    ├── .env                   (Переменные окружения)
echo    ├── public\                (Статические файлы)
echo    └── server\                (Backend)
echo.
echo 🌐 Для развертывания:
echo    1. Загрузите папку deploy на сервер
echo    2. Настройте веб-сервер (Nginx/Apache)
echo    3. Запустите backend: cd server && npm start
echo    4. Запустите bot: python main.py
echo    5. Настройте в BotFather
echo.
echo 📖 Подробная инструкция: DEPLOY_SIMPLE.md
echo.
pause

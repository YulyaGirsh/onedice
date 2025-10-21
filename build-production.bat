@echo off
echo 🚀 OneDice - Сборка для продакшена
echo ==================================

echo.
echo 📦 Устанавливаем зависимости...

echo Устанавливаем frontend зависимости...
call npm install

echo Устанавливаем backend зависимости...
cd server
call npm install
cd ..

echo.
echo 🎨 Собираем frontend...
call npm run build

echo.
echo 📁 Создаем структуру для деплоя...
if not exist "deploy" mkdir deploy
if not exist "deploy\public" mkdir deploy\public
if not exist "deploy\server" mkdir deploy\server

echo.
echo 📋 Копируем файлы...

echo Копируем собранный frontend...
xcopy dist\* deploy\public\ /E /I /Q

echo Копируем backend...
xcopy server\* deploy\server\ /E /I /Q

echo Копируем иконки...
xcopy public\icons deploy\public\icons\ /E /I /Q

echo Копируем конфигурацию...
copy production.config.js deploy\
copy package.json deploy\
copy requirements.txt deploy\
copy .env deploy\

echo.
echo ✅ Сборка завершена!
echo.
echo 📁 Структура для деплоя:
echo    deploy\
echo    ├── public\          (Frontend)
echo    ├── server\          (Backend)
echo    ├── production.config.js
echo    ├── package.json
echo    ├── requirements.txt
echo    └── .env
echo.
echo 🌐 Для деплоя загрузите папку deploy на сервер
echo    и настройте веб-сервер для обслуживания public/
echo    и проксирования API запросов на server/
echo.
pause

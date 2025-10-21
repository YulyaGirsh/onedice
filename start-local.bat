@echo off
echo 🚀 OneDice - Запуск локальных сервисов
echo =====================================

echo.
echo 📦 Запускаем Backend...
start "OneDice Backend" cmd /k "npm run server"

echo.
echo ⏳ Ждем запуска Backend (5 секунд)...
timeout /t 5 /nobreak >nul

echo.
echo 🎨 Запускаем Frontend...
start "OneDice Frontend" cmd /k "npm start"

echo.
echo ⏳ Ждем запуска Frontend (3 секунды)...
timeout /t 3 /nobreak >nul

echo.
echo 🤖 Запускаем Telegram Bot...
start "OneDice Bot" cmd /k "npm run bot"

echo.
echo ✅ Все сервисы запущены!
echo.
echo 🔗 Ссылки:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:4000
echo    Тест:     test-local.html
echo.
echo 📊 Для проверки статуса: check-status.bat
echo.
pause

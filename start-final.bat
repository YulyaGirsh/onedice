@echo off
echo 🚀 OneDice - Финальный запуск
echo =============================

echo.
echo 🛑 Останавливаем все процессы...

taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
taskkill /f /im cmd.exe 2>nul

echo.
echo ⏳ Ждем освобождения ресурсов (5 секунд)...
timeout /t 5 /nobreak >nul

echo.
echo 📦 Запускаем Backend (порт 4000)...
start "OneDice Backend" cmd /k "cd server && npm start"

echo.
echo ⏳ Ждем запуска Backend (7 секунд)...
timeout /t 7 /nobreak >nul

echo.
echo 🎨 Запускаем Frontend (порт 3000)...
start "OneDice Frontend" cmd /k "npm start"

echo.
echo ⏳ Ждем запуска Frontend (5 секунд)...
timeout /t 5 /nobreak >nul

echo.
echo 🤖 Запускаем Telegram Bot (единственный экземпляр)...
start "OneDice Bot" cmd /k "python main-simple.py"

echo.
echo ✅ Все сервисы запущены в единственном экземпляре!
echo.
echo 🔗 Ссылки:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:4000
echo    Тест:     test-local.html
echo.
echo 📊 Проверка статуса: check-status.bat
echo 🛑 Остановка всех: stop-all.bat
echo.
pause

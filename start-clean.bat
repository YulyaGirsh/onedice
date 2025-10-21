@echo off
echo 🚀 OneDice - Чистый запуск сервисов
echo ==================================

echo.
echo 🛑 Останавливаем все процессы...

echo Останавливаем Node.js процессы...
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js процессы остановлены
) else (
    echo ℹ️ Node.js процессы не найдены
)

echo Останавливаем Python процессы...
taskkill /f /im python.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Python процессы остановлены
) else (
    echo ℹ️ Python процессы не найдены
)

echo.
echo ⏳ Ждем освобождения портов (3 секунды)...
timeout /t 3 /nobreak >nul

echo.
echo 🔍 Проверяем порты...
netstat -an | findstr ":3000 :3001 :4000" >nul
if %errorlevel% equ 0 (
    echo ⚠️ Некоторые порты все еще заняты
    echo Продолжаем запуск...
) else (
    echo ✅ Все порты свободны
)

echo.
echo 📦 Запускаем Backend...
start "OneDice Backend" cmd /k "cd server && npm start"

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
start "OneDice Bot" cmd /k "python main-simple.py"

echo.
echo ✅ Все сервисы запущены!
echo.
echo 🔗 Ссылки:
echo    Frontend: http://localhost:3000 (или 3001)
echo    Backend:  http://localhost:4000
echo    Тест:     test-local.html
echo.
echo 📊 Для проверки статуса: check-status.bat
echo.
pause

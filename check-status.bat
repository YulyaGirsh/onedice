@echo off
echo 🚀 OneDice - Проверка статуса сервисов
echo =====================================

echo.
echo 📊 Проверяем порты...

echo.
echo Frontend (порт 3000):
netstat -an | findstr ":3000" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo ✅ Frontend работает
) else (
    echo ❌ Frontend не запущен
)

echo.
echo Backend (порт 4000):
netstat -an | findstr ":4000" | findstr "LISTENING"
if %errorlevel% equ 0 (
    echo ✅ Backend работает
) else (
    echo ❌ Backend не запущен
)

echo.
echo 🔗 Ссылки для тестирования:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:4000/ping
echo    Тест:     test-local.html
echo.

echo 🎮 Для запуска всех сервисов используйте:
echo    start-all.bat
echo.

pause

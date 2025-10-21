@echo off
echo 🛑 OneDice - Остановка всех сервисов
echo ===================================

echo.
echo Останавливаем Node.js процессы...
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js процессы остановлены
) else (
    echo ℹ️ Node.js процессы не найдены
)

echo.
echo Останавливаем Python процессы...
taskkill /f /im python.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Python процессы остановлены
) else (
    echo ℹ️ Python процессы не найдены
)

echo.
echo Останавливаем CMD окна...
taskkill /f /im cmd.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ CMD окна закрыты
) else (
    echo ℹ️ CMD окна не найдены
)

echo.
echo ✅ Все сервисы остановлены!
echo.
echo Для запуска используйте: start-final.bat
echo.
pause

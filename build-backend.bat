@echo off
echo 🏗️ Building Backend (Node.js + Express)
echo =======================================

echo.
echo 📦 Installing dependencies...
cd /d "%~dp0\server"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend dependencies installation failed
    pause
    exit /b 1
)

echo.
echo ✅ Backend build completed!
echo 📁 Ready to run: npm start
echo.
pause

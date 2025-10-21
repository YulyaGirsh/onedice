@echo off
echo 🚀 OneDice - Starting All Services
echo ==================================

echo.
echo 📦 Building Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

echo.
echo ✅ All services ready!
echo.
echo 🎮 OneDice Mini App is ready to run:
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:4000  
echo 🤖 Bot: Running...
echo.
echo Press Ctrl+C to stop all services
echo.

start "OneDice Backend" cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul
start "OneDice Bot" cmd /k "python main.py"

echo.
echo 🎉 All services started!
echo.
pause

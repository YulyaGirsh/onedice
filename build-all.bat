@echo off
echo 🚀 OneDice - Building All Components
echo =====================================

echo.
echo 📦 Installing Frontend Dependencies...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependencies installation failed
    pause
    exit /b 1
)

echo.
echo 🏗️ Building Frontend (React + TypeScript)...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

echo.
echo 📦 Installing Backend Dependencies...
cd /d "%~dp0\server"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend dependencies installation failed
    pause
    exit /b 1
)

echo.
echo 🐍 Installing Python Dependencies...
cd /d "%~dp0"
call .\venv\Scripts\activate
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Python dependencies installation failed
    pause
    exit /b 1
)

echo.
echo ✅ All components built successfully!
echo.
echo 📁 Build output:
echo    - Frontend: dist/
echo    - Backend: server/
echo    - Bot: main.py
echo.
echo 🚀 Ready to run:
echo    - Frontend: npm run dev
echo    - Backend: cd server && npm start
echo    - Bot: python main.py
echo.
pause

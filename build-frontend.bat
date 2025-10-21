@echo off
echo 🏗️ Building Frontend (React + TypeScript)
echo =========================================

echo.
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Dependencies installation failed
    pause
    exit /b 1
)

echo.
echo 🔨 Building TypeScript...
call npx tsc
if %errorlevel% neq 0 (
    echo ❌ TypeScript compilation failed
    pause
    exit /b 1
)

echo.
echo 🎨 Building Vite bundle...
call npx vite build
if %errorlevel% neq 0 (
    echo ❌ Vite build failed
    pause
    exit /b 1
)

echo.
echo ✅ Frontend build completed!
echo 📁 Output: dist/
echo.
pause

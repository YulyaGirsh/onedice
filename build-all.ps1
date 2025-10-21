# OneDice - Build All Components Script
Write-Host "🚀 OneDice - Building All Components" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Function to check if command succeeded
function Test-Command {
    param($Command, $Description)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ $Description failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ $Description completed" -ForegroundColor Green
}

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "`n📦 Installing Frontend Dependencies..." -ForegroundColor Yellow
npm install
Test-Command $LASTEXITCODE "Frontend dependencies installation"

Write-Host "`n🏗️ Building Frontend (React + TypeScript)..." -ForegroundColor Yellow
npm run build
Test-Command $LASTEXITCODE "Frontend build"

Write-Host "`n📦 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location "$scriptDir\server"
npm install
Test-Command $LASTEXITCODE "Backend dependencies installation"

Write-Host "`n🐍 Installing Python Dependencies..." -ForegroundColor Yellow
Set-Location $scriptDir
& ".\venv\Scripts\Activate.ps1"
pip install -r requirements.txt
Test-Command $LASTEXITCODE "Python dependencies installation"

Write-Host "`n✅ All components built successfully!" -ForegroundColor Green
Write-Host "`n📁 Build output:" -ForegroundColor Cyan
Write-Host "   - Frontend: dist/" -ForegroundColor White
Write-Host "   - Backend: server/" -ForegroundColor White
Write-Host "   - Bot: main.py" -ForegroundColor White

Write-Host "`n🚀 Ready to run:" -ForegroundColor Cyan
Write-Host "   - Frontend: npm run dev" -ForegroundColor White
Write-Host "   - Backend: cd server && npm start" -ForegroundColor White
Write-Host "   - Bot: python main.py" -ForegroundColor White

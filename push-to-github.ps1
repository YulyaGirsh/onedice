# OneDice Auto-Push Script
Write-Host "🚀 OneDice Auto-Push to GitHub" -ForegroundColor Green

# Add all changes
Write-Host "📁 Adding all changes..." -ForegroundColor Yellow
git add .

# Get current timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Commit with timestamp
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Auto-commit: $timestamp"

# Push to GitHub
Write-Host "⬆️ Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "✅ Done! Changes pushed to GitHub successfully!" -ForegroundColor Green
Write-Host "🔗 Repository: https://github.com/YulyaGirsh/onedice.git" -ForegroundColor Cyan

# Deployment Script for Aziona LearnFlow
# Run this script to prepare the app for deployment

Write-Host "🚀 Preparing Aziona LearnFlow for deployment..." -ForegroundColor Green

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found. Please copy .env.example to .env and configure your API keys." -ForegroundColor Red
    exit 1
}

# Create assets directory if it doesn't exist
if (!(Test-Path "assets")) {
    New-Item -ItemType Directory -Path "assets"
    New-Item -ItemType Directory -Path "assets/images"
    New-Item -ItemType Directory -Path "assets/fonts"
    New-Item -ItemType Directory -Path "assets/icons"
    Write-Host "📁 Created assets directories" -ForegroundColor Green
}

# Check required dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

# List of required external resources
$dependencies = @(
    "Bootstrap 5.3 CSS",
    "Bootstrap 5.3 JS",
    "Font Awesome 6",
    "GSAP (GreenSock)",
    "YouTube Data API v3",
    "Groq API"
)

foreach ($dep in $dependencies) {
    Write-Host "  - $dep" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🔧 Configuration checklist:" -ForegroundColor Yellow
Write-Host "  1. Update API keys in js/config.js" -ForegroundColor White
Write-Host "  2. Test API connectivity" -ForegroundColor White
Write-Host "  3. Verify CORS settings" -ForegroundColor White
Write-Host "  4. Check rate limits" -ForegroundColor White
Write-Host "  5. Test on target devices" -ForegroundColor White

Write-Host ""
Write-Host "🌐 Deployment options:" -ForegroundColor Yellow
Write-Host "  • Static hosting (GitHub Pages, Netlify, Vercel)" -ForegroundColor White
Write-Host "  • CDN deployment" -ForegroundColor White
Write-Host "  • Self-hosted with web server" -ForegroundColor White

Write-Host ""
Write-Host "⚠️  Security reminders:" -ForegroundColor Red
Write-Host "  • Never expose API keys in client-side code" -ForegroundColor White
Write-Host "  • Use environment variables or backend proxy" -ForegroundColor White
Write-Host "  • Implement proper CORS policies" -ForegroundColor White
Write-Host "  • Monitor API usage and quotas" -ForegroundColor White

Write-Host ""
Write-Host "✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host "📖 See README.md for detailed setup instructions." -ForegroundColor Cyan

# Optional: Start local server for testing
$startServer = Read-Host "Would you like to start a local server for testing? (y/n)"
if ($startServer -eq "y" -or $startServer -eq "Y") {
    Write-Host "🖥️  Starting local server..." -ForegroundColor Green
    
    # Try Python first, then Node.js
    try {
        python -m http.server 8000
    } catch {
        try {
            npx http-server -p 8000
        } catch {
            Write-Host "❌ Could not start server. Please install Python or Node.js." -ForegroundColor Red
            Write-Host "   Or use VS Code Live Server extension." -ForegroundColor Yellow
        }
    }
}

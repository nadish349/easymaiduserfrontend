# Vercel Deployment Script
# This script handles the path with special characters

Write-Host "Deploying to Vercel..." -ForegroundColor Green
Write-Host ""

# Get the script's directory (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Current directory: $PWD" -ForegroundColor Cyan
Write-Host ""

# Verify we're in the right place
if (-not (Test-Path "vercel.json")) {
    Write-Host "ERROR: vercel.json not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root directory." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Project files found. Starting deployment..." -ForegroundColor Green
Write-Host ""

# Deploy to Vercel
vercel --prod

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy your Vercel URL from above" -ForegroundColor Cyan
Write-Host "2. Add it to Firebase Authorized domains" -ForegroundColor Cyan
Write-Host "3. Update API key restrictions if needed" -ForegroundColor Cyan
Write-Host "4. Test OTP on your Vercel URL!" -ForegroundColor Cyan
Write-Host ""









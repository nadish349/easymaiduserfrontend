# Vercel Direct Deployment Script
# Run this from your project directory

Write-Host "Deploying to Vercel..." -ForegroundColor Green

# Deploy to Vercel
vercel --prod

Write-Host "`nDeployment complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Copy your Vercel URL (shown above)" -ForegroundColor Cyan
Write-Host "2. Add it to Firebase Authorized domains" -ForegroundColor Cyan
Write-Host "3. Update API key restrictions if needed" -ForegroundColor Cyan
Write-Host "4. Test OTP on your Vercel URL!" -ForegroundColor Cyan









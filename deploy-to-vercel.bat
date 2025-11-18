@echo off
echo Deploying to Vercel...
echo.

REM Change to the script's directory (project root)
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Check if vercel.json exists
if not exist "vercel.json" (
    echo ERROR: vercel.json not found!
    echo Make sure you're running this from the project root directory.
    pause
    exit /b 1
)

REM Deploy to Vercel
echo Starting Vercel deployment...
vercel --prod

echo.
echo Deployment complete!
echo.
echo Next steps:
echo 1. Copy your Vercel URL from above
echo 2. Add it to Firebase Authorized domains
echo 3. Update API key restrictions if needed
echo 4. Test OTP on your Vercel URL!
echo.
pause









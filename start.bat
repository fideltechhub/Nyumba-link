@echo off
echo Starting NyumbaLink...
echo.

start "NyumbaLink Server" cmd /k "cd /d %~dp0server && node index.js"
timeout /t 2 >nul
start "NyumbaLink Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Server:  http://localhost:5000
echo Client:  http://localhost:3000
echo.
echo Admin login: nyumbalink@gmail.com / admin123

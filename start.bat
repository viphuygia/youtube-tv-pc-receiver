@echo off
chcp 65001 >nul
title YouTube TV Receiver for Windows
cls

echo ========================================================
echo   YOUTUBE TV RECEIVER CHO WINDOWS
echo   Trai Nghiem Smart TV va Cast iPhone Khong Can Chuot
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] May tinh chua cai dat Node.js!
    echo Vui long tai Node.js tu https://nodejs.org roi thu lai.
    pause
    exit /b
)

if not exist node_modules (
    echo [1/3] Dang cai dat thu vien lan dau...
    call npm install --legacy-peer-deps
)

echo [1/3] Dang khoi dong may chu TV Receiver...
start /b cmd /c "npx tsx server.ts"

echo [2/3] Dang cho may chu khoi dong tren cong 8547...
:WAIT_SERVER
curl -s -f http://localhost:8547/api/status >nul 2>&1
if %errorlevel% neq 0 (
    ping 127.0.0.1 -n 2 >nul
    goto WAIT_SERVER
)
echo [OK] May chu da san sang!

echo [3/3] Dang mo TV o che do Toan man hinh va Tu dong phat...

set "CHROME_PATH="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe"

set "EDGE_PATH="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "EDGE_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "EDGE_PATH=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

set "POS_FLAGS="
for /f "delims=" %%i in ('curl -s http://localhost:8547/api/display-flags') do set "POS_FLAGS=%%i"

set FLAGS=--user-data-dir="%TEMP%\YouTubeTV_Profile" %POS_FLAGS% --autoplay-policy=no-user-gesture-required --no-first-run --start-fullscreen --kiosk "http://localhost:8547?tv=1"

if defined CHROME_PATH (
    start "" "%CHROME_PATH%" %FLAGS%
    goto SUCCESS
)

if defined EDGE_PATH (
    start "" "%EDGE_PATH%" %FLAGS%
    goto SUCCESS
)

start chrome.exe %FLAGS% || start msedge.exe %FLAGS%

:SUCCESS
echo.
echo ========================================================
echo   TV DA SAN SANG HOAT DONG!
echo   * Ten hien thi tren iPhone: "PC Windows (YouTube TV)"
echo   * Che do tu dong phat (Autoplay): DA BAT
echo   * Che do toan man hinh (Kiosk): DA BAT
echo   * Dong cua so nay khi ban muon tat TV.
echo ========================================================
echo.
pause

@echo off
chcp 65001 >nul

:: 1. Uu tien chay Native GUI Launcher (YouTubeTV.exe) de an hoan toan cua so Terminal CMD
if exist "%~dp0YouTubeTV.exe" (
    start "" "%~dp0YouTubeTV.exe"
    exit
)
if exist "%~dp0resources\YouTubeTV.exe" (
    start "" "%~dp0resources\YouTubeTV.exe"
    exit
)

:: 2. Neu chua bien dich YouTubeTV.exe, tu dong khoi chay lai script o che do an (WindowStyle Hidden)
if /i not "%~1"=="--hidden" (
    powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath '%~f0' -ArgumentList '--hidden' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
    exit
)

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    exit /b 1
)

if not exist node_modules (
    call npm install --legacy-peer-deps >nul 2>&1
)

curl -s -f http://localhost:8547/api/status >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npx tsx server.ts' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
)

set /a WAIT_COUNT=0
:WAIT_SERVER
curl -s -f http://localhost:8547/api/status >nul 2>&1
if %errorlevel% neq 0 (
    set /a WAIT_COUNT+=1
    if %WAIT_COUNT% gtr 30 exit /b 1
    ping 127.0.0.1 -n 2 >nul
    goto WAIT_SERVER
)

set "KIOSK_RUNNING="
for /f "delims=" %%i in ('curl -s http://localhost:8547/api/is-kiosk-running') do set "KIOSK_RUNNING=%%i"
echo %KIOSK_RUNNING% | findstr /i "true" >nul 2>&1
if %errorlevel% equ 0 (
    curl -s -X POST http://localhost:8547/api/standby -H "Content-Type: application/json" -d "{\"standby\":false}" >nul 2>&1
    if exist bin\TvWindowManager.exe bin\TvWindowManager.exe restore >nul 2>&1
    exit /b 0
)

set "CHROME_PATH="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe"

set "EDGE_PATH="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "EDGE_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "EDGE_PATH=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

set "POS_FLAGS="
for /f "delims=" %%i in ('curl -s http://localhost:8547/api/display-flags') do set "POS_FLAGS=%%i"

set FLAGS=--user-data-dir="%TEMP%\YouTubeTV_Profile" --profile-directory=Default --no-first-run --no-default-browser-check --disable-features=ProfilePicker --disable-session-crashed-bubble %POS_FLAGS% --autoplay-policy=no-user-gesture-required --start-fullscreen --app="http://localhost:8547?tv=1"

if defined CHROME_PATH (
    start "" "%CHROME_PATH%" %FLAGS%
    exit /b 0
)

if defined EDGE_PATH (
    start "" "%EDGE_PATH%" %FLAGS%
    exit /b 0
)

start chrome.exe %FLAGS% || start msedge.exe %FLAGS%
exit /b 0

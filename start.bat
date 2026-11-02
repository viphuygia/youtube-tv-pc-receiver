@echo off
chcp 65001 >nul

:: 1. Neu chua chay o che do an, tu dong khoi chay lai script o che do an (WindowStyle Hidden) de khong hien Terminal
if /i not "%~1"=="--hidden" (
    powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath '%~f0' -ArgumentList '--hidden' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
    exit
)

cd /d "%~dp0"

:: ==============================================================================
:: [BUOC 0] KIEM TRA VA KILL TOAN BO CAC SESSION CU LIEN QUAN DEN APP (FULL RESTART)
:: ==============================================================================
curl -s -m 1 -X POST http://127.0.0.1:8547/api/quit >nul 2>&1
if exist "%~dp0bin\TvWindowManager.exe" "%~dp0bin\TvWindowManager.exe" close >nul 2>&1

powershell -NoProfile -WindowStyle Hidden -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*YouTubeTV_Profile*' -or ($_.Name -eq 'node.exe' -and ($_.CommandLine -like '*server.ts*' -or $_.CommandLine -like '*server.mjs*')) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8547 ^| findstr LISTENING') do (
    if not "%%a"=="" if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)

:: Xoa cache HTTP cu cua profile Kiosk de tranh loi trang man hinh (blank white screen)
if exist "%TEMP%\YouTubeTV_Profile\Default\Cache" rd /s /q "%TEMP%\YouTubeTV_Profile\Default\Cache" >nul 2>&1
if exist "%TEMP%\YouTubeTV_Profile\Default\Code Cache" rd /s /q "%TEMP%\YouTubeTV_Profile\Default\Code Cache" >nul 2>&1
if exist "%TEMP%\YouTubeTV_Profile\Default\GPUCache" rd /s /q "%TEMP%\YouTubeTV_Profile\Default\GPUCache" >nul 2>&1

:: ==============================================================================
:: [BUOC 1] UU TIEN KHOI CHAY QUA NATIVE GUI LAUNCHER (YouTubeTV.exe) SAU KHI DA CLEAN
:: ==============================================================================
if exist "%~dp0YouTubeTV.exe" (
    start "" "%~dp0YouTubeTV.exe" --skip-kill
    exit /b 0
)
if exist "%~dp0resources\YouTubeTV.exe" (
    start "" "%~dp0resources\YouTubeTV.exe" --skip-kill
    exit /b 0
)

:: ==============================================================================
:: [BUOC 2] FALLBACK KHI CHUA CO YouTubeTV.exe: KHOI DONG SERVER & TRINH DUYET KIOSK MOI
:: ==============================================================================
where node >nul 2>nul
if %errorlevel% neq 0 (
    exit /b 1
)

if not exist node_modules (
    call npm install --legacy-peer-deps >nul 2>&1
)

powershell -NoProfile -WindowStyle Hidden -Command "$env:NODE_ENV='production'; Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npx tsx server.ts' -WorkingDirectory '%~dp0' -WindowStyle Hidden"

set /a WAIT_COUNT=0
:WAIT_SERVER
curl -s -f http://127.0.0.1:8547/api/status >nul 2>&1
if %errorlevel% neq 0 (
    set /a WAIT_COUNT+=1
    if %WAIT_COUNT% gtr 30 exit /b 1
    ping 127.0.0.1 -n 2 >nul
    goto WAIT_SERVER
)

set "CHROME_PATH="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe"

set "EDGE_PATH="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "EDGE_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "EDGE_PATH=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

set "POS_FLAGS="
for /f "delims=" %%i in ('curl -s http://127.0.0.1:8547/api/display-flags') do set "POS_FLAGS=%%i"

set FLAGS=--user-data-dir="%TEMP%\YouTubeTV_Profile" --profile-directory=Default --no-first-run --no-default-browser-check --disable-features=ProfilePicker --disable-session-crashed-bubble --disk-cache-size=1 --media-cache-size=1 %POS_FLAGS% --autoplay-policy=no-user-gesture-required --start-fullscreen --app="http://localhost:8547?tv=1"

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

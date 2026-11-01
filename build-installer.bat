@echo off
chcp 65001 >nul
title Build YouTube TV Receiver Installer
cls

echo ========================================================
echo   DONG GOI BO CAI DAT: YouTube TV Receiver
echo ========================================================
echo.

set "ISCC_PATH=C:\Users\admin\AppData\Local\Programs\Inno Setup 6\ISCC.exe"
if not exist "%ISCC_PATH%" (
    if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "ISCC_PATH=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
    if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "ISCC_PATH=%ProgramFiles%\Inno Setup 6\ISCC.exe"
)

if not exist "%ISCC_PATH%" (
    echo [LOI] Khong tim thay Inno Setup 6 ISCC.exe
    pause
    exit /b 1
)

echo [1/5] Dang build frontend Vite...
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Build frontend that bai
    pause
    exit /b 1
)

echo [2/5] Dang bundle backend server.ts...
call npx esbuild server.ts --bundle --platform=node --format=esm --packages=external --outfile="build-staging\server.mjs"

echo [3/5] Dang bien dich C# Native Launcher YouTubeTV.exe va TvWindowManager.exe...
call C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /target:exe /r:System.Management.dll /r:"C:\Windows\Microsoft.NET\assembly\GAC_MSIL\UIAutomationClient\v4.0_4.0.0.0__31bf3856ad364e35\UIAutomationClient.dll" /r:"C:\Windows\Microsoft.NET\assembly\GAC_MSIL\UIAutomationTypes\v4.0_4.0.0.0__31bf3856ad364e35\UIAutomationTypes.dll" /out:bin\TvWindowManager.exe bin\TvWindowManager.cs
call C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /target:winexe /win32icon:resources\app.ico /out:resources\YouTubeTV.exe resources\Launcher.cs

echo [4/5] Dang chuan bi thu muc build-staging...
if not exist build-staging mkdir build-staging
if not exist build-staging\bin mkdir build-staging\bin
if not exist build-staging\public mkdir build-staging\public
if not exist build-staging\resources mkdir build-staging\resources

xcopy /E /I /Y dist build-staging\dist >nul
copy /Y public\remote.html build-staging\public\remote.html >nul
copy /Y resources\YouTubeTV.exe build-staging\YouTubeTV.exe >nul
copy /Y resources\app.ico build-staging\resources\app.ico >nul
copy /Y bin\TvWindowManager.exe build-staging\bin\TvWindowManager.exe >nul
copy /Y bin\TvWindowManager.cs build-staging\bin\TvWindowManager.cs >nul
copy /Y stop.bat build-staging\stop.bat >nul
copy /Y tat-tv.bat build-staging\tat-tv.bat >nul

where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where node') do copy /Y "%%i" build-staging\node.exe >nul
)

echo [5/5] Dang bien dich bo cai dat bang Inno Setup...
"%ISCC_PATH%" installer.iss

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   DONG GOI THANH CONG
    echo   File cai dat nam tai:
    echo   dist-installer\YouTube-TV-Receiver-Setup-v1.2.0.exe
    echo ========================================================
) else (
    echo [LOI] Bien dich bo cai dat that bai
)

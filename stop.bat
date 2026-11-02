@echo off
chcp 65001 >nul
title Tat YouTube TV Receiver
cls

echo ========================================================
echo   TAT YOUTUBE TV RECEIVER ^& DICH VU CHAY NGAM
echo ========================================================
echo.

echo [1/3] Dang gui tin hieu tat den may chu...
curl -s -m 2 -X POST http://localhost:8547/api/quit >nul 2>&1

echo [2/3] Dang dong cac tien trinh trinh duyet TV...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*YouTubeTV_Profile*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1

echo [3/3] Dang giai phong cong mang 8547 va ket thuc may chu...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8547 ^| findstr LISTENING') do (
    if not "%%a"=="" if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ========================================================
echo   [OK] DA TAT TOAN BO TV VA GIAI PHONG MOI DICH VU!
echo   Khong con bat ky service hay Chrome TV nao chay ngam.
echo ========================================================
echo.
ping 127.0.0.1 -n 3 >nul
exit /b

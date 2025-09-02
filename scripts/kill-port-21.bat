@echo off
echo =======================================
echo  Kill process yang listen di port 21 + Restart Ethernet
echo =======================================

:: Cari proses yang LISTEN di port 21
for /f "tokens=5" %%a in ('netstat -ano ^| find "LISTENING" ^| find ":21"') do (
    echo Menutup PID %%a yang listen di port 21 ...
    taskkill /PID %%a /F >nul 2>&1
)

:: Restart adaptor Ethernet
echo.
echo Restarting Ethernet adapter...
netsh interface set interface "Ethernet" admin=disable
timeout /t 3 >nul
netsh interface set interface "Ethernet" admin=enable

echo.
echo Selesai. Port 21 sudah dibersihkan dan Ethernet sudah di-restart.
pause

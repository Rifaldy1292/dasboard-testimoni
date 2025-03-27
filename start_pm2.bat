@echo off
cd /d D:\projects\dashboard-machine


:: Tambahkan path PM2 secara eksplisit jika perlu
set PATH=%APPDATA%\npm;%PATH%

:: Pastikan PM2 berjalan
pm2 resurrect

@echo off
chcp 65001 >nul
REM ===== تصدير بيانات قاعدة البيانات المحلية =====
set BIN=C:\Users\basse\MariaDB\mariadb-12.3.2-winx64\bin
set OUT=%CD%\db-export.sql

echo [1] تصدير البيانات...
"%BIN%\mysqldump.exe" -h 127.0.0.1 -u inspection -pinspection123 --no-tablespaces --single-transaction --databases inspection > "%OUT%"

if %errorlevel%==0 (
  echo [OK] تم التصدير إلى: %OUT%
  echo الحجم:
  for %%A in ("%OUT%") do echo %%~zA bytes
) else (
  echo [ERR] فشل التصدير — تأكد أن قاعدة البيانات شغالة على المنفذ 3306
)
pause

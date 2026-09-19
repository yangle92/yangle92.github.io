@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo   Publish  -  Yangle Homepage + English App
echo   Target   :  https://yangle92.github.io/
echo ============================================================
echo.

where python >nul 2>&1
if errorlevel 1 goto nopython

echo [1/2] Running sync script ...
echo.
python sync-to-github.py
if errorlevel 1 goto failed

echo.
echo [2/2] Done. GitHub Pages updates in about 1-2 minutes:
echo.
echo     Homepage      https://yangle92.github.io/
echo     English App   https://yangle92.github.io/english/
echo.
echo   To add a new post: drop a .md file into the BLog folder,
echo   then run this script again.
echo.
pause
exit /b 0

:nopython
echo [ERROR] Python was not found in PATH.
echo.
echo   Please install Python 3, or run this from a normal command
echo   prompt where the 'python' command works.
echo.
pause
exit /b 1

:failed
echo.
echo [ERROR] Sync failed. Read the messages above for details.
echo.
pause
exit /b 1

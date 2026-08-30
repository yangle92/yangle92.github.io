@echo off
setlocal
title Happy English - Local Server
cd /d "%~dp0"

set PORT=8000
if not "%~1"=="" set PORT=%~1

echo.
echo   ============================================
echo      Happy English Learning System
echo   ============================================
echo.

rem ---------- 1. Find a usable Python ----------
set PYTHON_EXE=

if exist "%USERPROFILE%\.workbuddy\binaries\python\versions\3.13.12\python.exe" (
    set "PYTHON_EXE=%USERPROFILE%\.workbuddy\binaries\python\versions\3.13.12\python.exe"
    goto :found
)

where python >nul 2>nul
if %errorlevel%==0 (
    set "PYTHON_EXE=python"
    goto :found
)

where py >nul 2>nul
if %errorlevel%==0 (
    set "PYTHON_EXE=py"
    goto :found
)

echo   [ERROR] Python not found. Cannot start the server.
echo.
echo   Please install Python from https://www.python.org/downloads/
echo   Remember to check "Add Python to PATH" during setup.
echo.
pause
exit /b 1

:found
echo   Python : %PYTHON_EXE%
echo   Port   : %PORT%

rem ---------- 2. Check if the port is already in use ----------
netstat -ano | findstr "LISTENING" | findstr ":%PORT% " >nul 2>nul
if %errorlevel%==0 (
    echo   Port %PORT% is already in use - server may be running.
    echo   Opening browser directly...
    goto :open
)

rem ---------- 3. Start the server (minimized window) ----------
if exist "%~dp0server.py" goto :startpy

echo   Mode   : static only (accounts saved in this browser only)
start "EnglishServer(DoNotClose)" /MIN "%PYTHON_EXE%" -m http.server %PORT% --bind 0.0.0.0
goto :waitboot

:startpy
echo   Mode   : full server (accounts + progress saved in the data folder)
start "EnglishServer(DoNotClose)" /MIN "%PYTHON_EXE%" server.py %PORT%

:waitboot
timeout /t 2 /nobreak >nul

:open
echo.
echo   Open in browser:
echo     This PC    : http://localhost:%PORT%/
set "LANIP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=* delims= " %%b in ("%%a") do (
        if not "%%b"=="127.0.0.1" if not defined LANIP set "LANIP=%%b"
    )
)
if defined LANIP (
    echo     Phone/Tab : http://%LANIP%:%PORT%/    same Wi-Fi required
)
echo.
echo   Data folder : data\users.json  data\progress.json
echo   To stop     : close the window titled "EnglishServer(DoNotClose)"
echo.

start "" http://localhost:%PORT%/

echo   Browser opened. This window closes in 5 seconds (server keeps running).
timeout /t 5 /nobreak >nul
exit /b 0

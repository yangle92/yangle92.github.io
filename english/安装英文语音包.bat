@echo off
setlocal
title Install English Voice Pack
cd /d "%~dp0"

rem ---------- Check for administrator rights ----------
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   ==========================================
    echo     Administrator rights required
    echo   ==========================================
    echo.
    echo   Please RIGHT-CLICK this file and choose
    echo   "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo.
echo   ==========================================
echo     Installing English (United States)
echo     text-to-speech voice pack
echo     About 100MB, needs internet, 1-5 minutes
echo   ==========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-WindowsCapability -Online -Name 'Language.Speech~~~en-US~0.0.1.0'; if($c.State -eq 'Installed'){Write-Output '  Already installed.'}else{Write-Output ('  Current state: ' + $c.State + ' - installing...'); Add-WindowsCapability -Online -Name 'Language.Speech~~~en-US~0.0.1.0' | Out-Null; $c2=Get-WindowsCapability -Online -Name 'Language.Speech~~~en-US~0.0.1.0'; Write-Output ('  State after install: ' + $c2.State)}"

echo.
echo   ---------- Installed system voices ----------
powershell -NoProfile -Command "Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens' | ForEach-Object { Write-Output ('   ' + $_.PSChildName) }"

echo.
echo   ---------- Note ----------
echo   If you see entries starting with MSTTS_V110_enUS_,
echo   the English voice is installed.
echo.
echo   Then CLOSE Chrome completely and reopen it,
echo   so the website can use offline English speech.
echo.
echo   If nothing is listed, check your network and run this again.
echo.
pause

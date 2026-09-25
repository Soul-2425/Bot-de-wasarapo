@echo off
set NODE_OPTIONS=--max-old-space-size=1024 --expose-gc

:inicio
echo ========================================
echo   BOT DE WHATSAPP - Iniciando (Auto-Recovery)
echo ========================================
node bot.js

if %errorlevel% equ 2 (
    echo.
    echo ==============================================================
    echo  [!] MEMORIA SATURADA - REINICIO TACTICO INICIADO
    echo  El bot se reiniciara automaticamente para liberar RAM...
    echo ==============================================================
    taskkill /F /IM chrome.exe /T >nul 2>&1
    timeout /t 5 /nobreak
    goto inicio
)

echo.
echo ========================================
echo   TODOS LOS CICLOS TERMINADOS
echo ========================================
pause

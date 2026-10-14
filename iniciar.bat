@echo off
set NODE_OPTIONS=--max-old-space-size=1024 --expose-gc
title Bot de WhatsApp - Publicador Automatico
cls

echo ================================================================
echo   BOT DE WHATSAPP - MODO SUPERVISOR RESILIENTE
echo ================================================================
echo   * Este supervisor mantiene el bot activo y vigilado.
echo   * Si ocurre un corte de conexion o fallo, se auto-recupera.
echo   * Para detener el bot por completo, cierra esta ventana.
echo ================================================================
echo.

:bucle_principal
echo [%TIME%] Iniciando motor del bot de WhatsApp...
node bot.js

set CODIGO_SALIDA=%ERRORLEVEL%
echo.
echo [%TIME%] [AVISO] El proceso del bot finalizo con codigo: %CODIGO_SALIDA%

if %CODIGO_SALIDA% EQU 0 (
    echo.
    echo [OK] El bot ha completado su trabajo exitosamente.
    echo Presiona cualquier tecla para cerrar esta ventana...
    pause >nul
    exit /b 0
)

if %CODIGO_SALIDA% EQU 1 (
    echo.
    echo [AVISO] El bot se detuvo por un archivo faltante o error de configuracion.
    echo Revisa el mensaje mostrado arriba.
    echo Presiona cualquier tecla para reintentar...
    pause >nul
)

echo [%TIME%] Limpiando posibles procesos residuales de Chrome...
taskkill /F /IM chrome.exe >nul 2>&1

echo [%TIME%] Reanudando bot en 5 segundos...
timeout /t 5 /nobreak >nul
cls
goto bucle_principal

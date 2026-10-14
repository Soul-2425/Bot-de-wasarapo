@echo off
cd /d "%~dp0"
title Reiniciar Ciclos de Envio
echo ======================================================
echo   REINICIAR CICLOS DE ENVIO (CICLO 1 INMEDIATO)
echo ======================================================
echo.
echo Restableciendo estado de envios y ciclos...
if exist estado.json del /f /q estado.json
if exist estado.tmp.json del /f /q estado.tmp.json
echo.
echo ======================================================
echo Listo! Se ha reiniciado el contador de ciclos a 0.
echo Tu sesion de WhatsApp sigue intacta (no requieres QR).
echo Cuando abras 'iniciar.bat', arrancara de inmediato 
echo en el Ciclo 1 sin esperar tiempo de reposo.
echo ======================================================
pause

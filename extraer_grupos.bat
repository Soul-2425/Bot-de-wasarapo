@echo off
set NODE_OPTIONS=--max-old-space-size=1024
echo ======================================================
echo   EXTRACTOR DE GRUPOS DE WHATSAPP
echo   (Asegurate de que bot.js no este corriendo)
echo ======================================================
node obtener_grupos.js
echo.
pause

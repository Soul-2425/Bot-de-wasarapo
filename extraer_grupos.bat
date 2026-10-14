@echo off
cd /d "%~dp0"
set NODE_OPTIONS=--max-old-space-size=1024
title Extractor de Grupos - WhatsApp Bot
echo ======================================================
echo   EXTRACTOR DE GRUPOS DE WHATSAPP
echo ======================================================
echo Verificando entorno y preparando sesion...
node obtener_grupos.js
echo.
pause

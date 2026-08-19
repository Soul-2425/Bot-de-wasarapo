@echo off
echo ==============================================================
echo  LIMPIEZA DE CHROME FANTASMA
echo ==============================================================
echo Cerrando todos los procesos de Google Chrome ocultos...
taskkill /F /IM chrome.exe /T >nul 2>&1
echo.
echo Limpieza terminada. Ahora puedes abrir el bot o extraer grupos.
echo.
pause

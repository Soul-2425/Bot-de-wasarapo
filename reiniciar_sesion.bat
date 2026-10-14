@echo off
cd /d "%~dp0"
title Reiniciar Sesion de WhatsApp
echo ======================================================
echo   REINICIAR SESION DE WHATSAPP (BORRADO LIMPIO)
echo ======================================================
echo Cerrando instancias de Chrome y limpiando credenciales...
node -e "require('./src/limpiadorSesion').eliminarSesionCorrupta(); console.log('Sesion limpiada con exito.');"
echo.
echo ======================================================
echo Sesion limpia. Ahora puedes abrir 'iniciar.bat' o 
echo 'extraer_grupos.bat' y escanear el codigo QR nuevo.
echo ======================================================
pause

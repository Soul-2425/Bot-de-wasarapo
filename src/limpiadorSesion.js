const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/**
 * Verifica si otro script conflictivo está corriendo, cierra procesos zombies de Chrome
 * pertenecientes a este bot y limpia archivos de bloqueo residuales.
 * 
 * @param {'bot.js' | 'obtener_grupos.js'} scriptActual
 */
function prepararEntornoSesion(scriptActual) {
    const scriptOpuesto = scriptActual === 'bot.js' ? 'obtener_grupos.js' : 'bot.js';

    // 1. Verificar si el script opuesto está corriendo en este momento
    if (process.platform === 'win32') {
        try {
            const psCheck = `Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*${scriptOpuesto}*' } | Select-Object -ExpandProperty ProcessId`;
            const salida = execFileSync('powershell.exe', ['-NoProfile', '-Command', psCheck], { encoding: 'utf8', timeout: 5000 }).trim();
            if (salida && salida.length > 0) {
                console.error(`\n❌ ERROR: Se detectó que '${scriptOpuesto}' está en ejecución.`);
                console.error(`⚠️ Ambos programas comparten la misma sesión de WhatsApp Web y no pueden ejecutarse a la vez.`);
                console.error(`👉 Por favor, cierra primero la ventana de '${scriptOpuesto}' antes de iniciar '${scriptActual}'.\n`);
                process.exit(1);
            }
        } catch (e) {
            // Ignorar errores en la consulta de procesos
        }

        // 2. Cerrar instancias de Chrome zombies asociadas a la sesión de este bot
        try {
            const psKill = `Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' -and ($_.CommandLine -like '*wwebjs_auth*' -or $_.CommandLine -like '*Bot-de-wasarapo-XD*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`;
            execFileSync('powershell.exe', ['-NoProfile', '-Command', psKill], { stdio: 'ignore', timeout: 5000 });
        } catch (e) {
            // Ignorar si no había procesos zombies
        }
    }

    // 3. Eliminar archivos de bloqueo (lockfiles) residuales de Puppeteer / Chrome
    const rutaSession = path.join(__dirname, '..', '.wwebjs_auth', 'session');
    const archivosBloqueo = [
        'lockfile',
        'DevToolsActivePort',
        'SingletonLock',
        'SingletonCookie',
        'SingletonSocket'
    ];

    for (const archivo of archivosBloqueo) {
        try {
            const rutaCompleta = path.join(rutaSession, archivo);
            if (fs.existsSync(rutaCompleta)) {
                fs.unlinkSync(rutaCompleta);
            }
        } catch (e) {
            // Si el archivo está tomado por un proceso activo, se ignorará
        }
    }
}

/**
 * Elimina por completo la carpeta .wwebjs_auth para forzar una sesión limpia con nuevo código QR.
 */
function eliminarSesionCorrupta() {
    const rutaAuth = path.join(__dirname, '..', '.wwebjs_auth');
    if (process.platform === 'win32') {
        try {
            const killCmd = `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"name = 'chrome.exe'\\" | Where-Object { $_.CommandLine -like '*wwebjs_auth*' -or $_.CommandLine -like '*Bot-de-wasarapo-XD*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"`;
            execSync(killCmd, { stdio: 'ignore', timeout: 5000 });
        } catch (e) {}
    }
    if (fs.existsSync(rutaAuth)) {
        try {
            fs.rmSync(rutaAuth, { recursive: true, force: true, maxRetries: 4, retryDelay: 500 });
        } catch (e) {
            try {
                execSync(`powershell -NoProfile -Command "Remove-Item -Path '${rutaAuth}' -Recurse -Force -ErrorAction SilentlyContinue"`, { stdio: 'ignore', timeout: 5000 });
            } catch (ePs) {}
        }
    }
}

module.exports = { prepararEntornoSesion, eliminarSesionCorrupta };

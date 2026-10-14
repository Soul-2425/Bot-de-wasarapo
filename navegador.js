const fs = require('fs');
const path = require('path');

function obtenerRutaNavegador() {
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    const posiblesRutas = [
        path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    ];

    for (const ruta of posiblesRutas) {
        if (ruta && fs.existsSync(ruta)) {
            return ruta;
        }
    }
    return undefined;
}

module.exports = { obtenerRutaNavegador };

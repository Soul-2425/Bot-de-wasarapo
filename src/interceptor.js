// ================================================================
// ⚡ OPTIMIZADOR DE RED Y MEMORIA (INTERCEPTOR DE RECURSOS)
// ================================================================

/**
 * Intercepta y bloquea la descarga de archivos multimedia, videos, audios
 * y fuentes pesadas que entran continuamente a través de los grupos.
 */
async function activarOptimizacionDeRecursos(page) {
    if (!page) return;
    try {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const tipo = req.resourceType();
            const url = req.url();

            // Nunca bloquear nada que provenga o vaya hacia los servidores de WhatsApp
            if (url.includes('whatsapp.com') || url.includes('whatsapp.net') || url.startsWith('data:') || url.startsWith('blob:')) {
                return req.continue();
            }

            // Bloquear fuentes externas y telemetría no esencial
            if (tipo === 'font' || tipo === 'ping') {
                return req.abort();
            }

            req.continue();
        });
        console.log('⚡ Interceptor de red activado: recursos multimedia entrantes bloqueados para preservar la memoria RAM.');
    } catch (err) {
        console.log('ℹ️ Interceptor de red en modo pasivo:', err.message);
    }
}

module.exports = { activarOptimizacionDeRecursos };

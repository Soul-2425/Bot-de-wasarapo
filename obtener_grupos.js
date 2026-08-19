// =========================================================================
// 🕵️‍♂️ EXTRACTOR DE NOMBRES DE GRUPOS — VERSIÓN ACTUALIZADA Y OPTIMIZADA
// =========================================================================

// 🚀 AUTOCORRECCIÓN DE MEMORIA: Si Node.js arranca con la memoria estándar (2GB),
// este bloque cerrará el script y lo volverá a abrir automáticamente con 6GB.
const v8 = require('v8');
const { execSync } = require('child_process');

const limiteMemoriaActual = v8.getHeapStatistics().heap_size_limit / (1024 * 1024);
if (limiteMemoriaActual < 4000) {
    console.log("⚠️ RAM estándar detectada. Aumentando límite a 6GB para evitar bloqueos...");
    // Reiniciamos este mismo archivo pero con el flag de memoria extendida
    execSync(`node --max-old-space-size=6144 "${__filename}"`, { stdio: 'inherit' });
    process.exit(0);
}

// =========================================================================
// 🚫 LISTA DE GRUPOS IGNORADOS
// Agrega aquí los nombres EXACTOS de los grupos que NO quieres en el archivo.
// =========================================================================
const GRUPOS_IGNORADOS = [
    "Soul store",
    "The Rose group",
    "tubo deida",
    "Batle Light",
];

// =========================================================================
// ⚙️ FILTROS ADICIONALES (opcional)
// =========================================================================
const PALABRAS_A_IGNORAR = [
    "Trabajo",
    "privado",
];

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const cliente = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--disable-features=ServiceWorker',
            // ✅ Solo flags seguros que no rompen la conexión de WhatsApp
            '--disable-extensions',
            '--disable-notifications',
            '--mute-audio',
            '--no-default-browser-check',
        ],
        timeout: 120000,
        protocolTimeout: 180000
    }
});

cliente.on('qr', (qrCode) => {
    console.log('📱 Escanea el QR con tu WhatsApp:');
    qrcode.generate(qrCode, { small: true });
});

cliente.on('authenticated', () => {
    console.log('🔐 Autenticado correctamente.');
});

cliente.on('ready', async () => {
    console.log('✅ Conectado a WhatsApp.');
    console.log('⏳ Esperando 30 segundos para que WhatsApp sincronice los grupos...\n');
    await new Promise(r => setTimeout(r, 30000));

    console.log('🔍 Extrayendo grupos (modo ahorrador de memoria)...');

    try {
        const grupos = await cliente.pupPage.evaluate(async () => {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open('model-storage');
                req.onerror = () => reject(new Error('No se pudo abrir la base de datos: ' + req.error));
                req.onsuccess = (evt) => {
                    const db = evt.target.result;
                    if (!db.objectStoreNames.contains('chat')) {
                        reject(new Error('Store "chat" no encontrado. WhatsApp puede haber cambiado su estructura.'));
                        return;
                    }
                    const tx = db.transaction('chat', 'readonly');
                    const store = tx.objectStore('chat');
                    
                    // 🧠 OPTIMIZACIÓN: Usar cursor en lugar de getAll() para no saturar la RAM de Chrome
                    const gruposFiltrados = [];
                    const cursorReq = store.openCursor();
                    
                    cursorReq.onsuccess = (e) => {
                        const cursor = e.target.result;
                        if (cursor) {
                            const c = cursor.value;
                            const id = typeof c.id === 'string' ? c.id : (c.id && c.id._serialized ? c.id._serialized : '');
                            
                            // Solo guardamos si es grupo, ahorrando memoria al ignorar chats normales
                            if (id.includes('@g.us')) {
                                gruposFiltrados.push({
                                    nombre: c.name || c.formattedTitle || c.displayName || '(sin nombre)',
                                    id: id
                                });
                            }
                            cursor.continue();
                        } else {
                            // Cuando termina de recorrer todo
                            resolve(gruposFiltrados);
                        }
                    };
                    cursorReq.onerror = () => reject(new Error('Error al recorrer IDB: ' + cursorReq.error));
                };
            });
        });

        if (!grupos || grupos.length === 0) {
            console.log('⚠️  No se encontraron grupos. Intenta esperar más tiempo o revisar tu sesión.');
            process.exit(1);
        }

        // --- APLICAR FILTROS DE EXCLUSIÓN ---
        const gruposFiltrados = grupos.filter(g => {
            const nombre = g.nombre;

            if (GRUPOS_IGNORADOS.includes(nombre)) {
                console.log(`   🚫 Ignorado (lista exacta): ${nombre}`);
                return false;
            }

            const nombreLower = nombre.toLowerCase();
            const palabraEncontrada = PALABRAS_A_IGNORAR.find(p => nombreLower.includes(p.toLowerCase()));
            if (palabraEncontrada) {
                console.log(`   🚫 Ignorado (contiene "${palabraEncontrada}"): ${nombre}`);
                return false;
            }

            return true;
        });

        const ignorados = grupos.length - gruposFiltrados.length;
        // El orden se respeta tal como WhatsApp los devuelve (actividad reciente)

        console.log(`\n✅ Total encontrados: ${grupos.length} grupos`);
        if (ignorados > 0) console.log(`🚫 Ignorados por filtro: ${ignorados}`);
        console.log(`📋 A incluir en el archivo: ${gruposFiltrados.length} grupos\n`);

        gruposFiltrados.forEach((g, idx) => {
            console.log(`  ${String(idx + 1).padStart(3, ' ')}. ${g.nombre}`);
        });

        let textoParaArchivo = `// =====================================================\n`;
        textoParaArchivo += `// Grupos extraídos el ${new Date().toLocaleString('es-MX')}\n`;
        textoParaArchivo += `// Total encontrados: ${grupos.length} | Ignorados: ${ignorados} | Incluidos: ${gruposFiltrados.length}\n`;
        textoParaArchivo += `// Copia el bloque "gruposDestino" y pégalo en bot.js\n`;
        textoParaArchivo += `// =====================================================\n\n`;
        textoParaArchivo += `    gruposDestino: [\n`;
        gruposFiltrados.forEach((g) => {
            const nombreEscapado = g.nombre.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            // Formato blindado: ID|||Nombre
            textoParaArchivo += `        "${g.id}|||${nombreEscapado}",\n`;
        });
        textoParaArchivo += `    ]\n`;

        fs.writeFileSync('mis_grupos.txt', textoParaArchivo, 'utf8');

        console.log('\n=================================================');
        console.log(`🎉 ¡ÉXITO! Archivo "mis_grupos.txt" generado.`);
        console.log(`   ✅ Grupos incluidos : ${gruposFiltrados.length}`);
        if (ignorados > 0) console.log(`   🚫 Grupos ignorados: ${ignorados}`);
        console.log('');
        console.log('📋 Pasos para usarlo:');
        console.log('   1. Abre el archivo "mis_grupos.txt" en tu editor.');
        console.log('   2. Copia el bloque "gruposDestino: [ ... ]"');
        console.log('   3. Reemplaza el bloque gruposDestino en bot.js');
        console.log('=================================================\n');

    } catch (error) {
        console.error('\n❌ Error al extraer grupos:', error.message);
        console.log('\nSi el error persiste, ejecuta primero diagnostico.js para verificar el estado.');
    }

    process.exit(0);
});

cliente.on('disconnected', (razon) => {
    console.log('❌ Desconectado:', razon);
    process.exit(1);
});

cliente.initialize();
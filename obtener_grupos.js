// =========================================================================
// 🕵️‍♂️ EXTRACTOR DE NOMBRES DE GRUPOS — VERSIÓN OPTIMIZADA Y RESISTENTE
// =========================================================================

const path = require('path');
const fs = require('fs');
const v8 = require('v8');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const ramMB = Math.round(v8.getHeapStatistics().heap_size_limit / (1024 * 1024));
console.log(`✅ Extractor iniciado - Memoria asignada: ${ramMB} MB`);

// =========================================================================
// 🚫 LISTA DE GRUPOS IGNORADOS
// =========================================================================
const GRUPOS_IGNORADOS = [
    "Soul store",
    "The Rose group",
    "tubo deida",
    "Batle Light",
];

// =========================================================================
// ⚙️ FILTROS ADICIONALES POR PALABRA
// =========================================================================
const PALABRAS_A_IGNORAR = [
    "Trabajo",
    "privado",
];

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
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--disable-features=ServiceWorker',
            // ⚡ Optimización gráfica (pero sin límite de RAM para evitar crasheo al leer chats)
            '--blink-settings=imagesEnabled=false',
            '--disable-extensions',
            '--disable-notifications',
            '--mute-audio',
            '--no-default-browser-check',
        ],
        timeout: 180000,
        protocolTimeout: 240000
    }
});

cliente.on('qr', (qrCode) => {
    console.log('\n📱 Escanea el siguiente código QR con tu WhatsApp:');
    qrcode.generate(qrCode, { small: true });
});

cliente.on('authenticated', () => {
    console.log('🔐 Sesión autenticada correctamente.');
});

cliente.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
});

cliente.on('ready', async () => {
    console.log('✅ Conectado a WhatsApp con éxito.');
    console.log('⏳ Esperando 15 segundos para sincronización inicial de chats...');
    await new Promise(r => setTimeout(r, 15000));

    let grupos = [];

    // --- MÉTODO 1 (PRINCIPAL): Extracción ligera desde la memoria activa (Store) ---
    // En lugar de usar getChats() (que consume mucha RAM y crashea), leemos directamente 
    // la base de datos viva de WhatsApp Web. ¡Esto garantiza ver los grupos nuevos al instante!
    console.log('🔍 Extrayendo grupos desde la memoria en vivo de WhatsApp...');
    try {
        const gruposEnMemoria = await cliente.pupPage.evaluate(async () => {
            let chatsRaw = [];
            // Intentar con WWebJS (Inyectado oficialmente por whatsapp-web.js)
            if (window.WWebJS && typeof window.WWebJS.getChats === 'function') {
                chatsRaw = await window.WWebJS.getChats(); // WWebJS puede devolver una Promesa
            } 
            // Alternativa: Store.Chat
            else if (window.Store && window.Store.Chat) {
                if (typeof window.Store.Chat.getModelsArray === 'function') {
                    chatsRaw = window.Store.Chat.getModelsArray();
                } else {
                    chatsRaw = window.Store.Chat.models || [];
                }
            }

            if (!chatsRaw) return null;

            // Asegurarnos de que sea un array real para evitar el error "filter is not a function"
            if (!Array.isArray(chatsRaw)) {
                if (typeof chatsRaw.toArray === 'function') chatsRaw = chatsRaw.toArray();
                else chatsRaw = Array.from(chatsRaw || []);
            }

            if (chatsRaw.length === 0) return null;

            return chatsRaw
                .filter(chat => chat && chat.isGroup)
                .map(chat => {
                    let nombreGrupo = chat.name || chat.formattedTitle || chat.title;
                    if (!nombreGrupo && chat.groupMetadata) {
                        nombreGrupo = chat.groupMetadata.subject;
                    }
                    if (!nombreGrupo && chat.contact) {
                        nombreGrupo = chat.contact.name || chat.contact.formattedName;
                    }
                    return {
                        id: chat.id && chat.id._serialized ? chat.id._serialized : chat.id,
                        nombre: nombreGrupo || '(sin nombre)'
                    };
                });
        });

        if (gruposEnMemoria && gruposEnMemoria.length > 0) {
            grupos = gruposEnMemoria;
            console.log(`✅ Extracción en vivo exitosa: ${grupos.length} grupos detectados.`);
        } else {
            console.error('❌ La memoria de WhatsApp aún no ha cargado los chats.');
        }
    } catch (errApi) {
        console.error('❌ Error al leer la memoria en vivo:', errApi.message);
    }

    // --- MÉTODO 2 (FALLBACK): Extracción desde IndexedDB ---
    // Si la API oficial falla por falta de memoria, intentamos leer directamente de la base de datos local.
    if (!grupos || grupos.length === 0) {
        console.log('🔍 Intentando extraer grupos mediante IndexedDB (Fallback)...');
        try {
            const gruposIDB = await cliente.pupPage.evaluate(async () => {
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open('model-storage');
                    req.onerror = () => reject(new Error('No se pudo abrir model-storage'));
                    req.onsuccess = (evt) => {
                        const db = evt.target.result;
                        if (!db.objectStoreNames.contains('chat')) {
                            return reject(new Error('Store "chat" no existe en model-storage'));
                        }
                        const tx = db.transaction('chat', 'readonly');
                        const store = tx.objectStore('chat');
                        const lista = [];
                        const cursorReq = store.openCursor();
                        
                        cursorReq.onsuccess = (e) => {
                            const cursor = e.target.result;
                            if (cursor) {
                                const c = cursor.value;
                                const id = typeof c.id === 'string' ? c.id : (c.id && c.id._serialized ? c.id._serialized : '');
                                if (id.includes('@g.us')) {
                                    let nom = c.name || c.formattedTitle || c.title || c.displayName;
                                    if (!nom && c.groupMetadata && c.groupMetadata.subject) {
                                        nom = c.groupMetadata.subject;
                                    }
                                    if (!nom && c.contact && c.contact.name) {
                                        nom = c.contact.name;
                                    }
                                    lista.push({
                                        id: id,
                                        nombre: nom || '(sin nombre)'
                                    });
                                }
                                cursor.continue();
                            } else {
                                resolve(lista);
                            }
                        };
                        cursorReq.onerror = () => reject(new Error('Error en cursor IDB'));
                    };
                });
            });

            if (Array.isArray(gruposIDB) && gruposIDB.length > 0) {
                grupos = gruposIDB;
                console.log(`✅ Método IndexedDB exitoso: ${grupos.length} grupos detectados.`);
            }
        } catch (errIDB) {
            console.log(`ℹ️ IndexedDB no disponible o vacío (${errIDB.message}).`);
        }
    }

    if (!grupos || grupos.length === 0) {
        console.log('⚠️ No se encontraron grupos en esta cuenta o la sincronización tardó demasiado.');
        console.log('Consejo: Revisa que tu teléfono tenga conexión estable e intenta de nuevo.');
        try { await cliente.destroy(); } catch (e) {}
        process.exit(1);
    }

    // --- DEDUPLICAR Y FILTRAR ---
    const mapaUnicos = new Map();
    for (const g of grupos) {
        if (!mapaUnicos.has(g.id)) {
            mapaUnicos.set(g.id, g);
        }
    }
    const listaUnica = Array.from(mapaUnicos.values());

    const gruposFiltrados = listaUnica.filter(g => {
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

    const ignorados = listaUnica.length - gruposFiltrados.length;

    console.log(`\n=================================================`);
    console.log(`📊 RESUMEN DE EXTRACCIÓN:`);
    console.log(`   Total grupos detectados: ${listaUnica.length}`);
    console.log(`   Grupos ignorados:        ${ignorados}`);
    console.log(`   Grupos listos a guardar: ${gruposFiltrados.length}`);
    console.log(`=================================================\n`);

    gruposFiltrados.forEach((g, idx) => {
        console.log(`  ${String(idx + 1).padStart(3, ' ')}. ${g.nombre} (${g.id})`);
    });

    // Formatear archivo para mis_grupos.txt
    let textoParaArchivo = `// =====================================================\n`;
    textoParaArchivo += `// Grupos extraídos el ${new Date().toLocaleString('es-MX')}\n`;
    textoParaArchivo += `// Total encontrados: ${listaUnica.length} | Ignorados: ${ignorados} | Incluidos: ${gruposFiltrados.length}\n`;
    textoParaArchivo += `// Copia el bloque "gruposDestino" y pégalo en bot.js\n`;
    textoParaArchivo += `// =====================================================\n\n`;
    textoParaArchivo += `    gruposDestino: [\n`;
    gruposFiltrados.forEach((g) => {
        const nombreEscapado = g.nombre.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        textoParaArchivo += `        "${g.id}|||${nombreEscapado}",\n`;
    });
    textoParaArchivo += `    ]\n`;

    const rutaArchivo = path.join(__dirname, 'mis_grupos.txt');
    fs.writeFileSync(rutaArchivo, textoParaArchivo, 'utf8');

    console.log('\n=================================================');
    console.log(`🎉 ¡ÉXITO! Archivo actualizado en:`);
    console.log(`   ${rutaArchivo}`);
    console.log(`   ✅ Grupos incluidos: ${gruposFiltrados.length}`);
    console.log(`=================================================\n`);

    try { await cliente.destroy(); } catch (e) {}
    process.exit(0);
});

cliente.on('disconnected', (razon) => {
    console.log('❌ Desconectado de WhatsApp:', razon);
    process.exit(1);
});

// Manejo de cierres limpios
process.on('SIGINT', async () => {
    console.log('\n🛑 Cancelando extracción...');
    try { await cliente.destroy(); } catch (e) {}
    process.exit(0);
});

console.log('🚀 Iniciando cliente de WhatsApp en segundo plano...');
cliente.initialize();
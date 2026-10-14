// =========================================================================
// 🕵️‍♂️ EXTRACTOR DE NOMBRES DE GRUPOS — VERSIÓN OPTIMIZADA Y RESISTENTE
// =========================================================================

const path = require('path');
const fs = require('fs');
const v8 = require('v8');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { obtenerRutaNavegador } = require('./navegador');
const { prepararEntornoSesion, eliminarSesionCorrupta } = require('./src/limpiadorSesion');

prepararEntornoSesion('obtener_grupos.js');

// 🛡️ Manejadores globales para evitar cierres abruptos por eventos asíncronos de WhatsApp Web
process.on('unhandledRejection', (razon) => {
    const errorStr = (razon && razon.message) ? razon.message : String(razon || '');
    if (errorStr.includes('auth timeout') || errorStr.includes('Execution context was destroyed') || errorStr.includes('Protocol error')) {
        return; // Ignorar advertencias internas transitorias de navegación en WhatsApp Web
    }
    console.warn(`⚠️ [Advertencia Asíncrona] ${errorStr}`);
});

process.on('uncaughtException', (err) => {
    const errorStr = err?.message || String(err || '');
    if (errorStr.includes('Execution context was destroyed') || errorStr.includes('Protocol error')) {
        return;
    }
    console.error(`❌ [Excepción no controlada] ${errorStr}`);
});

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

const rutaNavegador = obtenerRutaNavegador();
if (rutaNavegador) {
    console.log(`🌐 Navegador detectado automáticamente: ${rutaNavegador}`);
} else {
    console.log(`ℹ️ Usando navegador por defecto de Puppeteer`);
}

async function verificarConexionInternet(timeoutMs = 6000) {
    try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch('https://web.whatsapp.com', { signal: controller.signal, method: 'HEAD' });
        clearTimeout(tId);
        return res.status > 0;
    } catch (e) {
        return false;
    }
}

async function asegurarConexionInternet() {
    let conectividadOk = await verificarConexionInternet(6000);
    if (!conectividadOk) {
        console.log('🌐 Sin conexión con web.whatsapp.com o fallo temporal de DNS.');
        console.log('⏳ Esperando a que el servicio de internet se restablezca en tu equipo...');
        while (!conectividadOk) {
            await new Promise(r => setTimeout(r, 6000));
            conectividadOk = await verificarConexionInternet(6000);
        }
        console.log('🌐 Conexión a internet restablecida correctamente.');
        await new Promise(r => setTimeout(r, 2000));
    }
}

function crearCliente() {
    return new Client({
        authStrategy: new LocalAuth({
            dataPath: path.join(__dirname, '.wwebjs_auth')
        }),
        authTimeoutMs: 180000,
        qrMaxRetries: 5,
        takeoverOnConflict: true,
        takeoverTimeoutMs: 10000,
        webVersionCache: {
            type: 'local',
        },
        puppeteer: {
            headless: true,
            ...(rutaNavegador ? { executablePath: rutaNavegador } : {}),
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--disable-blink-features=AutomationControlled',
                '--disable-extensions',
                '--disable-notifications',
                '--mute-audio',
                '--no-default-browser-check',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-ipc-flooding-protection',
                '--disable-hang-monitor',
                '--disable-breakpad'
            ],
            timeout: 180000,
            protocolTimeout: 300000
        }
    });
}

async function esperarEstabilizacionWhatsApp(cli, tiempoMaximoMs = 90000) {
    console.log('⏳ Esperando a que WhatsApp complete la sincronización y cargue la interfaz...');
    const inicio = Date.now();
    let estabilizado = false;

    while (Date.now() - inicio < tiempoMaximoMs) {
        try {
            if (!cli.pupPage || cli.pupPage.isClosed()) {
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            const listo = await cli.pupPage.evaluate(() => {
                const pane = document.querySelector('#pane-side') || 
                             document.querySelector('[data-testid="chat-list"]') ||
                             document.querySelector('div[role="navigation"]');
                
                const storeListo = !!(window.Store?.Chat?.models?.length || 
                                      (window.require && window.require('WAWebCollections')?.Chat?.models?.length));

                return !!(pane || storeListo);
            });

            if (listo) {
                estabilizado = true;
                break;
            }
        } catch (e) {
            // El contexto se destruye durante la navegación post-login. Normal mientras carga.
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    if (estabilizado) {
        console.log('✅ Interfaz de WhatsApp detectada. Esperando 5s para asentar chats...');
        await new Promise(r => setTimeout(r, 5000));
    } else {
        console.log('ℹ️ Tiempo de espera inicial completado. Procediendo con la extracción...');
        await new Promise(r => setTimeout(r, 3000));
    }
}

let cliente = null;
let extraccionIniciada = false;

function registrarEventos(cli) {
    cli.on('qr', (qrCode) => {
        console.log('\n📱 Escanea el siguiente código QR con tu WhatsApp:');
        qrcode.generate(qrCode, { small: true });
    });

    cli.on('authenticated', () => {
        console.log('🔐 Sesión autenticada correctamente.');
    });

    let ultimoPorcentaje = -1;
    cli.on('loading_screen', (percent, message) => {
        if (percent === 100) {
            if (ultimoPorcentaje !== 100) {
                console.log('✅ Sincronización completada al 100%. Accediendo a los chats...');
                ultimoPorcentaje = 100;
            }
            return;
        }
        if (percent >= ultimoPorcentaje + 20) {
            console.log(`⏳ Sincronizando chats con el teléfono: ${percent}%`);
            ultimoPorcentaje = percent;
        }
    });

    cli.on('change_state', (state) => {
        console.log(`📡 Estado de conexión: ${state}`);
    });

    cli.on('auth_failure', (msg) => {
        console.error('❌ Error de autenticación:', msg);
    });

    cli.once('ready', async () => {
        if (extraccionIniciada) return;
        extraccionIniciada = true;

    console.log('✅ Conectado a WhatsApp con éxito.');
    await esperarEstabilizacionWhatsApp(cli);

    let grupos = [];

    // --- MÉTODO 1 (PRINCIPAL): Extracción ligera desde la memoria activa (Store) con Reintentos ---
    // En lugar de usar getChats() (que consume mucha RAM y crashea), leemos directamente 
    // la base de datos viva de WhatsApp Web.
    console.log('🔍 Extrayendo grupos desde la memoria en vivo de WhatsApp...');
    for (let intento = 1; intento <= 5; intento++) {
        try {
            if (intento > 1) {
                console.log(`🔄 Reintentando lectura de memoria viva (Intento ${intento}/5)...`);
            }
            const gruposEnMemoria = await cliente.pupPage.evaluate(async () => {
            let chatsRaw = [];

            // 1. Obtener chats mediante las colecciones vivas de WhatsApp Web
            if (window.require) {
                try {
                    const collections = window.require('WAWebCollections');
                    if (collections && collections.Chat) {
                        chatsRaw = typeof collections.Chat.getModelsArray === 'function' 
                            ? collections.Chat.getModelsArray() 
                            : (collections.Chat.models || []);
                    }
                } catch (eReq) {}
            }

            // Alternativa: WWebJS inyectado
            if ((!chatsRaw || chatsRaw.length === 0) && window.WWebJS && typeof window.WWebJS.getChats === 'function') {
                try {
                    chatsRaw = await window.WWebJS.getChats();
                } catch (eWWeb) {}
            }

            // Alternativa: Store.Chat
            if ((!chatsRaw || chatsRaw.length === 0) && window.Store && window.Store.Chat) {
                if (typeof window.Store.Chat.getModelsArray === 'function') {
                    chatsRaw = window.Store.Chat.getModelsArray();
                } else {
                    chatsRaw = window.Store.Chat.models || [];
                }
            }

            if (!chatsRaw) return null;

            if (!Array.isArray(chatsRaw)) {
                if (typeof chatsRaw.toArray === 'function') chatsRaw = chatsRaw.toArray();
                else chatsRaw = Array.from(chatsRaw || []);
            }

            if (chatsRaw.length === 0) return null;

            // Filtrar solo grupos (@g.us)
            const chatsGrupos = chatsRaw.filter(chat => {
                if (!chat) return false;
                const idStr = chat.id && chat.id._serialized ? chat.id._serialized : (typeof chat.id === 'string' ? chat.id : '');
                return chat.isGroup || idStr.includes('@g.us');
            });

            if (chatsGrupos.length === 0) return null;

            // Módulos y colecciones internas de WhatsApp Web
            const collections = window.require ? window.require('WAWebCollections') : null;
            const widFactory = window.require ? window.require('WAWebWidFactory') : null;
            const GroupCol = collections?.GroupMetadata || collections?.WAWebGroupMetadataCollection || window.Store?.GroupMetadata;
            const ContactCol = collections?.Contact || window.Store?.Contact;

            function resolverNombreDirecto(chat, idStr) {
                let nom = chat.name || chat.formattedTitle || chat.title || chat.subject || chat.displayName;
                if (typeof nom === 'string' && nom.trim().length > 0) return nom.trim();

                let wid = null;
                try {
                    if (chat.id && chat.id._serialized) wid = chat.id;
                    else if (widFactory && idStr) wid = widFactory.createWid(idStr);
                } catch (eWid) {}

                // 1. GroupMetadata en el chat o en la colección global
                if (chat.groupMetadata && chat.groupMetadata.subject && chat.groupMetadata.subject.trim().length > 0) {
                    return chat.groupMetadata.subject.trim();
                }
                if (GroupCol && wid) {
                    try {
                        const gm = GroupCol.get(wid);
                        if (gm && gm.subject && gm.subject.trim().length > 0) {
                            return gm.subject.trim();
                        }
                    } catch (eGm) {}
                }

                // 2. Contact en el chat o en la colección global
                if (chat.contact) {
                    nom = chat.contact.name || chat.contact.formattedName || chat.contact.pushname || chat.contact.verifiedName;
                    if (typeof nom === 'string' && nom.trim().length > 0) return nom.trim();
                }
                if (ContactCol && wid) {
                    try {
                        const c = ContactCol.get(wid);
                        if (c) {
                            nom = c.name || c.formattedName || c.pushname || c.verifiedName;
                            if (typeof nom === 'string' && nom.trim().length > 0) return nom.trim();
                        }
                    } catch (eC) {}
                }

                return null;
            }

            const listaProcesada = [];
            for (const chat of chatsGrupos) {
                const id = chat.id && chat.id._serialized ? chat.id._serialized : (typeof chat.id === 'string' ? chat.id : '');
                if (!id || !id.includes('@g.us')) continue;
                const nom = resolverNombreDirecto(chat, id);
                listaProcesada.push({ id, nombre: nom, chatRef: chat });
            }

            // Consulta activa para los grupos que aún no tengan nombre en la caché inmediata
            for (const item of listaProcesada) {
                if (!item.nombre) {
                    try {
                        const wid = widFactory ? widFactory.createWid(item.id) : null;
                        if (wid && GroupCol) {
                            if (typeof GroupCol.update === 'function') {
                                await GroupCol.update(wid).catch(() => {});
                            } else if (typeof GroupCol.find === 'function') {
                                await GroupCol.find(wid).catch(() => {});
                            }
                            const gm = GroupCol.get(wid);
                            if (gm && gm.subject && gm.subject.trim().length > 0) {
                                item.nombre = gm.subject.trim();
                            }
                        }
                        if (!item.nombre && ContactCol && wid) {
                            const c = ContactCol.get(wid);
                            if (c && (c.name || c.formattedName)) {
                                item.nombre = (c.name || c.formattedName).trim();
                            }
                        }
                    } catch (eActiva) {}
                }
            }

            // Generar identificador descriptivo si el grupo no tiene asunto de texto configurado
            for (const item of listaProcesada) {
                if (!item.nombre || !item.nombre.trim()) {
                    let detalle = '';
                    try {
                        const wid = widFactory ? widFactory.createWid(item.id) : null;
                        const gm = GroupCol && wid ? GroupCol.get(wid) : (item.chatRef ? item.chatRef.groupMetadata : null);
                        if (gm) {
                            if (gm.desc && gm.desc.trim().length > 0) {
                                const descClean = gm.desc.trim().replace(/[\r\n]+/g, ' ').slice(0, 30);
                                detalle = `Desc: "${descClean}..."`;
                            }
                            const cant = Array.isArray(gm.participants) ? gm.participants.length : (gm.participants?.models?.length || 0);
                            let creador = '';
                            if (gm.owner) {
                                const ownerStr = typeof gm.owner === 'string' ? gm.owner : (gm.owner.user || gm.owner._serialized || '');
                                creador = ownerStr.split('@')[0];
                            }
                            if (!detalle && creador) {
                                detalle = `Creador: +${creador} (${cant} miembros)`;
                            } else if (!detalle && cant > 0) {
                                detalle = `${cant} miembros`;
                            }
                        }
                        if (item.chatRef && item.chatRef.isReadOnly) {
                            detalle = `[Grupo Inactivo/Abandonado] ${detalle}`.trim();
                        }
                    } catch (eDet) {}

                    if (detalle) {
                        item.nombre = `[Sin asunto - ${detalle}]`;
                    } else {
                        item.nombre = `[Sin asunto - ID: ${item.id.replace('@g.us', '')}]`;
                    }
                }
                delete item.chatRef;
            }

            return listaProcesada;
        });

            if (gruposEnMemoria && gruposEnMemoria.length > 0) {
                grupos = gruposEnMemoria;
                console.log(`✅ Extracción en vivo exitosa: ${grupos.length} grupos detectados.`);
                break;
            } else {
                console.log(`⏳ La memoria de WhatsApp aún está sincronizando chats... esperando 4s`);
                await new Promise(r => setTimeout(r, 4000));
            }
        } catch (errApi) {
            const msg = errApi?.message || String(errApi);
            if (msg.includes('Execution context was destroyed') || msg.includes('Protocol error')) {
                console.log(`⏳ Pantalla de WhatsApp en transición... reintentando en 4s`);
            } else {
                console.warn(`⚠️ Aviso en lectura viva (intento ${intento}):`, msg);
            }
            await new Promise(r => setTimeout(r, 4000));
        }
    }

    // --- MÉTODO 2 (FALLBACK): Extracción desde IndexedDB ---
    // Si la memoria viva no devolvió grupos, leemos directamente de la base de datos local protegida con reintentos
    if (!grupos || grupos.length === 0) {
        console.log('🔍 Intentando extraer grupos mediante IndexedDB (Fallback)...');
        for (let intentoIdb = 1; intentoIdb <= 3; intentoIdb++) {
            try {
                const gruposIDB = await cliente.pupPage.evaluate(async () => {
                    return new Promise((resolve, reject) => {
                        const req = indexedDB.open('model-storage');
                        req.onerror = () => reject(new Error('No se pudo abrir model-storage'));
                        req.onsuccess = async (evt) => {
                            const db = evt.target.result;
                            if (!db.objectStoreNames.contains('chat')) {
                                return reject(new Error('Store "chat" no existe en model-storage'));
                            }

                            // Mapa de metadatos de grupos si el store existe en IDB
                            const metadataMap = new Map();
                            if (db.objectStoreNames.contains('group-metadata')) {
                                try {
                                    await new Promise((resMeta) => {
                                        const txMeta = db.transaction('group-metadata', 'readonly');
                                        const stMeta = txMeta.objectStore('group-metadata');
                                        const curMeta = stMeta.openCursor();
                                        curMeta.onsuccess = (ev) => {
                                            const cMeta = ev.target.result;
                                            if (cMeta) {
                                                const v = cMeta.value;
                                                const idM = typeof v.id === 'string' ? v.id : (v.id && v.id._serialized ? v.id._serialized : '');
                                                if (idM) metadataMap.set(idM, v);
                                                cMeta.continue();
                                            } else {
                                                resMeta();
                                            }
                                        };
                                        curMeta.onerror = () => resMeta();
                                    });
                                } catch (eMeta) {}
                            }

                            // Mapa de contactos si el store existe en IDB
                            const contactMap = new Map();
                            if (db.objectStoreNames.contains('contact')) {
                                try {
                                    await new Promise((resCont) => {
                                        const txCont = db.transaction('contact', 'readonly');
                                        const stCont = txCont.objectStore('contact');
                                        const curCont = stCont.openCursor();
                                        curCont.onsuccess = (ev) => {
                                            const cCont = ev.target.result;
                                            if (cCont) {
                                                const v = cCont.value;
                                                const idC = typeof v.id === 'string' ? v.id : (v.id && v.id._serialized ? v.id._serialized : '');
                                                if (idC) contactMap.set(idC, v);
                                                cCont.continue();
                                            } else {
                                                resCont();
                                            }
                                        };
                                        curCont.onerror = () => resCont();
                                    });
                                } catch (eCont) {}
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
                                        if ((!nom || !nom.trim()) && metadataMap.has(id)) {
                                            const meta = metadataMap.get(id);
                                            nom = meta.subject;
                                        }
                                        if ((!nom || !nom.trim()) && contactMap.has(id)) {
                                            const cont = contactMap.get(id);
                                            nom = cont.name || cont.formattedName;
                                        }
                                        if (!nom || !nom.trim()) {
                                            let detalle = '';
                                            if (metadataMap.has(id)) {
                                                const meta = metadataMap.get(id);
                                                if (meta.desc && meta.desc.trim()) {
                                                    detalle = `Desc: "${meta.desc.trim().slice(0, 30)}..."`;
                                                } else if (meta.owner) {
                                                    const own = typeof meta.owner === 'string' ? meta.owner : (meta.owner.user || meta.owner._serialized || '');
                                                    detalle = `Creador: +${own.split('@')[0]}`;
                                                }
                                            }
                                            nom = detalle ? `[Sin asunto - ${detalle}]` : `[Sin asunto - ID: ${id.replace('@g.us', '')}]`;
                                        }
                                        lista.push({
                                            id: id,
                                            nombre: nom.trim()
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
                    break;
                } else {
                    await new Promise(r => setTimeout(r, 3000));
                }
            } catch (errIDB) {
                const msg = errIDB?.message || String(errIDB);
                if (msg.includes('Execution context was destroyed')) {
                    console.log(`⏳ Sincronizando almacenamiento local... reintentando en 3s`);
                } else {
                    console.log(`ℹ️ IndexedDB reintento ${intentoIdb}: ${msg}`);
                }
                await new Promise(r => setTimeout(r, 3000));
            }
        }
    }

    if (!grupos || grupos.length === 0) {
        console.log('\n⚠️ No se encontraron grupos en esta cuenta o la sincronización tardó demasiado.');
        console.log('💡 CONSEJOS:');
        console.log('   1. Asegúrate de que esta cuenta pertenezca al menos a 1 grupo en WhatsApp.');
        console.log('   2. Verifica que tu teléfono móvil tenga internet activo.');
        console.log('   3. Vuelve a ejecutar extraer_grupos.bat (la sesión ya está guardada y abrirá más rápido).');
        try {
            cliente.removeAllListeners();
            const proc = cliente.pupBrowser ? cliente.pupBrowser.process() : null;
            if (proc && proc.pid) {
                try {
                    require('child_process').execSync(`taskkill /pid ${proc.pid} /T /F >nul 2>&1`);
                } catch (eKill) {}
            }
            await cliente.destroy().catch(() => {});
        } catch (e) {}
        process.exit(0);
    }

    // --- DEDUPLICAR Y FILTRAR ---
    const mapaUnicos = new Map();
    for (const g of grupos) {
        if (!mapaUnicos.has(g.id)) {
            mapaUnicos.set(g.id, g);
        }
    }
    const listaUnica = Array.from(mapaUnicos.values());

    // --- VERIFICACIÓN PROFUNDA DE NOMBRES EN NODE.JS ---
    const gruposSinNombre = listaUnica.filter(g => !g.nombre || g.nombre === '(sin nombre)' || g.nombre.startsWith('[Sin asunto - ID:'));
    if (gruposSinNombre.length > 0) {
        console.log(`\n🔍 Consultando API de WhatsApp para ${gruposSinNombre.length} grupo(s) con nombre pendiente...`);
        for (const g of gruposSinNombre) {
            try {
                const chatNode = await Promise.race([
                    cliente.getChatById(g.id),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4500))
                ]);
                if (chatNode) {
                    if (chatNode.name && chatNode.name.trim() && chatNode.name !== '(sin nombre)') {
                        g.nombre = chatNode.name.trim();
                        console.log(`   ✨ Nombre resuelto: "${g.nombre}" (${g.id})`);
                    } else if (chatNode.groupMetadata && chatNode.groupMetadata.subject && chatNode.groupMetadata.subject.trim()) {
                        g.nombre = chatNode.groupMetadata.subject.trim();
                        console.log(`   ✨ Nombre resuelto (Metadata): "${g.nombre}" (${g.id})`);
                    } else if (chatNode.groupMetadata && chatNode.groupMetadata.desc && chatNode.groupMetadata.desc.trim()) {
                        const descSnip = chatNode.groupMetadata.desc.trim().replace(/[\r\n]+/g, ' ').slice(0, 35);
                        g.nombre = `[Sin asunto - Desc: "${descSnip}..."]`;
                        console.log(`   📝 Identificado por descripción: "${g.nombre}" (${g.id})`);
                    }
                }
            } catch (eNode) {}
        }
    }

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

    // 1. Guardar en config/grupos.json (fuente centralizada de verdad)
    const configDir = path.join(__dirname, 'config');
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    const rutaGruposJson = path.join(configDir, 'grupos.json');

    let estadosPrevios = new Map();
    try {
        if (fs.existsSync(rutaGruposJson)) {
            const previos = JSON.parse(fs.readFileSync(rutaGruposJson, 'utf8'));
            previos.forEach(p => {
                if (p.id) estadosPrevios.set(p.id, p.activo !== false);
            });
        }
    } catch(e) {}

    const listaParaJson = gruposFiltrados.map(g => ({
        id: g.id,
        nombre: g.nombre,
        activo: estadosPrevios.has(g.id) ? estadosPrevios.get(g.id) : true
    }));

    fs.writeFileSync(rutaGruposJson, JSON.stringify(listaParaJson, null, 2), 'utf8');

    // 2. Guardar en mis_grupos.txt (compatibilidad)
    let textoParaArchivo = `// =====================================================\n`;
    textoParaArchivo += `// Grupos extraídos el ${new Date().toLocaleString('es-MX')}\n`;
    textoParaArchivo += `// Total encontrados: ${listaUnica.length} | Ignorados: ${ignorados} | Incluidos: ${gruposFiltrados.length}\n`;
    textoParaArchivo += `// NOTA: Ya no necesitas copiar y pegar este archivo en bot.js;\n`;
    textoParaArchivo += `// el bot ahora lee directamente 'config/grupos.json'.\n`;
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
    console.log(`🎉 ¡ÉXITO! Archivos actualizados:`);
    console.log(`   📂 ${rutaGruposJson} (Leído automáticamente por bot.js)`);
    console.log(`   📄 ${rutaArchivo} (Copia de respaldo)`);
    console.log(`   ✅ Grupos activos listos: ${listaParaJson.filter(g => g.activo).length}`);
    console.log(`   💡 Ya NO necesitas copiar ni pegar nada a mano.`);
    console.log(`=================================================\n`);

    try {
        cliente.removeAllListeners();
        const proc = cliente.pupBrowser ? cliente.pupBrowser.process() : null;
        if (proc && proc.pid) {
            try {
                require('child_process').execSync(`taskkill /pid ${proc.pid} /T /F >nul 2>&1`);
            } catch (eKill) {}
        }
        await cliente.destroy().catch(() => {});
    } catch (e) {}
    process.exit(0);
});

    cli.on('disconnected', async (razon) => {
        if (razon === 'LOGOUT') {
            console.log('\n⚠️ La sesión anterior de WhatsApp fue cerrada o desvinculada desde el teléfono.');
            console.log('🧹 Limpiando archivos de sesión expirados...');
            try {
                cli.removeAllListeners();
                const proc = cli.pupBrowser ? cli.pupBrowser.process() : null;
                if (proc && proc.pid) {
                    try {
                        require('child_process').execSync(`taskkill /pid ${proc.pid} /T /F >nul 2>&1`);
                    } catch (eKill) {}
                }
                await cli.destroy().catch(() => {});
            } catch (e) {}

            eliminarSesionCorrupta();

            console.log('🔄 Reiniciando WhatsApp para mostrar un nuevo código QR limpio...\n');
            await new Promise(r => setTimeout(r, 2000));
            cliente = crearCliente();
            registrarEventos(cliente);
            cliente.initialize().catch(() => {});
            return;
        }

        console.log('❌ Desconectado de WhatsApp:', razon);
        process.exit(1);
    });
}

// Manejo de cierres limpios
process.on('SIGINT', async () => {
    console.log('\n🛑 Cancelando extracción...');
    try {
        if (cliente) {
            cliente.removeAllListeners();
            const proc = cliente.pupBrowser ? cliente.pupBrowser.process() : null;
            if (proc && proc.pid) {
                try {
                    require('child_process').execSync(`taskkill /pid ${proc.pid} /T /F >nul 2>&1`);
                } catch (eKill) {}
            }
            await cliente.destroy().catch(() => {});
        }
    } catch (e) {}
    process.exit(0);
});

(async () => {
    await asegurarConexionInternet();
    console.log('🚀 Iniciando cliente de WhatsApp en segundo plano...');
    cliente = crearCliente();
    registrarEventos(cliente);
    cliente.initialize().catch((err) => {
        console.error('\n❌ No se pudo iniciar el navegador de WhatsApp Web:', err.message);
        if (err.message.includes('Failed to launch the browser process') || err.message.includes('4294967295')) {
            console.log('\n💡 CAUSA:');
            console.log('   Otro proceso (como "iniciar.bat" o un Chrome fantasma) tiene bloqueada la sesión.');
            console.log('\n🔧 SOLUCIÓN:');
            console.log('   1. Si tienes "iniciar.bat" abierto en otra ventana, ciérralo antes de extraer grupos.');
            console.log('   2. Si el bot ya está cerrado, ejecuta "limpiar_chrome.bat" para liberar los bloqueos.');
        }
        process.exit(1);
    });
})();
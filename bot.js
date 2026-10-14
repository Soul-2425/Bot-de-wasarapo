// ================================================================
// 🤖 BOT DE WHATSAPP - VERSIÓN MODULAR Y ULTRA-OPTIMIZADA
// ================================================================
// 1. Detección automática del navegador (navegador.js)
// 2. Interceptor de red para reducir consumo de RAM (src/interceptor.js)
// 3. Motor Anti-Ban: esperas orgánicas, spintax y descansos (src/antiBan.js)
// 4. Configuración desacoplada en JSON (config/config.json y config/grupos.json)
// 5. Pre-caché de multimedia en memoria para eliminar I/O repetitivo
// 6. Simulación de presencia humana ("escribiendo...")
// 7. Auto-Recovery con estado.json y supervisor iniciar.bat
// 8. Visualización elegante con tarjetas, banners y espaciado claro
// ================================================================

const v8 = require('v8');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const { obtenerRutaNavegador } = require('./navegador');
const { activarOptimizacionDeRecursos } = require('./src/interceptor');
const { prepararEntornoSesion, eliminarSesionCorrupta } = require('./src/limpiadorSesion');
const { generarMediaPolimorfica } = require('./src/generadorMultimedia');

prepararEntornoSesion('bot.js');
const {
    limpiarTextoFuerte,
    procesarSpintax,
    calcularEsperaOrganica,
    obtenerDescansoEscalonado,
    inyectarEntropiaInvisible,
    calcularTiempoTipeoHumano,
    calcularPausaLecturaHumana
} = require('./src/antiBan');
const logger = require('./src/logger');

// ================================================================
// 🛡️ CONTROL DE MEMORIA Y PARÁMETROS
// ================================================================
const ramMB = Math.round(v8.getHeapStatistics().heap_size_limit / (1024 * 1024));

// ================================================================
// 📂 CARGA DE CONFIGURACIÓN Y GRUPOS
// ================================================================
const rutaConfig = path.join(__dirname, 'config', 'config.json');
let CONFIGURACION = {
    rutaImagen: path.join(__dirname, 'oferta.png'),
    tiempoEsperaMinSegundos: 15,
    tiempoEsperaMaxSegundos: 25,
    tiempoMaximoEnvioSegundos: 60,
    simularEscribiendo: true,
    tiempoEscrituraSegundos: 3,
    horasDeEsperaEntreCiclos: [0, 2, 2, 2],
    bloquearRecursosPesados: true,
    descansosEscalonados: {},
    textosPublicitarios: []
};

if (fs.existsSync(rutaConfig)) {
    try {
        const configJson = JSON.parse(fs.readFileSync(rutaConfig, 'utf8'));
        CONFIGURACION = { ...CONFIGURACION, ...configJson };
        if (!path.isAbsolute(CONFIGURACION.rutaImagen)) {
            CONFIGURACION.rutaImagen = path.join(__dirname, CONFIGURACION.rutaImagen);
        }
    } catch (e) {
        logger.warn(`Error al leer config/config.json, usando valores predeterminados: ${e.message}`);
    }
}

// Cargar grupos: PRIORIDAD TOTAL A mis_grupos.txt para respetar orden y ediciones manuales
let gruposDestino = [];
let fuenteGrupos = '';
const rutaMisGruposTxt = path.join(__dirname, 'mis_grupos.txt');
const rutaGruposJson = path.join(__dirname, 'config', 'grupos.json');

// 1. Prioridad: mis_grupos.txt (respeta exactamente el orden y los grupos que dejó el usuario)
if (fs.existsSync(rutaMisGruposTxt)) {
    try {
        const lineas = fs.readFileSync(rutaMisGruposTxt, 'utf8').split('\n');
        for (const l of lineas) {
            const limpia = l.trim();
            if (limpia.startsWith('"') || limpia.startsWith("'")) {
                const item = limpia.replace(/^["']/, '').replace(/["'],?$/, '');
                if (item.includes('|||')) {
                    gruposDestino.push(item);
                }
            }
        }
        if (gruposDestino.length > 0) {
            fuenteGrupos = 'mis_grupos.txt (Orden personalizado)';
            // Sincronizar config/grupos.json con la lista actualizada
            try {
                const listaJson = gruposDestino.map(g => {
                    const partes = g.split('|||');
                    return { id: partes[0], nombre: partes[1] || '', activo: true };
                });
                fs.writeFileSync(rutaGruposJson, JSON.stringify(listaJson, null, 2), 'utf8');
            } catch (eSync) {}
        }
    } catch (e) {
        logger.warn(`Error al leer mis_grupos.txt: ${e.message}`);
    }
}

// 2. Fallback secundario si mis_grupos.txt no estuviese
if (gruposDestino.length === 0 && fs.existsSync(rutaGruposJson)) {
    try {
        const listaGrupos = JSON.parse(fs.readFileSync(rutaGruposJson, 'utf8'));
        gruposDestino = listaGrupos
            .filter(g => g.activo !== false && g.id)
            .map(g => `${g.id}|||${g.nombre || ''}`);
        fuenteGrupos = 'config/grupos.json';
    } catch (e) {}
}

const rutaNavegador = obtenerRutaNavegador();

// 🎨 BANNER DE INICIO CLARO Y PROFESIONAL
logger.bannerInicio({
    ramMB,
    totalGrupos: gruposDestino.length,
    fuenteGrupos: fuenteGrupos || 'mis_grupos.txt',
    rutaImagen: CONFIGURACION.rutaImagen,
    totalTextos: CONFIGURACION.textosPublicitarios.length,
    tiempoMin: CONFIGURACION.tiempoEsperaMinSegundos,
    tiempoMax: CONFIGURACION.tiempoEsperaMaxSegundos,
    rutaNavegador: rutaNavegador || 'Predeterminado por Puppeteer'
});

// ================================================================
// 💾 GESTIÓN DE ESTADO (Auto-Recovery ante caídas) - ESCRITURA ATÓMICA
// ================================================================
const rutaEstado = path.join(__dirname, 'estado.json');
const rutaEstadoTmp = path.join(__dirname, 'estado.tmp.json');

function cargarEstado() {
    try {
        if (fs.existsSync(rutaEstado)) {
            return JSON.parse(fs.readFileSync(rutaEstado, 'utf8'));
        }
    } catch (e) {
        logger.warn('Error leyendo estado.json, se iniciará limpio.');
    }
    return { cicloIndex: 0, gruposProcesados: [] };
}

function guardarEstado(cicloIndex, gruposProcesadosSet) {
    try {
        // Escritura atómica: primero escribimos en un archivo temporal
        fs.writeFileSync(rutaEstadoTmp, JSON.stringify({
            cicloIndex: cicloIndex,
            gruposProcesados: Array.from(gruposProcesadosSet),
            timestamp: Date.now()
        }, null, 2));
        
        // Luego lo renombramos (esto es instantáneo y a prueba de apagones)
        fs.renameSync(rutaEstadoTmp, rutaEstado);
    } catch (e) {
        logger.error('Error guardando estado (Escritura Atómica):', e);
    }
}

function limpiarEstado() {
    try {
        if (fs.existsSync(rutaEstado)) fs.unlinkSync(rutaEstado);
        if (fs.existsSync(rutaEstadoTmp)) fs.unlinkSync(rutaEstadoTmp);
    } catch (e) {}
}

function esperar(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function preguntarAlUsuario(pregunta) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question(pregunta, (respuesta) => {
            rl.close();
            resolve(respuesta.trim().toLowerCase());
        });
    });
}

// ================================================================
// 🌐 CONFIGURACIÓN DEL CLIENTE WHATSAPP WEB
// ================================================================
let cliente = null;
let motorActivo = false;
let interceptorActivo = false;

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
        logger.warn('🌐 Sin conexión con web.whatsapp.com o fallo temporal de DNS.');
        logger.info('⏳ Esperando a que el servicio de internet se restablezca en tu equipo...');
        while (!conectividadOk) {
            await esperar(6000);
            conectividadOk = await verificarConexionInternet(6000);
        }
        logger.success('🌐 Conexión a internet restablecida correctamente.');
        await esperar(2000);
    }
}

function crearInstanciaCliente() {
    return new Client({
        authStrategy: new LocalAuth({
            dataPath: path.join(__dirname, '.wwebjs_auth')
        }),
        authTimeoutMs: 180000,
        qrMaxRetries: 5,
        takeoverOnConflict: true,
        takeoverTimeoutMs: 10000,
        webVersionCache: {
            type: 'local'
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
                '--disable-features=CalculateNativeWinOcclusion',
                '--disable-ipc-flooding-protection',
                '--disable-hang-monitor',
                '--disable-breakpad'
            ],
            timeout: 120000,
            protocolTimeout: 300000
        }
    });
}

async function iniciarNuevoCliente(maxIntentos = 3) {
    for (let intento = 1; intento <= maxIntentos; intento++) {
        try {
            await asegurarConexionInternet();

            logger.faseHeader(1, 'Autenticación y Conexión con WhatsApp', `Iniciando motor de WhatsApp y Chrome [Intento ${intento}/${maxIntentos}]`);
            if (cliente) {
                try { await cliente.destroy(); } catch (e) {}
                cliente = null;
            }
            prepararEntornoSesion('bot.js');
            await esperar(2000);

            const nuevoCliente = crearInstanciaCliente();
            let watchdogTimer = null;

            const readyPromise = new Promise((resolve, reject) => {
                const timeoutTimer = setTimeout(() => {
                    clearInterval(watchdogTimer);
                    reject(new Error('TIMEOUT_AUTENTICACION'));
                }, 180000);

                nuevoCliente.once('ready', () => {
                    clearTimeout(timeoutTimer);
                    clearInterval(watchdogTimer);
                    resolve();
                });

                nuevoCliente.once('auth_failure', (msg) => {
                    clearTimeout(timeoutTimer);
                    clearInterval(watchdogTimer);
                    reject(new Error('AUTH_FAILURE: ' + msg));
                });
            });

            let timerImprimirQR = null;
            let yaAutenticado = false;

            nuevoCliente.on('qr', (qrCode) => {
                if (yaAutenticado) return;
                const tieneSesionPrevia = fs.existsSync(path.join(__dirname, '.wwebjs_auth', 'session'));
                if (tieneSesionPrevia) {
                    if (timerImprimirQR) clearTimeout(timerImprimirQR);
                    timerImprimirQR = setTimeout(() => {
                        if (!yaAutenticado) {
                            console.log('\n📱 Escanea este código QR con tu WhatsApp:');
                            qrcode.generate(qrCode, { small: true });
                        }
                    }, 2500);
                } else {
                    console.log('\n📱 Escanea este código QR con tu WhatsApp:');
                    qrcode.generate(qrCode, { small: true });
                }
            });

            nuevoCliente.on('authenticated', () => {
                yaAutenticado = true;
                if (timerImprimirQR) clearTimeout(timerImprimirQR);
                console.clear();
                logger.bannerSesionActiva();
                logger.faseHeader(1, 'Autenticación y Conexión con WhatsApp', 'Conexión verificada con el teléfono, sincronizando historial...');
            });

            let ultimoPorcentaje = -1;
            nuevoCliente.on('loading_screen', async (percent, message) => {
                if (percent === 100) {
                    if (ultimoPorcentaje !== 100) {
                        logger.item('Sincronización', '100% completada', 'Historial listo en navegador');
                        ultimoPorcentaje = 100;
                    }
                    try {
                        if (nuevoCliente?.pupPage && !nuevoCliente.pupPage.isClosed()) {
                            await nuevoCliente.pupPage.evaluate(() => {
                                if (typeof window.onAppStateHasSyncedEvent === 'function') {
                                    window.onAppStateHasSyncedEvent();
                                }
                            }).catch(() => {});
                        }
                    } catch (e) {}
                    return;
                }

                if (percent >= ultimoPorcentaje + 20) {
                    logger.item('Sincronizando chats', `${percent}%`, 'Descargando datos del teléfono');
                    ultimoPorcentaje = percent;
                }
            });

            nuevoCliente.on('change_state', (state) => {
                logger.info(`📡 Estado de conexión: ${state}`);
            });

            nuevoCliente.on('disconnected', async (razon) => {
                logger.error(`WhatsApp se ha desconectado. Razón: ${razon}`);
                if (razon === 'LOGOUT') {
                    logger.warn('Sesión cerrada o desvinculada desde el teléfono. Limpiando archivos de sesión expirados...');
                    try { await nuevoCliente.destroy(); } catch (e) {}
                    eliminarSesionCorrupta();
                    logger.info('Sesión limpia. Listo para nuevo inicio y código QR.');
                    process.exit(0);
                } else {
                    logger.info('Desconexión temporal detectada. El motor reanudará la sesión automáticamente.');
                }
            });

            // Centinela activo cada 3s: verifica si la interfaz ya cargó y despierta el evento ready si la librería se durmió
            watchdogTimer = setInterval(async () => {
                try {
                    if (nuevoCliente?.pupPage && !nuevoCliente.pupPage.isClosed()) {
                        const estado = await nuevoCliente.pupPage.evaluate(() => {
                            const pane = document.querySelector('#pane-side') || 
                                         document.querySelector('[data-testid="chat-list"]') || 
                                         document.querySelector('div[role="navigation"]');

                            const storeListo = !!(window.Store?.Chat || (window.require && window.require('WAWebCollections')?.Chat));

                            const txt = (document.body && document.body.innerText) ? document.body.innerText : '';
                            const desconectado = txt.includes('Asegúrate de que tu teléfono tenga una conexión a Internet activa') ||
                                                txt.includes('Teléfono sin conexión') ||
                                                txt.includes('Reconectando con tu teléfono');

                            return {
                                interfazLista: !!(pane || storeListo),
                                desconectado
                            };
                        });

                        if (estado.desconectado) {
                            logger.warn('📱 Tu celular parece no tener internet o WhatsApp está cerrado. Abre WhatsApp en tu teléfono.');
                        } else if (estado.interfazLista) {
                            await nuevoCliente.pupPage.evaluate(() => {
                                if (typeof window.onAppStateHasSyncedEvent === 'function') {
                                    window.onAppStateHasSyncedEvent();
                                }
                            }).catch(() => {});
                        }
                    }
                } catch (e) {}
            }, 3000);

            await nuevoCliente.initialize();
            await readyPromise;
            logger.item('Estado de sesión', '✅ Conectada y lista', 'Handshake completado');
            logger.faseFooter();

            // Blindaje de serialización multimedia
            try {
                await nuevoCliente.pupPage.evaluate(() => {
                    if (window.WWebJS) {
                        const origGetMessageModel = window.WWebJS.getMessageModel;
                        window.WWebJS.getMessageModel = function(message) {
                            try {
                                return origGetMessageModel ? origGetMessageModel(message) : message;
                            } catch (e) {
                                return {
                                    id: message?.id ? (message.id._serialized ? message.id : { _serialized: String(message.id) }) : { _serialized: 'msg_' + Date.now() },
                                    body: message?.caption || message?.body || '',
                                    type: message?.type || 'chat'
                                };
                            }
                        };
                    }
                });
            } catch (e) {}

            // Blindaje Stealth de Puppeteer contra detección de automatización
            if (CONFIGURACION.evasionStealthPuppeteer !== false) {
                try {
                    await nuevoCliente.pupPage.evaluate(() => {
                        try {
                            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                            window.chrome = window.chrome || { runtime: {} };
                        } catch (eStealth) {}
                    });
                } catch (e) {}
            }

            // Activar optimizador de red si está configurado
            if (CONFIGURACION.bloquearRecursosPesados !== false) {
                try {
                    await activarOptimizacionDeRecursos(nuevoCliente.pupPage);
                } catch (eOpt) {}
            }

            cliente = nuevoCliente;
            return nuevoCliente;
        } catch (err) {
            logger.error(`Error de arranque (intento ${intento}): ${err.message}`);
            try {
                if (cliente) await cliente.destroy();
            } catch (e) {}
            cliente = null;

            const msgLower = (err.message || '').toLowerCase();
            const esErrorDeRed = msgLower.includes('err_name_not_resolved') ||
                                 msgLower.includes('err_timed_out') ||
                                 msgLower.includes('err_internet_disconnected') ||
                                 msgLower.includes('err_network_changed') ||
                                 msgLower.includes('err_connection_reset') ||
                                 msgLower.includes('enotfound');

            if (esErrorDeRed) {
                logger.warn('🌐 Fallo o corte de red detectado al conectar con web.whatsapp.com.');
                await asegurarConexionInternet();
                intento--; // No penalizar el intento si fue una caída temporal de la red
                await esperar(3000);
                continue;
            }

            if (err.message === 'TIMEOUT_AUTENTICACION') {
                logger.warn('⚠️ La sesión guardada tardó más de 3 minutos sin responder (sesión desincronizada o teléfono inaccesible).');
                if (intento < maxIntentos) {
                    logger.info('🧹 Limpiando archivos de sesión guardados para generar un nuevo código QR limpio en el siguiente intento...');
                    eliminarSesionCorrupta();
                }
            }

            if (intento < maxIntentos) {
                await esperar(5000);
            } else {
                throw err;
            }
        }
    }
}

// ================================================================
// 🗂️ CONSULTA SEGURA DE CHATS (Memoria viva + IndexedDB)
// ================================================================
async function obtenerChatsSeguro(clienteBase, intentos = 3) {
    if (!clienteBase || !clienteBase.pupPage) {
        logger.info(`Utilizando lista directa de grupos (${gruposDestino.length} grupos configurados)...`);
        return gruposDestino.map(linea => {
            let id = linea, nombre = linea;
            if (linea.includes('|||')) {
                const p = linea.split('|||');
                id = p[0];
                nombre = p[1];
            }
            return { id: { _serialized: id }, name: nombre, isGroup: true, isReadOnly: false };
        });
    }
    try {
        logger.info(`Sincronizando grupos en memoria viva de WhatsApp...`);
        const gruposMemoria = await clienteBase.pupPage.evaluate(() => {
            try {
                let chatsRaw = [];
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
                if (!chatsRaw || chatsRaw.length === 0) {
                    if (window.Store && window.Store.Chat) {
                        if (typeof window.Store.Chat.getModelsArray === 'function') {
                            chatsRaw = window.Store.Chat.getModelsArray();
                        } else if (Array.isArray(window.Store.Chat.models)) {
                            chatsRaw = window.Store.Chat.models;
                        }
                    }
                }
                if (chatsRaw && chatsRaw.length > 0) {
                    const collections = window.require ? window.require('WAWebCollections') : null;
                    const GroupCol = collections?.GroupMetadata || collections?.WAWebGroupMetadataCollection || window.Store?.GroupMetadata;
                    const sanitizarTexto = (v) => {
                        if (!v) return '';
                        if (typeof v === 'string') return v.trim();
                        if (typeof v === 'object' && v !== null) {
                            const val = v.formattedTitle || v.name || v.title || v.subject || v.displayName;
                            if (typeof val === 'string') return val.trim();
                        }
                        return '';
                    };

                    return chatsRaw
                        .filter(c => c && (c.isGroup || (c.id && (c.id._serialized || String(c.id)).includes('@g.us'))))
                        .map(c => {
                            const idStr = c.id && c.id._serialized ? c.id._serialized : String(c.id);
                            let nom = sanitizarTexto(c.name) || sanitizarTexto(c.formattedTitle) || sanitizarTexto(c.title) || sanitizarTexto(c.displayName) || '';
                            if (!nom && c.groupMetadata && c.groupMetadata.subject) {
                                nom = sanitizarTexto(c.groupMetadata.subject);
                            }
                            if (!nom && GroupCol) {
                                try {
                                    const gm = GroupCol.get(c.id);
                                    if (gm && gm.subject) nom = sanitizarTexto(gm.subject);
                                } catch (eGm) {}
                            }
                            if (!nom && ContactCol) {
                                try {
                                    const ct = ContactCol.get(c.id);
                                    if (ct) nom = sanitizarTexto(ct.name) || sanitizarTexto(ct.formattedName);
                                } catch (eCt) {}
                            }
                            return {
                                id: { _serialized: idStr },
                                name: typeof nom === 'string' ? nom : '',
                                isGroup: true,
                                isReadOnly: Boolean(c.isReadOnly)
                            };
                        });
                }
            } catch (e) {}
            return null;
        });

        if (gruposMemoria && gruposMemoria.length > 0) {
            return gruposMemoria;
        }
    } catch (e) {}

    // Intentar una lectura de IndexedDB si la memoria viva aún no ha hidratado
    try {
        const grupos = await Promise.race([
            clienteBase.pupPage.evaluate(async () => {
                return new Promise((resolve) => {
                    const timer = setTimeout(() => resolve(null), 3500);
                    try {
                        const req = indexedDB.open('model-storage');
                        req.onerror = () => { clearTimeout(timer); resolve(null); };
                        req.onsuccess = (evt) => {
                            const db = evt.target.result;
                            try {
                                if (!db.objectStoreNames.contains('chat')) {
                                    clearTimeout(timer); db.close(); resolve(null);
                                    return;
                                }
                                const tx = db.transaction('chat', 'readonly');
                                const store = tx.objectStore('chat');
                                const soloGrupos = [];
                                const cursorReq = store.openCursor();
                                cursorReq.onsuccess = (e) => {
                                    const cursor = e.target.result;
                                    if (cursor) {
                                        const c = cursor.value;
                                        const id = typeof c.id === 'string' ? c.id : (c.id && c.id._serialized ? c.id._serialized : '');
                                        if (id.includes('@g.us')) {
                                            let nom = '';
                                            if (typeof c.name === 'string') nom = c.name;
                                            else if (typeof c.formattedTitle === 'string') nom = c.formattedTitle;
                                            else if (typeof c.displayName === 'string') nom = c.displayName;
                                            else if (c.name && typeof c.name === 'object') {
                                                nom = c.name.formattedTitle || c.name.name || '';
                                            }
                                            if (typeof nom !== 'string') nom = '';
                                            soloGrupos.push({
                                                id: { _serialized: id },
                                                name: nom.trim(),
                                                isGroup: true,
                                                isReadOnly: Boolean(c.isReadOnly)
                                            });
                                        }
                                        cursor.continue();
                                    } else {
                                        clearTimeout(timer); db.close(); resolve(soloGrupos);
                                    }
                                };
                                cursorReq.onerror = () => { clearTimeout(timer); db.close(); resolve(null); };
                            } catch (txErr) {
                                clearTimeout(timer); db.close(); resolve(null);
                            }
                        };
                    } catch (openErr) {
                        clearTimeout(timer); resolve(null);
                    }
                });
            }),
            new Promise((resolve) => setTimeout(() => resolve(null), 4000))
        ]);

        if (grupos && grupos.length > 0) {
            return grupos;
        }
    } catch (error) {}

    return gruposDestino.map(linea => {
        let id = linea, nombre = linea;
        if (linea.includes('|||')) {
            const p = linea.split('|||');
            id = p[0];
            nombre = p[1];
        }
        return { id: { _serialized: id }, name: nombre, isGroup: true, isReadOnly: false };
    });
}

// ================================================================
// 🚀 MOTOR PRINCIPAL DE ENVÍOS
// ================================================================
async function iniciarMotorDeEnvios() {
    let continuarTrabajando = true;
    let contadorVueltasGlobales = 1;

    // FASE 2: PREPARACIÓN DE RECURSOS Y BLINDAJES ANTI-BAN
    logger.faseHeader(2, 'Preparación de Recursos y Blindajes Anti-Ban', 'Configuración de imagen, spintax y algoritmos de evasión');

    logger.item('Estabilización', 'En curso (10s)...', 'Asentando sesión de WhatsApp');
    await esperar(10000);
    logger.item('Estabilización', '✅ Completada', 'Sesión asentada');

    // Verificación de imagen publicitaria (Escudo Polimórfico)
    let imagenMultimediaCache = null;
    try {
        if (!fs.existsSync(CONFIGURACION.rutaImagen)) {
            throw new Error(`Archivo no encontrado: ${CONFIGURACION.rutaImagen}`);
        }
        if (CONFIGURACION.polimorfismoImagen !== false) {
            generarMediaPolimorfica(CONFIGURACION.rutaImagen);
            logger.item('Multimedia', path.basename(CONFIGURACION.rutaImagen), 'Escudo Polimórfico: generará hashes únicos por grupo');
        } else {
            imagenMultimediaCache = MessageMedia.fromFilePath(CONFIGURACION.rutaImagen);
            logger.item('Multimedia', path.basename(CONFIGURACION.rutaImagen), 'Cargada en memoria RAM');
        }
    } catch (errImg) {
        logger.error('Error cargando imagen:', errImg);
        process.exit(1);
    }

    logger.item('Variantes de Texto', `${CONFIGURACION.textosPublicitarios.length} plantillas`, 'Spintax orgánico activo');
    logger.item('Micro-Entropía', CONFIGURACION.entropiaInvisibleTexto !== false ? '✅ Blindada' : 'Inactiva', 'Inyección de caracteres invisibles');
    logger.item('Simulación Tipeo', CONFIGURACION.simularEscribiendo ? '✅ Humana' : 'Inactiva', 'Tipeo orgánico proporcional');
    logger.faseFooter();

    // FASE 3: INDEXACIÓN DE GRUPOS DE DESTINO
    logger.faseHeader(3, 'Indexación de Grupos de Destino', 'Vinculando chats para la agenda de difusión');
    let soloGrupos = [];
    const diccionarioGrupos = new Map();

    async function actualizarDiccionarioGrupos() {
        try {
            const todosLosChats = await obtenerChatsSeguro(cliente, 3);
            soloGrupos = (todosLosChats || []).filter(chat => chat && chat.isGroup);
            diccionarioGrupos.clear();
            soloGrupos.forEach(g => {
                if (!g) return;
                if (g.id && g.id._serialized) diccionarioGrupos.set(g.id._serialized, g);
                let nombreStr = '';
                if (typeof g.name === 'string') {
                    nombreStr = g.name.trim();
                } else if (g.name && typeof g.name === 'object') {
                    nombreStr = (g.name.name || g.name.formattedTitle || '').trim();
                }
                if (nombreStr) {
                    diccionarioGrupos.set(nombreStr, g);
                    try {
                        if (typeof nombreStr.normalize === 'function') {
                            diccionarioGrupos.set(nombreStr.normalize('NFC'), g);
                        }
                    } catch (eNorm) {}
                    diccionarioGrupos.set(nombreStr.toLowerCase(), g);
                    const limpio = limpiarTextoFuerte(nombreStr);
                    if (limpio) diccionarioGrupos.set(limpio, g);
                }
            });
            logger.item('Agenda de grupos', `${gruposDestino.length} grupos configurados`, fuenteGrupos || 'mis_grupos.txt');
            logger.item('Referencias en RAM', `${diccionarioGrupos.size} grupos vinculados`, 'Mapeo activo');
        } catch (eSync) {
            logger.warn(`Aviso: sincronización de grupos falló, usando mapeo directo: ${eSync.message}`);
        }
    }

    await actualizarDiccionarioGrupos();
    logger.faseFooter();

    let estadoActual = cargarEstado();
    let indexCicloInicial = estadoActual.cicloIndex || 0;
    let reintentosCicloActual = 0;

    while (continuarTrabajando) {
        if (contadorVueltasGlobales > 1) {
            logger.info(`REINICIANDO VUELTA GLOBAL #${contadorVueltasGlobales}`);
        }

        for (let i = indexCicloInicial; i < CONFIGURACION.horasDeEsperaEntreCiclos.length; i++) {
            const horas = CONFIGURACION.horasDeEsperaEntreCiclos[i];
            const numeroDeCiclo = i + 1;

            if (horas > 0) {
                const totalMs = horas * 60 * 60 * 1000;
                const textoEspera = horas < 1 ? `${Math.round(horas * 60)} min` : `${horas} hrs`;

                // Calcular si ya transcurrió parte o la totalidad del reposo mientras el bot estuvo inactivo
                const tiempoYaTranscurrido = (estadoActual && estadoActual.cicloIndex === i && estadoActual.timestamp)
                    ? Math.max(0, Date.now() - estadoActual.timestamp)
                    : 0;

                const tiempoRestanteRealMs = Math.max(0, totalMs - tiempoYaTranscurrido);

                if (tiempoRestanteRealMs <= 0) {
                    logger.info(`⚡ El tiempo de reposo de ${textoEspera} ya fue cumplido previamente. Continuando con el Ciclo #${numeroDeCiclo} de inmediato...`);
                } else {
                    const horaReanudacion = new Date(Date.now() + tiempoRestanteRealMs)
                        .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const restanteMinutosInicial = Math.round(tiempoRestanteRealMs / 60000);
                    logger.bannerReposo({
                        textoEspera,
                        horaReanudacion,
                        minutosRestantes: restanteMinutosInicial,
                        cicloSiguiente: numeroDeCiclo
                    });
                    try {
                        await cliente.destroy();
                        cliente = null;
                    } catch (eDestroy) {}

                    if (!estadoActual || estadoActual.cicloIndex !== i || !estadoActual.timestamp) {
                        guardarEstado(i, new Set());
                    }

                    const inicioEspera = Date.now();
                    while (Date.now() - inicioEspera < tiempoRestanteRealMs) {
                        const pasoMs = Math.min(10 * 60 * 1000, tiempoRestanteRealMs - (Date.now() - inicioEspera));
                        await esperar(pasoMs);
                        const restanteMin = Math.round((tiempoRestanteRealMs - (Date.now() - inicioEspera)) / 60000);
                        if (restanteMin > 0) {
                            logger.info(`⏳ Reposo entre ciclos en curso: faltan aprox. ${restanteMin} minutos (Reanudación: ${horaReanudacion})`);
                        }
                    }

                    logger.info(`🔔 ¡Tiempo de reposo cumplido! Reconectando WhatsApp para el Ciclo #${numeroDeCiclo}...`);
                    await iniciarNuevoCliente();
                    await actualizarDiccionarioGrupos();
                }
            }

            const totalGrupos = gruposDestino.length;
            logger.inicioCiclo(numeroDeCiclo, CONFIGURACION.horasDeEsperaEntreCiclos.length, totalGrupos);

            try {
                const enviarConTimeout = (promesa, segundos = 60) => Promise.race([
                    promesa,
                    new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_ENVIO')), segundos * 1000))
                ]);

                let gruposConsecutivosFallidos = 0;
                const gruposEnviadosEnEsteCiclo = new Set();
                if (estadoActual && i === estadoActual.cicloIndex && estadoActual.gruposProcesados) {
                    estadoActual.gruposProcesados.forEach(g => gruposEnviadosEnEsteCiclo.add(g));
                    if (gruposEnviadosEnEsteCiclo.size > 0) {
                        logger.info(`🔄 Recuperación activa: Saltando ${gruposEnviadosEnEsteCiclo.size} grupos ya procesados en este ciclo.`);
                    }
                }

                let reporteExitosos = [], reporteSoloAdmin = [], reporteNoEncontrado = [];
                let enviosConsecutivos = 0, contadorGrupoActual = 0;

                for (let lineaGrupo of gruposDestino) {
                    contadorGrupoActual++;
                    try {
                        let idBuscado = null;
                        let nombreGrupoBuscado = lineaGrupo;

                        if (lineaGrupo.includes('|||')) {
                            const partes = lineaGrupo.split('|||');
                            idBuscado = partes[0];
                            nombreGrupoBuscado = partes[1];
                        }

                        let grupoEncontrado = idBuscado ? diccionarioGrupos.get(idBuscado) : null;
                        if (!grupoEncontrado) {
                            const nombreLimpioBuscado = limpiarTextoFuerte(nombreGrupoBuscado);
                            let normBuscado = '';
                            try {
                                if (typeof nombreGrupoBuscado === 'string' && typeof nombreGrupoBuscado.normalize === 'function') {
                                    normBuscado = nombreGrupoBuscado.normalize('NFC');
                                }
                            } catch (eNorm) {}

                            grupoEncontrado = diccionarioGrupos.get(nombreGrupoBuscado)
                                || (normBuscado ? diccionarioGrupos.get(normBuscado) : null)
                                || diccionarioGrupos.get(String(nombreGrupoBuscado || '').toLowerCase().trim())
                                || (nombreLimpioBuscado ? diccionarioGrupos.get(nombreLimpioBuscado) : null);

                            if (!grupoEncontrado && nombreLimpioBuscado && nombreLimpioBuscado.length > 3) {
                                grupoEncontrado = soloGrupos.find(g => {
                                    if (!g || !g.name) return false;
                                    const extraido = limpiarTextoFuerte(g.name);
                                    if (!extraido) return false;
                                    return extraido.includes(nombreLimpioBuscado) || nombreLimpioBuscado.includes(extraido);
                                });
                            }
                        }

                        const nombreGrupoStr = typeof grupoEncontrado?.name === 'string' ? grupoEncontrado.name.trim() : '';
                        if (grupoEncontrado && nombreGrupoStr !== '' && nombreGrupoStr !== '(sin nombre)') {
                            if (!nombreGrupoBuscado || nombreGrupoBuscado === '(sin nombre)' || String(nombreGrupoBuscado).trim() === '' || String(nombreGrupoBuscado).startsWith('[Sin asunto')) {
                                nombreGrupoBuscado = nombreGrupoStr;
                            }
                        }

                    if (!grupoEncontrado) {
                        if (idBuscado && idBuscado.includes('@g.us')) {
                            grupoEncontrado = {
                                id: { _serialized: idBuscado },
                                name: nombreGrupoBuscado,
                                isGroup: true,
                                isReadOnly: false
                            };
                        } else {
                            reporteNoEncontrado.push(nombreGrupoBuscado);
                            logger.grupoSaltado({
                                contador: contadorGrupoActual,
                                total: totalGrupos,
                                nombre: nombreGrupoBuscado,
                                motivo: 'No encontrado en la lista de chats de WhatsApp',
                                icono: '👻'
                            });
                            continue;
                        }
                    }

                    if (gruposEnviadosEnEsteCiclo.has(grupoEncontrado.id._serialized)) continue;

                    if (grupoEncontrado.isReadOnly) {
                        reporteSoloAdmin.push(nombreGrupoBuscado);
                        gruposEnviadosEnEsteCiclo.add(grupoEncontrado.id._serialized);
                        guardarEstado(i, gruposEnviadosEnEsteCiclo);
                        logger.grupoSaltado({
                            contador: contadorGrupoActual,
                            total: totalGrupos,
                            nombre: nombreGrupoBuscado,
                            motivo: 'Solo administradores pueden enviar mensajes',
                            icono: '🔒'
                        });
                        continue;
                    }

                    // Mensaje con Spintax y micro-entropía invisible
                    const plantillas = CONFIGURACION.textosPublicitarios;
                    const indicePlantilla = contadorGrupoActual % (plantillas.length || 1);
                    const plantillaBase = plantillas[indicePlantilla] || '';
                    let mensajeFinal = procesarSpintax(plantillaBase);
                    if (CONFIGURACION.entropiaInvisibleTexto !== false) {
                        mensajeFinal = inyectarEntropiaInvisible(mensajeFinal);
                    }

                    let envioExitoso = false;
                    let reintentosRestantes = 1;

                    while (!envioExitoso) {
                        try {
                            // Pausa previa de visualización del chat (humanización)
                            if (CONFIGURACION.pausaLecturaChat !== false) {
                                const msLectura = calcularPausaLecturaHumana();
                                await esperar(msLectura);
                            }

                            // Emulación sutil de actividad de ratón en el viewport
                            if (cliente?.pupPage?.mouse) {
                                try {
                                    const x = Math.floor(120 + Math.random() * 300);
                                    const y = Math.floor(150 + Math.random() * 250);
                                    await cliente.pupPage.mouse.move(x, y, { steps: 3 });
                                } catch (eMouse) {}
                            }

                            // Simulación humana proporcional ("escribiendo...")
                            let duracionTipeoSegundos = CONFIGURACION.tiempoEscrituraSegundos || 3;
                            if (CONFIGURACION.simularEscribiendo) {
                                try {
                                    const chatObj = await Promise.race([
                                        cliente.getChatById(grupoEncontrado.id._serialized),
                                        new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_TYPING')), 4000))
                                    ]);
                                    if (chatObj && typeof chatObj.sendStateTyping === 'function') {
                                        const duracionTipeoMs = CONFIGURACION.tipeoProporcional !== false
                                            ? calcularTiempoTipeoHumano(mensajeFinal.length, CONFIGURACION.tiempoEscrituraSegundos)
                                            : (CONFIGURACION.tiempoEscrituraSegundos || 3) * 1000;
                                        duracionTipeoSegundos = Math.round(duracionTipeoMs / 1000);

                                        await chatObj.sendStateTyping();
                                        await esperar(duracionTipeoMs);
                                        await chatObj.clearState();
                                        await esperar(300 + Math.floor(Math.random() * 400));
                                    }
                                } catch (eTyping) {}
                            }

                            // Selección de media polimórfica (hash único) o fallback en memoria
                            const mediaAEnviar = CONFIGURACION.polimorfismoImagen !== false
                                ? generarMediaPolimorfica(CONFIGURACION.rutaImagen)
                                : (imagenMultimediaCache || MessageMedia.fromFilePath(CONFIGURACION.rutaImagen));

                            // Envío con timeout y verificación de recepción en servidores de WhatsApp
                            const esperarConfirmacion = CONFIGURACION.esperarConfirmacionServidor !== false;
                            await enviarConTimeout(
                                cliente.sendMessage(grupoEncontrado.id._serialized, mediaAEnviar, { 
                                    caption: mensajeFinal,
                                    waitUntilMsgSent: esperarConfirmacion 
                                }),
                                CONFIGURACION.tiempoMaximoEnvioSegundos || 90
                            );

                            gruposEnviadosEnEsteCiclo.add(grupoEncontrado.id._serialized);
                            guardarEstado(i, gruposEnviadosEnEsteCiclo);
                            reporteExitosos.push(nombreGrupoBuscado);
                            enviosConsecutivos++;
                            gruposConsecutivosFallidos = 0;
                            envioExitoso = true;

                            // Calcular espera orgánica hacia el próximo grupo
                            const esperaMs = calcularEsperaOrganica(
                                CONFIGURACION.tiempoEsperaMinSegundos,
                                CONFIGURACION.tiempoEsperaMaxSegundos
                            );

                            // Mostrar tarjeta elegante con separación clara
                            logger.grupoCard({
                                contador: contadorGrupoActual,
                                total: totalGrupos,
                                nombre: nombreGrupoBuscado,
                                id: grupoEncontrado.id._serialized,
                                horaEnvio: logger.hora(),
                                esperaProxima: esperaMs,
                                simuloTipeo: CONFIGURACION.simularEscribiendo,
                                tiempoTipeo: duracionTipeoSegundos
                            });

                            // Esperar antes del próximo grupo
                            await esperar(esperaMs);

                        } catch (error) {
                            const msgError = String(error?.message || error || '');
                            const esTimeout = msgError.includes('TIMEOUT_ENVIO')
                                || msgError.includes('callFunctionOn timed out')
                                || msgError.includes('protocolTime');
                            const esFallaSesion = msgError === 't'
                                || msgError.includes(' t')
                                || msgError.includes('getChat')
                                || msgError.includes('Execution context was destroyed')
                                || msgError.includes('Session closed')
                                || msgError.includes('Target closed')
                                || msgError.includes('detached')
                                || msgError.includes('Protocol error')
                                || msgError.includes('auth timeout')
                                || msgError.includes('Evaluation failed');

                            if (reintentosRestantes > 0) {
                                logger.grupoFallo({
                                    contador: contadorGrupoActual,
                                    total: totalGrupos,
                                    nombre: nombreGrupoBuscado,
                                    error: msgError,
                                    reintentando: true
                                });
                                if (esFallaSesion) {
                                    logger.info('🔄 Detectada inestabilidad en WhatsApp Web, comprobando estado de la página...');
                                    const paginaViva = await cliente?.pupPage?.evaluate(() => true).catch(() => false);
                                    if (!paginaViva) {
                                        logger.warn('⚠️ La ventana de WhatsApp Web no responde. Reiniciando navegador automáticamente...');
                                        try {
                                            await iniciarNuevoCliente();
                                            await actualizarDiccionarioGrupos();
                                        } catch (eReboot) {
                                            logger.error('Error al reiniciar sesión en reintento:', eReboot.message);
                                        }
                                    }
                                }
                                await esperar(8000);
                                reintentosRestantes--;
                            } else {
                                logger.grupoFallo({
                                    contador: contadorGrupoActual,
                                    total: totalGrupos,
                                    nombre: nombreGrupoBuscado,
                                    error: msgError,
                                    reintentando: false
                                });
                                reporteNoEncontrado.push(nombreGrupoBuscado + (esTimeout ? ' [timeout]' : (esFallaSesion ? ' [desconexión]' : ' [error]')));

                                gruposConsecutivosFallidos++;

                                if (gruposConsecutivosFallidos >= 4) {
                                    logger.warn(`⚠️ Atención: Múltiples fallos consecutivos (${gruposConsecutivosFallidos} grupos fallados). Auto-recuperando sesión de WhatsApp en proceso...`);
                                    try {
                                        await iniciarNuevoCliente();
                                        await actualizarDiccionarioGrupos();
                                        gruposConsecutivosFallidos = 0;
                                    } catch (eAutoHeal) {
                                        logger.error('Error en auto-curación:', eAutoHeal.message);
                                    }
                                }
                                break;
                            }
                        }
                    }

                    // Pausas escalonadas anti-baneo
                    if (envioExitoso) {
                        const pausa = obtenerDescansoEscalonado(enviosConsecutivos, CONFIGURACION.descansosEscalonados);
                        if (pausa) {
                            let liberoRam = false;
                            if (pausa.segundos >= 60) {
                                try {
                                    await cliente.pupPage.evaluate(async () => {
                                        if (window.gc) window.gc();
                                    });
                                } catch (e) {}

                                if (typeof global.gc === 'function') {
                                    global.gc();
                                    liberoRam = true;
                                }
                            }

                            const horaFin = new Date(Date.now() + pausa.segundos * 1000)
                                .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

                            logger.pausaAntiBaneo({
                                descripcion: pausa.descripcion,
                                totalEnvios: enviosConsecutivos,
                                horaReanudacion: horaFin,
                                liberoRam
                            });

                            await esperar(pausa.segundos * 1000);
                        }
                    }
                } catch (errGrupo) {
                    logger.warn(`Error inesperado procesando grupo #${contadorGrupoActual} (${lineaGrupo}): ${errGrupo?.message || errGrupo}`);
                }
            }

            reintentosCicloActual = 0;
            await esperar(15000);
            limpiarEstado();
            estadoActual = { cicloIndex: i + 1, gruposProcesados: [] };

            const siguienteEspera = CONFIGURACION.horasDeEsperaEntreCiclos[i + 1];
            let msgSiguiente = '';
            if (siguienteEspera !== undefined) {
                const horaProximo = new Date(Date.now() + siguienteEspera * 60 * 60 * 1000)
                    .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
                msgSiguiente = siguienteEspera > 0
                    ? `Próximo ciclo en ${siguienteEspera} hrs → aprox. ${horaProximo}`
                    : `Próximo ciclo inicia de inmediato`;
            } else {
                msgSiguiente = 'Todos los ciclos completados.';
            }

            logger.reporteCiclo({
                numeroCiclo: numeroDeCiclo,
                total: totalGrupos,
                exitos: reporteExitosos.length,
                soloAdmin: reporteSoloAdmin.length,
                fallidos: reporteNoEncontrado.length,
                horaTermino: logger.hora(),
                proximoCicloMsg: msgSiguiente
            });

        } catch (errorCiclo) {
            logger.error('Error crítico durante el ciclo:', errorCiclo);
            reintentosCicloActual++;

            if (reintentosCicloActual <= 3) {
                logger.info(`Auto-recuperando ciclo en 15 segundos (Reintento ${reintentosCicloActual}/3 sin avanzar de ciclo)...`);
                await esperar(15000);
                try {
                    await iniciarNuevoCliente();
                    await actualizarDiccionarioGrupos();
                } catch (eRecCiclo) {
                    logger.error('Error al recuperar tras fallo de ciclo:', eRecCiclo.message);
                }
                i--; // Mantener en el mismo ciclo para no saltarlo ni ir a reposo de 2 horas en vano
                continue;
            } else {
                logger.error(`Ciclo #${numeroDeCiclo} falló tras 3 reintentos consecutivos. Continuando con la planificación...`);
                reintentosCicloActual = 0;
            }
        }
        }

        indexCicloInicial = 0;
        estadoActual = { cicloIndex: 0, gruposProcesados: [] };

        const respuesta = await preguntarAlUsuario('\n🔔 Todos los ciclos han concluido. ¿Reiniciar globalmente? (si/no): ');
        if (respuesta === 'si' || respuesta === 's') {
            contadorVueltasGlobales++;
        } else {
            continuarTrabajando = false;
        }
    }

    process.exit(0);
}

// ================================================================
// 🏁 ARRANQUE PRINCIPAL
// ================================================================
(async () => {
    try {
        if (!fs.existsSync(CONFIGURACION.rutaImagen)) {
            logger.error(`No se encontró la imagen publicitaria en: ${CONFIGURACION.rutaImagen}`);
            console.log('Por favor coloca el archivo de imagen especificado en config/config.json.');
            process.exit(1);
        }

        await iniciarNuevoCliente();
        await iniciarMotorDeEnvios();
    } catch (errFatal) {
        logger.error(`Error fatal al arrancar el bot: ${errFatal.message}`);
        process.exit(1);
    }
})();

process.on('unhandledRejection', (razon) => {
    const errorStr = (razon && razon.message) ? razon.message : String(razon || '');
    if (errorStr.includes('auth timeout') || errorStr.includes('Execution context was destroyed') || errorStr.includes('Protocol error')) {
        return;
    }
    logger.warn(`Error no manejado interceptado: ${errorStr}`);
});

process.on('uncaughtException', (err) => {
    const errorStr = err?.message || String(err || '');
    if (errorStr.includes('Execution context was destroyed') || errorStr.includes('Protocol error')) {
        return;
    }
    logger.error(`Excepción no capturada interceptada: ${errorStr}`);
});
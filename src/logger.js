// ================================================================
// 📝 SISTEMA DE LOGS Y FORMATO VISUAL PROFESIONAL
// ================================================================
const fs = require('fs');
const path = require('path');

const rutaLogsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(rutaLogsDir)) {
    fs.mkdirSync(rutaLogsDir, { recursive: true });
}

// Estilos y colores ANSI para terminal
const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m'
};

function obtenerFechaStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function hora() {
    return new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
}

function limpiarAnsi(texto) {
    if (typeof texto !== 'string') texto = String(texto);
    return texto.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function registrarEnArchivo(mensaje) {
    try {
        const rutaArchivo = path.join(rutaLogsDir, `bot-${obtenerFechaStr()}.log`);
        fs.appendFileSync(rutaArchivo, `[${hora()}] ${limpiarAnsi(mensaje)}\n`, 'utf8');
    } catch (e) {}
}

const logger = {
    hora,
    C,

    // Banner de inicio estructurado
    bannerInicio: (datos) => {
        const linea = '═'.repeat(78);
        console.log(`\n${C.cyan}${C.bold}${linea}${C.reset}`);
        console.log(`   ${C.green}${C.bold}🤖  BOT DE WHATSAPP PRO  •  PANEL DE CONTROL${C.reset}`);
        console.log(`${C.cyan}${linea}${C.reset}`);
        console.log(` ${C.bold}⚙️  PARÁMETROS DEL SISTEMA:${C.reset}`);
        console.log(`    ${C.cyan}• Memoria RAM:${C.reset}         ${datos.ramMB} MB ${C.dim}(Límite Node.js + GC optimizado)${C.reset}`);
        console.log(`    ${C.cyan}• Grupos Activos:${C.reset}     ${C.bold}${datos.totalGrupos}${C.reset} grupos ${C.dim}(${datos.fuenteGrupos || 'desde mis_grupos.txt'})${C.reset}`);
        console.log(`    ${C.cyan}• Publicidad:${C.reset}         ${path.basename(datos.rutaImagen)} ${C.dim}(polimórfica en memoria RAM)${C.reset}`);
        console.log(`    ${C.cyan}• Variantes Texto:${C.reset}    ${datos.totalTextos} plantillas ${C.dim}(Spintax dinámico + micro-entropía)${C.reset}`);
        console.log(`    ${C.cyan}• Tiempos de Envío:${C.reset}   ${datos.tiempoMin}s a ${datos.tiempoMax}s ${C.dim}(distribución orgánica Gaussiana)${C.reset}`);
        console.log(`    ${C.cyan}• Navegador Chrome:${C.reset}   ${datos.rutaNavegador}`);
        console.log(`    ${C.cyan}• Interceptor RAM:${C.reset}    ${C.green}Activo${C.reset} ${C.dim}(bloquea imágenes y videos de otros chats)${C.reset}`);
        console.log(`    ${C.cyan}• Escudo Anti-Ban:${C.reset}    ${C.green}Blindaje Máximo${C.reset} ${C.dim}(Hashes únicos + Tipeo humano + Stealth)${C.reset}`);
        console.log(`${C.cyan}${linea}${C.reset}\n`);

        registrarEnArchivo(`=== INICIO DE SESIÓN BOT DE WHATSAPP (Grupos: ${datos.totalGrupos}, RAM: ${datos.ramMB}MB) ===`);
    },

    // Encabezado de fase claramente delimitado
    faseHeader: (numero, titulo, descripcion = '') => {
        const linea = '─'.repeat(78);
        console.log(`\n${C.cyan}${C.bold}${linea}${C.reset}`);
        console.log(` ${C.cyan}${C.bold}🔹 FASE ${numero}: ${titulo.toUpperCase()}${C.reset}`);
        if (descripcion) {
            console.log(`    ${C.dim}${descripcion}${C.reset}`);
        }
        console.log(`${C.cyan}${linea}${C.reset}`);
        registrarEnArchivo(`--- FASE ${numero}: ${titulo} ---`);
    },

    faseFooter: () => {
        const linea = '─'.repeat(78);
        console.log(`${C.dim}${linea}${C.reset}\n`);
    },

    item: (etiqueta, valor, detalle = '') => {
        const etiquetaFormateada = etiqueta.padEnd(20, ' ');
        const textoDetalle = detalle ? ` ${C.dim}(${detalle})${C.reset}` : '';
        console.log(`    ${C.cyan}• ${etiquetaFormateada}${C.reset} ${valor}${textoDetalle}`);
        registrarEnArchivo(`  • ${etiqueta}: ${valor} ${detalle ? '(' + detalle + ')' : ''}`);
    },

    bannerSesionActiva: () => {
        const linea = '═'.repeat(78);
        console.log(`\n${C.green}${C.bold}${linea}${C.reset}`);
        console.log(`   ${C.bold}✅  ¡SESIÓN ACTIVA Y CONECTADA!${C.reset}`);
        console.log(`   ${C.dim}WhatsApp autenticado con éxito • No necesitas escanear ningún QR${C.reset}`);
        console.log(`${C.green}${C.bold}${linea}${C.reset}\n`);
    },

    bannerReposo: ({ textoEspera, horaReanudacion, minutosRestantes, cicloSiguiente }) => {
        const linea = '═'.repeat(78);
        console.log(`\n${C.yellow}${C.bold}${linea}${C.reset}`);
        console.log(`   ${C.bgYellow} 💤 REPOSO ENTRE CICLOS ACTIVADO (${textoEspera}) ${C.reset}`);
        console.log(`${C.yellow}${linea}${C.reset}`);
        console.log(`    ${C.cyan}• Siguiente ciclo:${C.reset}     ${C.bold}Ciclo #${cicloSiguiente}${C.reset}`);
        console.log(`    ${C.cyan}• Hora de reanudación:${C.reset} ${C.bold}${horaReanudacion}${C.reset}`);
        console.log(`    ${C.cyan}• Tiempo restante:${C.reset}     Aprox. ${minutosRestantes} minutos`);
        console.log(`    ${C.cyan}• Memoria RAM:${C.reset}         Navegador Chrome liberado para descanso limpio`);
        console.log(`    ${C.dim}• ¿Deseas saltar el reposo? Ejecuta 'reiniciar_ciclos.bat' para enviar ya.${C.reset}`);
        console.log(`${C.yellow}${C.bold}${linea}${C.reset}\n`);
        registrarEnArchivo(`[REPOSO] ${textoEspera} activo. Reanudación: ${horaReanudacion} (Ciclo #${cicloSiguiente})`);
    },

    // Notificación de inicio de ciclo
    inicioCiclo: (numeroCiclo, totalCiclos, totalGrupos) => {
        const sep = '═'.repeat(78);
        console.log(`\n${C.magenta}${C.bold}${sep}${C.reset}`);
        console.log(` ${C.bold}🚀 FASE DE EMISIÓN: INICIANDO CICLO #${numeroCiclo} DE ${totalCiclos}${C.reset}`);
        console.log(`    Agenda de envíos: ${C.bold}${totalGrupos} grupos${C.reset}  •  Hora: [${hora()}]`);
        console.log(`${C.magenta}${C.bold}${sep}${C.reset}\n`);
        registrarEnArchivo(`--- INICIO CICLO #${numeroCiclo} (${totalGrupos} grupos) ---`);
    },

    // Tarjeta individual de grupo enviado (con separación visual clara)
    grupoCard: ({ contador, total, nombre, id, horaEnvio, esperaProxima, simuloTipeo, tiempoTipeo }) => {
        const div = '─'.repeat(78);
        const porcentaje = Math.round((contador / total) * 100);

        console.log(`${C.dim}${div}${C.reset}`);
        console.log(` ${C.cyan}${C.bold}📦 GRUPO [${contador} / ${total}]${C.reset} ${C.dim}(${porcentaje}%)${C.reset}  »  ${C.bold}${nombre}${C.reset}`);
        if (id) {
            console.log(`    ${C.dim}• ID:${C.reset}         ${C.dim}${id}${C.reset}`);
        }
        if (simuloTipeo) {
            console.log(`    • Simulación: ✍️  ${C.dim}Tipeo humano completado (${tiempoTipeo}s)${C.reset}`);
        }
        console.log(`    • Resultado:  ${C.green}${C.bold}✅ Enviado con éxito (Imagen + Texto)${C.reset} ${C.dim}[${horaEnvio}]${C.reset}`);
        if (esperaProxima) {
            console.log(`    • Siguiente:  ⏳  ${C.yellow}Esperando ${(esperaProxima / 1000).toFixed(1)}s de descanso orgánico...${C.reset}`);
        }
        console.log(`${C.dim}${div}${C.reset}\n`);

        registrarEnArchivo(`[GRUPO ${contador}/${total}] ENVIADO: ${nombre} (${id})`);
    },

    // Grupo saltado (Solo admin o no encontrado)
    grupoSaltado: ({ contador, total, nombre, motivo, icono = '⚠️' }) => {
        const div = '┄'.repeat(78);
        console.log(`${C.dim}${div}${C.reset}`);
        console.log(` ${C.yellow}${C.bold}🔒 GRUPO [${contador} / ${total}]${C.reset}  »  ${nombre}`);
        console.log(`    • Estado:     ${icono}  ${C.yellow}${motivo}${C.reset}`);
        console.log(`${C.dim}${div}${C.reset}\n`);

        registrarEnArchivo(`[GRUPO ${contador}/${total}] SALTADO (${motivo}): ${nombre}`);
    },

    // Error en grupo
    grupoFallo: ({ contador, total, nombre, error, reintentando = false }) => {
        const div = '─'.repeat(78);
        console.log(`${C.red}${div}${C.reset}`);
        console.log(` ${C.red}${C.bold}❌ GRUPO [${contador} / ${total}]${C.reset}  »  ${nombre}`);
        console.log(`    • Falla:      ${C.red}${error}${C.reset}`);
        if (reintentando) {
            console.log(`    • Acción:     🔄 ${C.yellow}Reintentando en 15 segundos...${C.reset}`);
        } else {
            console.log(`    • Acción:     ⏭️  Grupo omitido definitivamente tras reintento.`);
        }
        console.log(`${C.red}${div}${C.reset}\n`);

        registrarEnArchivo(`[GRUPO ${contador}/${total}] ERROR: ${nombre} - ${error}`);
    },

    // Caja destacada de Pausa Anti-Baneo
    pausaAntiBaneo: ({ descripcion, totalEnvios, horaReanudacion, liberoRam = false }) => {
        const borde = '═'.repeat(78);
        console.log(`\n${C.yellow}${C.bold}${borde}${C.reset}`);
        console.log(`  ${C.bgYellow} 🛑 PAUSA ANTI-BANEO ACTIVA ${C.reset}  ${C.bold}${descripcion}${C.reset}`);
        console.log(`  ${C.dim}• Envíos completados en bloque:${C.reset} ${totalEnvios} grupos`);
        if (liberoRam) {
            console.log(`  ${C.green}• Limpieza de memoria:${C.reset}          ♻️  RAM liberada en Chrome y Node.js`);
        }
        console.log(`  ${C.yellow}• Reanudación programada a las:${C.reset}     ${C.bold}${horaReanudacion}${C.reset}`);
        console.log(`${C.yellow}${C.bold}${borde}${C.reset}\n`);

        registrarEnArchivo(`[PAUSA ANTI-BANEO] ${descripcion} tras ${totalEnvios} grupos. Reanuda: ${horaReanudacion}`);
    },

    // Reporte de cierre de ciclo
    reporteCiclo: ({ numeroCiclo, total, exitos, soloAdmin, fallidos, horaTermino, proximoCicloMsg }) => {
        const borde = '═'.repeat(78);
        console.log(`\n${C.cyan}${C.bold}${borde}${C.reset}`);
        console.log(`  ${C.bold}📈 REPORTE DIAGNÓSTICO FINAL • CICLO #${numeroCiclo}${C.reset}`);
        console.log(`  ${C.dim}Hora de término: ${horaTermino}${C.reset}`);
        console.log(`  ────────────────────────────────────────────────────────────────────────`);
        console.log(`  • Total agenda:        ${C.bold}${total}${C.reset} grupos`);
        console.log(`  • ✅ Envíos exitosos:   ${C.green}${C.bold}${exitos}${C.reset}`);
        console.log(`  • 🔒 Solo administradores: ${C.yellow}${soloAdmin}${C.reset}`);
        console.log(`  • ⚠️  No procesados:    ${fallidos > 0 ? C.red : C.dim}${fallidos}${C.reset}`);
        console.log(`  ────────────────────────────────────────────────────────────────────────`);
        console.log(`  • ⏭️  ${C.bold}${proximoCicloMsg}${C.reset}`);
        console.log(`${C.cyan}${C.bold}${borde}${C.reset}\n`);

        registrarEnArchivo(`[REPORTE CICLO #${numeroCiclo}] Total: ${total} | Éxitos: ${exitos} | SoloAdmin: ${soloAdmin} | Fallidos: ${fallidos}`);
    },

    // Métodos estándar
    info: (msg) => {
        console.log(` ${C.cyan}ℹ️${C.reset}  [${hora()}] ${msg}`);
        registrarEnArchivo(`INFO: ${msg}`);
    },
    success: (msg) => {
        console.log(` ${C.green}✅${C.reset} [${hora()}] ${msg}`);
        registrarEnArchivo(`SUCCESS: ${msg}`);
    },
    warn: (msg) => {
        console.log(` ${C.yellow}⚠️${C.reset}  [${hora()}] ${msg}`);
        registrarEnArchivo(`WARN: ${msg}`);
    },
    error: (msg, err = null) => {
        const detalle = err ? ` | Error: ${err.message || err}` : '';
        console.log(` ${C.red}❌${C.reset} [${hora()}] ${msg}${detalle}`);
        registrarEnArchivo(`ERROR: ${msg}${detalle}`);
    },
    raw: (msg) => {
        console.log(msg);
        registrarEnArchivo(msg);
    }
};

module.exports = logger;

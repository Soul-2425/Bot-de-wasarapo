// ================================================================
// 🛡️ MOTOR ANTI-BAN Y HUMANIZACIÓN DE COMPORTAMIENTO
// ================================================================

/**
 * Normaliza y limpia texto eliminando tildes, caracteres especiales y emojis para búsquedas
 */
function limpiarTextoFuerte(texto) {
    if (!texto) return '';
    let str = '';
    if (typeof texto === 'string') {
        str = texto;
    } else if (typeof texto === 'object' && texto !== null) {
        str = texto.formattedTitle || texto.name || texto.title || texto.subject || texto.displayName || '';
        if (typeof str !== 'string') {
            try {
                str = String(texto);
            } catch (e) {
                str = '';
            }
        }
    } else {
        str = String(texto);
    }

    if (!str || typeof str !== 'string') return '';

    try {
        if (typeof str.normalize === 'function') {
            return str.normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9]/g, '')
                .toLowerCase();
        }
        return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    } catch (e) {
        return '';
    }
}

/**
 * Procesa sintaxis Spintax del tipo: "{Hola|Buenos días} {amigo|compañero}"
 * Devuelve una combinación aleatoria en cada ejecución
 */
function procesarSpintax(texto) {
    if (!texto) return '';
    const spintaxRegex = /\{([^{}]+)\}/g;
    let resultado = texto;
    while (spintaxRegex.test(resultado)) {
        resultado = resultado.replace(spintaxRegex, (match, opcionesStr) => {
            const opciones = opcionesStr.split('|');
            return opciones[Math.floor(Math.random() * opciones.length)];
        });
    }
    return resultado;
}

/**
 * Calcula una espera estocástica (distribución normal/gaussiana Box-Muller)
 * Evita la cadencia robótica y fija de intervalos exactos
 */
function calcularEsperaOrganica(minSegundos = 15, maxSegundos = 25) {
    const media = (minSegundos + maxSegundos) / 2;
    const desviacion = (maxSegundos - minSegundos) / 4;
    
    // Transformación Box-Muller para distribución normal
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    
    // Valor resultante en milisegundos con límites seguros
    let segundos = media + z * desviacion;
    if (segundos < minSegundos) segundos = minSegundos + Math.random() * 2;
    if (segundos > maxSegundos + 5) segundos = maxSegundos + Math.random() * 2;
    
    return Math.round(segundos * 1000);
}

/**
 * Obtiene el descanso escalonado según la cantidad de envíos acumulados
 */
function obtenerDescansoEscalonado(totalEnvios, configDescansos) {
    if (totalEnvios <= 0) return null;

    if (totalEnvios % 100 === 0) {
        return configDescansos?.["100"] || { segundos: 600, descripcion: "10 minutos (Hito de 100 grupos)" };
    }
    if (totalEnvios % 50 === 0) {
        return configDescansos?.["50"] || { segundos: 300, descripcion: "5 minutos (Hito de 50 grupos)" };
    }

    const pos = totalEnvios % 50;
    if (pos === 40) {
        return configDescansos?.["40"] || { segundos: 240, descripcion: "4 minutos (Pausa tras 40 grupos)" };
    }
    if (pos === 20) {
        return configDescansos?.["20"] || { segundos: 120, descripcion: "2 minutos (Pausa tras 20 grupos)" };
    }
    if (pos === 10 || pos === 30) {
        return configDescansos?.[String(pos)] || { segundos: 60, descripcion: "1 minuto (Pausa tras 10 grupos)" };
    }
    if (pos % 5 === 0) {
        return configDescansos?.["5"] || { segundos: 30, descripcion: "30 segundos (Pausa tras 5 grupos)" };
    }

    return null;
}

/**
 * Inyecta micro-entropía con caracteres invisibles de ancho cero (Zero-Width Characters)
 * en límites de palabras aleatorios. Al ojo humano y en pantalla el texto se ve 100% idéntico,
 * pero los hashes de texto (MD5/SHA256) y firmas NLP de Meta son 100% únicos en cada envío.
 */
function inyectarEntropiaInvisible(texto) {
    if (!texto || typeof texto !== 'string') return '';
    const caracteresInvisibles = ['\u200B', '\u200C', '\u200D'];
    const palabras = texto.split(' ');
    if (palabras.length <= 1) return texto;

    // Seleccionar de 2 a 4 posiciones aleatorias para inyectar micro-entropía
    const totalInyecciones = Math.min(palabras.length - 1, Math.floor(Math.random() * 3) + 2);
    const indicesSeleccionados = new Set();
    while (indicesSeleccionados.size < totalInyecciones) {
        const idx = Math.floor(Math.random() * (palabras.length - 1));
        indicesSeleccionados.add(idx);
    }

    return palabras.map((palabra, idx) => {
        if (indicesSeleccionados.has(idx)) {
            const charInvisible = caracteresInvisibles[Math.floor(Math.random() * caracteresInvisibles.length)];
            return palabra + charInvisible;
        }
        return palabra;
    }).join(' ');
}

/**
 * Calcula un tiempo de simulación de tipeo proporcional y orgánico
 * basado en la longitud del mensaje (emula velocidad humana de ~40-50 WPM)
 */
function calcularTiempoTipeoHumano(longitudTexto = 200, tiempoBaseSegundos = 3) {
    const chars = Math.max(20, longitudTexto);
    // Base proporcional: ~1.2s por cada 100 caracteres + ruido aleatorio de 1s a 2.5s
    const msCalculados = Math.round((chars / 100) * 1200 + (Math.random() * 1500 + 1000));
    // Límites seguros: mínimo 2.5s, máximo 7.0s
    return Math.max(2500, Math.min(7000, msCalculados));
}

/**
 * Calcula una pausa natural simulando que el usuario observa el chat del grupo
 * antes de empezar a escribir (1.5s a 3.2s)
 */
function calcularPausaLecturaHumana() {
    return Math.round(1500 + Math.random() * 1700);
}

module.exports = {
    limpiarTextoFuerte,
    procesarSpintax,
    calcularEsperaOrganica,
    obtenerDescansoEscalonado,
    inyectarEntropiaInvisible,
    calcularTiempoTipeoHumano,
    calcularPausaLecturaHumana
};

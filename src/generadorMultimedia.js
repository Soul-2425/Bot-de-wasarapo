// ================================================================
// 🖼️ GENERADOR MULTIMEDIA POLIMÓRFICO (HASH ÚNICO POR ENVÍO)
// ================================================================
// Genera en memoria una versión criptográficamente única de cada imagen
// sin modificar su apariencia visual. Esto rompe la detección de spam
// basada en coincidencia de checksums (MD5/SHA256) en los servidores de Meta.
// ================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MessageMedia } = require('whatsapp-web.js');

// Tabla precalculada para CRC32 estándar (especificación PNG)
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
}

function calcularCRC32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = (crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Caché en memoria del archivo original en disco para evitar lecturas repetidas de I/O
let bufferBaseEnMemoria = null;
let rutaArchivoCacheada = null;

function cargarBufferOriginal(rutaArchivo) {
    if (!bufferBaseEnMemoria || rutaArchivoCacheada !== rutaArchivo) {
        bufferBaseEnMemoria = fs.readFileSync(rutaArchivo);
        rutaArchivoCacheada = rutaArchivo;
    }
    return bufferBaseEnMemoria;
}

/**
 * Inyecta un chunk auxiliar 'tEXt' válido según especificación PNG
 * inmediatamente antes del chunk terminal 'IEND'.
 */
function polimorfismoPNG(bufferOriginal) {
    const len = bufferOriginal.length;
    // Firma PNG mínima válida: 8 bytes firma + 12 bytes IEND = 20 bytes
    if (len < 20) return bufferOriginal;

    const randomPayload = `ab_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const keyword = 'Comment\0';
    const dataBuf = Buffer.concat([Buffer.from(keyword, 'binary'), Buffer.from(randomPayload, 'utf8')]);

    const typeBuf = Buffer.from('tEXt', 'ascii');
    const crcInput = Buffer.concat([typeBuf, dataBuf]);
    const chunkCrc = calcularCRC32(crcInput);

    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(dataBuf.length, 0);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(chunkCrc, 0);

    const nuevoChunk = Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);

    // Los últimos 12 bytes de un PNG siempre son el chunk IEND (0 0 0 0 'IEND' + CRC)
    const posIend = len - 12;
    return Buffer.concat([
        bufferOriginal.slice(0, posIend),
        nuevoChunk,
        bufferOriginal.slice(posIend)
    ]);
}

/**
 * Inyecta un marcador COM (0xFF 0xFE) en archivos JPEG/JPG
 */
function polimorfismoJPEG(bufferOriginal) {
    const len = bufferOriginal.length;
    if (len < 4) return bufferOriginal;

    // Verificar marcador SOI (0xFF 0xD8)
    if (bufferOriginal[0] === 0xFF && bufferOriginal[1] === 0xD8) {
        const randomPayload = `ab_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        const payloadBuf = Buffer.from(randomPayload, 'utf8');
        
        // Marcador COM: 0xFF 0xFE + Longitud (2 bytes big endian, incluye los 2 bytes de longitud)
        const comLength = payloadBuf.length + 2;
        const comHeader = Buffer.alloc(4);
        comHeader[0] = 0xFF;
        comHeader[1] = 0xFE;
        comHeader.writeUInt16BE(comLength, 2);

        const chunkCom = Buffer.concat([comHeader, payloadBuf]);

        // Insertar inmediatamente después de SOI (bytes 0 y 1)
        return Buffer.concat([
            bufferOriginal.slice(0, 2),
            chunkCom,
            bufferOriginal.slice(2)
        ]);
    }
    return bufferOriginal;
}

/**
 * Genera una instancia MessageMedia con hash único por cada llamada
 * sin escribir archivos en disco (100% en memoria RAM)
 */
function generarMediaPolimorfica(rutaArchivo) {
    try {
        const bufferOriginal = cargarBufferOriginal(rutaArchivo);
        const ext = path.extname(rutaArchivo).toLowerCase();
        let mimeType = 'image/png';
        let bufferVariado = bufferOriginal;

        if (ext === '.png') {
            mimeType = 'image/png';
            bufferVariado = polimorfismoPNG(bufferOriginal);
        } else if (ext === '.jpg' || ext === '.jpeg') {
            mimeType = 'image/jpeg';
            bufferVariado = polimorfismoJPEG(bufferOriginal);
        } else {
            // Para otros formatos, usar MessageMedia directo como fallback
            return MessageMedia.fromFilePath(rutaArchivo);
        }

        const base64Data = bufferVariado.toString('base64');
        const nombreArchivo = path.basename(rutaArchivo);
        return new MessageMedia(mimeType, base64Data, nombreArchivo);
    } catch (err) {
        // Fallback ultra-seguro ante cualquier imprevisto
        return MessageMedia.fromFilePath(rutaArchivo);
    }
}

module.exports = {
    generarMediaPolimorfica
};

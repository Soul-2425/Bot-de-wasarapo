// Script para aplicar el parche de compatibilidad multimedia (WhatsApp Web 2.3000+)
const fs = require('fs');
const path = require('path');

const rutaUtils = path.join(__dirname, 'node_modules', 'whatsapp-web.js', 'src', 'util', 'Injected', 'Utils.js');

if (!fs.existsSync(rutaUtils)) {
    console.log('⚠️ No se encontró whatsapp-web.js para parchar.');
    process.exit(0);
}

let code = fs.readFileSync(rutaUtils, 'utf8');
let patched = false;

// 1. Asegurar que processMediaData y sendMessage limpien __x_id e id
if (!code.includes('cleanMediaOptions')) {
    code = code.replace(
        /const message = \{[\s\S]*?\.\.\.extraOptions,[\s\S]*?\};/,
        `let cleanMediaOptions = {};
        if (mediaOptions) {
            cleanMediaOptions = {
                ...mediaOptions,
                ...(typeof mediaOptions.toJSON === 'function' ? mediaOptions.toJSON() : {}),
            };
            delete cleanMediaOptions.__x_id;
            delete cleanMediaOptions.id;
        }

        const message = {
            ...options,
            ack: 0,
            body: content,
            from: from,
            to: chat.id,
            local: true,
            self: 'out',
            t: parseInt(new Date().getTime() / 1000),
            isNewMsg: true,
            type: 'chat',
            ...ephemeralFields,
            ...cleanMediaOptions,
            id: newMsgKey,
            caption: options.caption || mediaOptions?.caption || cleanMediaOptions?.caption,
            ...quotedMsgOptions,
            ...locationOptions,
            ...pollOptions,
            ...eventOptions,
            ...vcardOptions,
            ...buttonOptions,
            ...listOptions,
            ...botOptions,
            ...extraOptions,
        };
        delete message.__x_id;`
    );
    patched = true;
}

if (!code.includes('delete mediaOptions.__x_id')) {
    code = code.replace(
        'mediaOptions.caption = options.caption;',
        `if (mediaOptions.set) {
                mediaOptions.set('caption', options.caption);
            }
            mediaOptions.caption = options.caption;
            delete mediaOptions.__x_id;
            delete mediaOptions.id;`
    );
    patched = true;
}

if (patched) {
    fs.writeFileSync(rutaUtils, code, 'utf8');
    console.log('✅ Parche multimedia aplicado correctamente a whatsapp-web.js.');
} else {
    console.log('✅ whatsapp-web.js ya cuenta con el parche multimedia.');
}

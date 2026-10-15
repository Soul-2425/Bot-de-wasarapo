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

// 3. Blindaje contra Error: t en serialización de mensajes
if (!code.includes('eSerialization')) {
    code = code.replace(
        `    window.WWebJS.getMessageModel = (message) => {
        const msg = message.serialize();`,
        `    window.WWebJS.getMessageModel = (message) => {
        if (!message) return null;
        try {
            const msg = typeof message.serialize === 'function' ? message.serialize() : message;`
    );
    code = code.replace(
        `        delete msg.pendingAckUpdate;

        return msg;
    };`,
        `        delete msg.pendingAckUpdate;

        return msg;
        } catch (eSerialization) {
            return {
                id: message?.id ? (message.id._serialized ? message.id : { _serialized: String(message.id) }) : { _serialized: 'msg_' + Date.now() },
                body: message?.caption || message?.body || '',
                type: message?.type || 'chat'
            };
        }
    };`
    );
    patched = true;
}

// 4. Blindaje contra Error: findChat: new chat not found
if (!code.includes('typeof chatCol.find === \'function\'')) {
    code = code.replace(
        /chat =\s*window\.require\('WAWebCollections'\)\.Chat\.get\(chatWid\)[\s\S]*?\)\?\.chat;/,
        `const chatCol = window.require('WAWebCollections').Chat;
            chat = chatCol.get(chatWid) || chatCol.get(chatId) || (chatWid?._serialized ? chatCol.get(chatWid._serialized) : null);
            if (!chat && Array.isArray(chatCol.models)) {
                chat = chatCol.models.find(m => {
                    const mId = m?.id?._serialized || String(m?.id || '');
                    return mId === chatId || (chatWid && mId === chatWid._serialized);
                });
            }
            if (!chat && typeof chatCol.find === 'function' && chatWid) {
                try {
                    chat = await chatCol.find(chatWid);
                } catch (eFind) {}
            }
            if (!chat && chatWid) {
                try {
                    const cmdModule = window.require ? window.require('WAWebCmd') : null;
                    const cmd = cmdModule?.Cmd || window.Store?.Cmd;
                    if (cmd && typeof cmd.openChatBottom === 'function') {
                        await cmd.openChatBottom({ chat: { id: chatWid } });
                        chat = chatCol.get(chatWid) || chatCol.get(chatId);
                    } else if (cmd && typeof cmd.openChatAt === 'function') {
                        await cmd.openChatAt(chatWid);
                        chat = chatCol.get(chatWid) || chatCol.get(chatId);
                    }
                } catch (eCmd) {}
            }
            if (!chat && !String(chatId).endsWith('@g.us')) {
                try {
                    const findAction = window.require('WAWebFindChatAction');
                    if (findAction?.findOrCreateLatestChat) {
                        chat = (await findAction.findOrCreateLatestChat(chatWid))?.chat;
                    }
                } catch (eFC) {}
            }`
    );
    patched = true;
}

if (patched) {
    fs.writeFileSync(rutaUtils, code, 'utf8');
    console.log('✅ Parche multimedia, de serialización y findChat aplicado correctamente a whatsapp-web.js.');
} else {
    console.log('✅ whatsapp-web.js ya cuenta con todos los parches necesarios.');
}

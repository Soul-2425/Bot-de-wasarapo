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
if (!code.includes('cleanMediaOptions.type')) {
    code = code.replace(
        /const message = \{[\s\S]*?\.\.\.extraOptions,[\s\S]*?\};|let cleanMediaOptions = \{[\s\S]*?delete message\.__x_id;/,
        `let cleanMediaOptions = {};
        if (mediaOptions && (Object.keys(mediaOptions).length > 0 || typeof mediaOptions.toJSON === 'function')) {
            const rawAttrs = typeof mediaOptions.toJSON === 'function'
                ? mediaOptions.toJSON()
                : (mediaOptions.attributes ? { ...mediaOptions.attributes } : { ...mediaOptions });
            const mediaTypeVal = mediaOptions.type
                || (typeof mediaOptions.get === 'function' ? mediaOptions.get('type') : null)
                || rawAttrs.type
                || (rawAttrs.mimetype?.startsWith('image/') ? 'image' : null)
                || 'image';

            cleanMediaOptions = {
                ...rawAttrs,
                type: mediaTypeVal,
                clientUrl: mediaOptions.clientUrl || rawAttrs.clientUrl,
                directPath: mediaOptions.directPath || rawAttrs.directPath,
                mediaKey: mediaOptions.mediaKey || rawAttrs.mediaKey,
                mediaKeyTimestamp: mediaOptions.mediaKeyTimestamp || rawAttrs.mediaKeyTimestamp,
                filehash: mediaOptions.filehash || rawAttrs.filehash,
                encFilehash: mediaOptions.encFilehash || rawAttrs.encFilehash,
                uploadhash: mediaOptions.uploadhash || rawAttrs.uploadhash,
                size: mediaOptions.size || rawAttrs.size,
                mimetype: mediaOptions.mimetype || rawAttrs.mimetype,
            };
            delete cleanMediaOptions.__x_id;
            delete cleanMediaOptions.id;
            delete cleanMediaOptions._events;
            delete cleanMediaOptions._eventsCount;
            delete cleanMediaOptions._listenId;
            delete cleanMediaOptions.cid;
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
            type: cleanMediaOptions.type || 'chat',
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
if (!code.includes('chatCol.getModelsArray')) {
    code = code.replace(
        /const chatCol = window\.require\('WAWebCollections'\)\.Chat;[\s\S]*?if \(!chat && !String\(chatId\)\.endsWith\('@g\.us'\)\) \{[\s\S]*?\} catch \(eFC\) \{\}\s*\}/,
        `const chatCol = window.require('WAWebCollections').Chat;
            chat = chatCol.get(chatWid) || chatCol.get(chatId) || (chatWid?._serialized ? chatCol.get(chatWid._serialized) : null);
            if (!chat) {
                const models = typeof chatCol.getModelsArray === 'function' 
                    ? chatCol.getModelsArray() 
                    : (Array.isArray(chatCol.models) ? chatCol.models : []);
                chat = models.find(m => {
                    const mId = m?.id?._serialized || m?.__x_id?._serialized || String(m?.id || '');
                    return mId === chatId || (chatWid && mId === chatWid._serialized);
                });
            }
            if (!chat && typeof chatCol.find === 'function' && chatWid) {
                try {
                    const found = await chatCol.find(chatWid);
                    chat = (found && found.chat) ? found.chat : (found || chatCol.get(chatWid) || chatCol.get(chatId));
                } catch (eFind) {}
            }
            if (!chat && chatWid) {
                try {
                    const cmdModule = window.require ? window.require('WAWebCmd') : null;
                    const cmd = cmdModule?.Cmd || window.Store?.Cmd;
                    if (cmd && typeof cmd.openChatBottom === 'function') {
                        const cObj = chatCol.get(chatWid) || chatCol.get(chatId) || { id: chatWid };
                        await cmd.openChatBottom({ chat: cObj });
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

// 5. Blindaje contra retorno undefined en sendMessage de WhatsApp Web
if (!code.includes('createdMsg || message')) {
    code = code.replace(
        /const \[msgPromise, sendMsgResultPromise\][\s\S]*?return window\s*\.require\('WAWebCollections'\)\s*\.Msg\.get\(newMsgKey[\s\S]*?\);/,
        `const [msgPromise, sendMsgResultPromise] = window
            .require('WAWebSendMsgChatAction')
            .addAndSendMsgToChat(chat, message);
        const createdMsg = await msgPromise;

        if (options.waitUntilMsgSent) await sendMsgResultPromise;

        const msgCol = window.require('WAWebCollections')?.Msg;
        const keySerialized = newMsgKey?._serialized || String(newMsgKey?.id || newMsgKey || '');
        return (msgCol?.get ? (msgCol.get(newMsgKey) || msgCol.get(keySerialized)) : null)
            || (chat?.msgs?.get ? (chat.msgs.get(newMsgKey) || chat.msgs.get(keySerialized)) : null)
            || createdMsg
            || message;`
    );
    patched = true;
}

if (patched) {
    fs.writeFileSync(rutaUtils, code, 'utf8');
    console.log('✅ Parche multimedia, de serialización y findChat aplicado correctamente a whatsapp-web.js.');
} else {
    console.log('✅ whatsapp-web.js ya cuenta con todos los parches necesarios.');
}

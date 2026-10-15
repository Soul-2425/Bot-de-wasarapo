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

// 4. Blindaje contra Error: findChat: new chat not found y soporte nativo Chat.find / IndexedDB cursor
if (!code.includes('TIMEOUT_FIND')) {
    code = code.replace(
        /window\.WWebJS\.getChat = async \(chatId, \{ getAsModel = true \} = \{\}\) => \{[\s\S]*?return getAsModel && chat[\s\S]*?: chat;\s*\};/,
        `window.WWebJS.getChat = async (chatId, { getAsModel = true } = {}) => {
        const isChannel = /@\\w*newsletter\\b/.test(chatId);
        const widFactory = window.require ? window.require('WAWebWidFactory') : null;
        let chatWid = null;
        if (widFactory) {
            try {
                chatWid = widFactory.createWid(chatId);
            } catch (eWid) {}
        }
        let chat;

        if (isChannel) {
            try {
                chat = window
                    .require('WAWebCollections')
                    .WAWebNewsletterCollection.get(chatId);
                if (!chat) {
                    await window
                        .require('WAWebLoadNewsletterPreviewChatAction')
                        .loadNewsletterPreviewChat(chatId);
                    chat = await window
                        .require('WAWebCollections')
                        .WAWebNewsletterCollection.find(chatWid || chatId);
                }
            } catch (ignoredError) {
                chat = null;
            }
        } else {
            const chatCol = (window.require ? window.require('WAWebCollections')?.Chat : null) || window.Store?.Chat;
            if (chatCol) {
                // 1. Búsqueda directa síncrona en memoria RAM
                chat = (chatWid && chatCol.get ? chatCol.get(chatWid) : null)
                    || (chatCol.get ? chatCol.get(chatId) : null)
                    || (chatWid?._serialized && chatCol.get ? chatCol.get(chatWid._serialized) : null);

                // 2. Búsqueda en array de modelos en memoria
                if (!chat) {
                    const models = typeof chatCol.getModelsArray === 'function' 
                        ? chatCol.getModelsArray() 
                        : (Array.isArray(chatCol.models) ? chatCol.models : []);
                    chat = models.find(m => {
                        if (!m || !m.id) return false;
                        const mId = m.id._serialized || m.__x_id?._serialized || String(m.id);
                        if (mId === chatId || (chatWid && mId === chatWid._serialized)) return true;
                        if (m.id.user && chatId.includes(m.id.user)) return true;
                        return false;
                    });
                }

                // 3. Método nativo oficial de WhatsApp Web: Chat.find(chatWid)
                if (!chat && chatWid && typeof chatCol.find === 'function') {
                    try {
                        const res = await Promise.race([
                            chatCol.find(chatWid),
                            new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_FIND')), 4000))
                        ]);
                        chat = (res && res.chat) ? res.chat : res;
                    } catch (eFind) {}
                }

                if (!chat && typeof chatCol.find === 'function') {
                    try {
                        const res = await Promise.race([
                            chatCol.find(chatId),
                            new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_FIND')), 4000))
                        ]);
                        chat = (res && res.chat) ? res.chat : res;
                    } catch (eFindStr) {}
                }

                // 4. Extracción desde IndexedDB (model-storage) con soporte robusto por cursor
                if (!chat) {
                    try {
                        const idbChat = await new Promise((resolve) => {
                            const timer = setTimeout(() => resolve(null), 3500);
                            try {
                                const req = indexedDB.open('model-storage');
                                req.onerror = () => { clearTimeout(timer); resolve(null); };
                                req.onsuccess = (evt) => {
                                    try {
                                        const db = evt.target.result;
                                        if (!db.objectStoreNames.contains('chat')) {
                                            clearTimeout(timer); db.close(); resolve(null); return;
                                        }
                                        const tx = db.transaction('chat', 'readonly');
                                        const store = tx.objectStore('chat');
                                        let handled = false;

                                        // Intento 1: store.get directo
                                        const getReq = store.get(chatId) || (chatWid ? store.get(chatWid._serialized) : null);
                                        if (getReq) {
                                            getReq.onsuccess = (e) => {
                                                if (e.target.result && !handled) {
                                                    handled = true;
                                                    clearTimeout(timer);
                                                    db.close();
                                                    resolve(e.target.result);
                                                }
                                            };
                                        }

                                        // Intento 2: iteración exhaustiva por cursor
                                        const curReq = store.openCursor();
                                        curReq.onsuccess = (e) => {
                                            if (handled) return;
                                            const cursor = e.target.result;
                                            if (cursor) {
                                                const v = cursor.value;
                                                const vId = typeof v.id === 'string' ? v.id : (v.id && v.id._serialized ? v.id._serialized : '');
                                                if (vId === chatId || (chatWid && vId === chatWid._serialized)) {
                                                    handled = true;
                                                    clearTimeout(timer);
                                                    db.close();
                                                    resolve(v);
                                                    return;
                                                }
                                                cursor.continue();
                                            } else {
                                                if (!handled) {
                                                    clearTimeout(timer);
                                                    db.close();
                                                    resolve(null);
                                                }
                                            }
                                        };
                                        curReq.onerror = () => { if (!handled) { clearTimeout(timer); db.close(); resolve(null); } };
                                    } catch (eInner) { clearTimeout(timer); resolve(null); }
                                };
                            } catch (eOpen) { clearTimeout(timer); resolve(null); }
                        });

                        if (idbChat && typeof chatCol.add === 'function') {
                            try {
                                if (widFactory && (!idbChat.id || typeof idbChat.id !== 'object' || !idbChat.id.toJid)) {
                                    idbChat.id = chatWid || widFactory.createWid(chatId);
                                }
                                chat = chatCol.add(idbChat, { merge: true });
                                if (Array.isArray(chat)) chat = chat[0];
                            } catch (eAdd) {}
                        }
                    } catch (eIDB) {}
                }

                // 5. Para chats individuales (no grupos), consultar findOrCreateLatestChat
                if (!chat && !String(chatId).endsWith('@g.us')) {
                    try {
                        const findAction = window.require ? window.require('WAWebFindChatAction') : null;
                        if (findAction?.findOrCreateLatestChat && chatWid) {
                            const res = await findAction.findOrCreateLatestChat(chatWid);
                            chat = (res && res.chat) ? res.chat : res;
                        }
                    } catch (eFC) {}
                }

                // 6. Reintento final de lectura directa en colección
                if (!chat && chatWid && chatCol.get) {
                    chat = chatCol.get(chatWid) || chatCol.get(chatId);
                }
            }
        }

        if (getAsModel && chat) {
            try {
                return await window.WWebJS.getChatModel(chat, { isChannel: isChannel });
            } catch (eModel) {
                return chat;
            }
        }
        return chat;
    };`
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

// 6. Parche en Client.js para garantizar fallback de chat y modelo de mensaje
const rutaClient = path.join(__dirname, 'node_modules', 'whatsapp-web.js', 'src', 'Client.js');
if (fs.existsSync(rutaClient)) {
    let codeClient = fs.readFileSync(rutaClient, 'utf8');
    if (!codeClient.includes('TIMEOUT_FIND')) {
        codeClient = codeClient.replace(
            /const sentMsg = await this\.pupPage\.evaluate\([\s\S]*?return sentMsg \? new Message\(this, sentMsg\) : undefined;/,
            `const sentMsg = await this.pupPage.evaluate(
            async (chatId, content, options, sendSeen) => {
                try {
                    let chat = await window.WWebJS.getChat(chatId, {
                        getAsModel: false,
                    });

                    if (!chat) {
                        try {
                            const chatCol = (window.require ? window.require('WAWebCollections')?.Chat : null) || window.Store?.Chat;
                            const widFactory = window.require ? window.require('WAWebWidFactory') : null;
                            const wid = widFactory ? widFactory.createWid(chatId) : null;
                            if (chatCol) {
                                // 1. Método nativo Chat.find
                                if (wid && typeof chatCol.find === 'function') {
                                    try {
                                        const res = await Promise.race([
                                            chatCol.find(wid),
                                            new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_FIND')), 4000))
                                        ]);
                                        chat = (res && res.chat) ? res.chat : res;
                                    } catch (eFind) {}
                                }

                                if (!chat && typeof chatCol.find === 'function') {
                                    try {
                                        const res = await Promise.race([
                                            chatCol.find(chatId),
                                            new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_FIND')), 4000))
                                        ]);
                                        chat = (res && res.chat) ? res.chat : res;
                                    } catch (eFindStr) {}
                                }

                                // 2. Búsqueda por cursor en IndexedDB model-storage
                                if (!chat) {
                                    try {
                                        const idbChat = await new Promise((resolve) => {
                                            const timer = setTimeout(() => resolve(null), 3500);
                                            try {
                                                const req = indexedDB.open('model-storage');
                                                req.onerror = () => { clearTimeout(timer); resolve(null); };
                                                req.onsuccess = (evt) => {
                                                    try {
                                                        const db = evt.target.result;
                                                        if (!db.objectStoreNames.contains('chat')) {
                                                            clearTimeout(timer); db.close(); resolve(null); return;
                                                        }
                                                        const tx = db.transaction('chat', 'readonly');
                                                        const store = tx.objectStore('chat');
                                                        let handled = false;

                                                        const curReq = store.openCursor();
                                                        curReq.onsuccess = (e) => {
                                                            if (handled) return;
                                                            const cursor = e.target.result;
                                                            if (cursor) {
                                                                const v = cursor.value;
                                                                const vId = typeof v.id === 'string' ? v.id : (v.id && v.id._serialized ? v.id._serialized : '');
                                                                if (vId === chatId || (wid && vId === wid._serialized)) {
                                                                    handled = true;
                                                                    clearTimeout(timer);
                                                                    db.close();
                                                                    resolve(v);
                                                                    return;
                                                                }
                                                                cursor.continue();
                                                            } else {
                                                                if (!handled) {
                                                                    clearTimeout(timer);
                                                                    db.close();
                                                                    resolve(null);
                                                                }
                                                            }
                                                        };
                                                        curReq.onerror = () => { if (!handled) { clearTimeout(timer); db.close(); resolve(null); } };
                                                    } catch (eInner) { clearTimeout(timer); resolve(null); }
                                                };
                                            } catch (eOpen) { clearTimeout(timer); resolve(null); }
                                        });

                                        if (idbChat && typeof chatCol.add === 'function') {
                                            try {
                                                if (widFactory && (!idbChat.id || typeof idbChat.id !== 'object' || !idbChat.id.toJid)) {
                                                    idbChat.id = wid || widFactory.createWid(chatId);
                                                }
                                                chat = chatCol.add(idbChat, { merge: true });
                                                if (Array.isArray(chat)) chat = chat[0];
                                            } catch (eAdd) {}
                                        }
                                    } catch (eIDB) {}
                                }

                                if (!chat && wid) {
                                    chat = chatCol.get(wid) || chatCol.get(chatId);
                                }
                            }
                        } catch (eHydrate) {}
                    }

                    if (!chat) {
                        return { __debugError: \`CHAT_NOT_FOUND: No se encontró el chat \${chatId} en memoria viva\` };
                    }

                    if (sendSeen) {
                        await window.WWebJS.sendSeen(chatId).catch(() => {});
                    }

                    const msg = await window.WWebJS.sendMessage(
                        chat,
                        content,
                        options,
                    );

                    if (!msg) {
                        return { __debugError: \`SEND_MSG_NULL: WWebJS.sendMessage retornó null/undefined para \${chatId}\` };
                    }

                    const model = window.WWebJS.getMessageModel(msg);
                    if (!model) {
                        return {
                            id: msg.id ? (msg.id._serialized ? msg.id : { _serialized: String(msg.id) }) : { _serialized: 'msg_' + Date.now() },
                            ack: typeof msg.ack === 'number' ? msg.ack : 1,
                            body: msg.caption || msg.body || '',
                            type: msg.type || 'image'
                        };
                    }
                    return model;
                } catch (eEval) {
                    return { __debugError: \`EVAL_EXCEPTION: \${eEval?.message || eEval}\` };
                }
            },
            chatId,
            content,
            internalOptions,
            sendSeen,
        );

        if (sentMsg && sentMsg.__debugError) {
            throw new Error(sentMsg.__debugError);
        }

        return sentMsg ? new Message(this, sentMsg) : undefined;`
        );
        fs.writeFileSync(rutaClient, codeClient, 'utf8');
        console.log('✅ Parche de robustez aplicado a Client.js.');
    }

    // 7. Parche contra destrucción prematura de Puppeteer por UNPAIRED temporal
    if (!codeClient.includes('WAState.UNPAIRED,')) {
        codeClient = codeClient.replace(
            `const ACCEPTED_STATES = [
                    WAState.CONNECTED,
                    WAState.OPENING,
                    WAState.PAIRING,
                    WAState.TIMEOUT,
                ];`,
            `const ACCEPTED_STATES = [
                    WAState.CONNECTED,
                    WAState.OPENING,
                    WAState.PAIRING,
                    WAState.TIMEOUT,
                    WAState.UNPAIRED,
                    WAState.UNPAIRED_IDLE,
                ];`
        );
        codeClient = codeClient.replace(
            `if (!ACCEPTED_STATES.includes(state)) {
                    /**
                     * Emitted when the client has been disconnected
                     * @event Client#disconnected
                     * @param {WAState|"LOGOUT"} reason reason that caused the disconnect
                     */
                    await this.authStrategy.disconnect();
                    this.emit(Events.DISCONNECTED, state);
                    this.destroy();
                }`,
            `if (!ACCEPTED_STATES.includes(state) || state === 'LOGOUT') {
                    await this.authStrategy.disconnect();
                    this.emit(Events.DISCONNECTED, state);
                    if (state === 'LOGOUT') {
                        this.destroy();
                    }
                }`
        );
        fs.writeFileSync(rutaClient, codeClient, 'utf8');
        console.log('✅ Parche de estabilidad de estados aplicado a Client.js.');
    }
}

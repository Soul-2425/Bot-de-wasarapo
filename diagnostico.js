const { Client, LocalAuth } = require('whatsapp-web.js');
const { obtenerRutaNavegador } = require('./navegador');
const rutaNavegador = obtenerRutaNavegador();

const cliente = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        ...(rutaNavegador ? { executablePath: rutaNavegador } : {}),
        args: [
            '--no-sandbox', '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', '--disable-gpu',
            '--no-first-run', '--no-zygote',
            '--disable-features=ServiceWorker'
        ],
        timeout: 120000,
        protocolTimeout: 180000
    }
});

cliente.on('qr', () => console.log('QR - escanea'));
cliente.on('authenticated', () => console.log('✅ Autenticado'));

cliente.on('ready', async () => {
    console.log('✅ READY - Esperando 30s...');
    await new Promise(r => setTimeout(r, 30000));
    console.log('🔍 Listando TODAS las bases de datos IndexedDB...\n');

    try {
        const resultado = await cliente.pupPage.evaluate(async () => {
            // Listar todas las BDs disponibles
            const databases = await indexedDB.databases();
            const dbNames = databases.map(d => d.name);
            
            const detalles = {};
            
            // Abrir cada BD y listar sus stores
            for (const dbInfo of databases) {
                try {
                    const stores = await new Promise((res, rej) => {
                        const req = indexedDB.open(dbInfo.name);
                        req.onsuccess = e => {
                            const db = e.target.result;
                            res(Array.from(db.objectStoreNames));
                            db.close();
                        };
                        req.onerror = () => res(['ERROR: ' + req.error]);
                    });
                    detalles[dbInfo.name] = stores;
                } catch(e) {
                    detalles[dbInfo.name] = ['EXCEPTION: ' + e.message];
                }
            }
            
            return { dbNames, detalles };
        });

        console.log('=== TODAS LAS BASES DE DATOS ===');
        console.log('Nombres:', resultado.dbNames.join(', '));
        console.log('\n=== STORES POR BD ===');
        for (const [db, stores] of Object.entries(resultado.detalles)) {
            console.log(`\n[${db}]: ${stores.join(', ')}`);
        }

        // Ahora buscar en la BD que tenga stores relacionados con chats
        console.log('\n🔍 Buscando store de chats...');
        const bdConChats = Object.entries(resultado.detalles).find(([db, stores]) =>
            stores.some(s => s.toLowerCase().includes('chat') || s.toLowerCase().includes('message'))
        );
        
        if (bdConChats) {
            console.log(`\n✅ BD con chats encontrada: "${bdConChats[0]}"`);
            console.log('   Stores:', bdConChats[1].join(', '));
            
            // Leer grupos de esa BD
            const grupos = await cliente.pupPage.evaluate(async (dbName, storeName) => {
                return new Promise((resolve) => {
                    const req = indexedDB.open(dbName);
                    req.onsuccess = e => {
                        const db = e.target.result;
                        const tx = db.transaction(storeName, 'readonly');
                        const store = tx.objectStore(storeName);
                        const getAllReq = store.getAll();
                        getAllReq.onsuccess = () => {
                            const todos = getAllReq.result || [];
                            const grupos = todos.filter(c => {
                                const id = typeof c.id === 'string' ? c.id : 
                                           (c.id && c.id._serialized ? c.id._serialized : '');
                                return id.includes('@g.us');
                            });
                            resolve({ total: todos.length, grupos: grupos.length, 
                                      muestra: grupos.slice(0,3).map(g => ({ id: g.id, name: g.name || g.formattedTitle || '' })) });
                        };
                        getAllReq.onerror = () => resolve({ error: String(getAllReq.error) });
                    };
                });
            }, bdConChats[0], bdConChats[1].find(s => s.toLowerCase().includes('chat')));
            
            console.log('\n=== GRUPOS EN IDB ===');
            console.log(JSON.stringify(grupos, null, 2));
        } else {
            console.log('\n❌ No se encontró ningún store con "chat" o "message"');
        }

    } catch(e) {
        console.error('ERROR:', e.message, e.stack);
    }
    process.exit(0);
});

cliente.on('disconnected', () => process.exit(1));
cliente.initialize();

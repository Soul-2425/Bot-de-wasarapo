const { Client, LocalAuth } = require('whatsapp-web.js');

const cliente = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        timeout: 60000,
        protocolTimeout: 120000 
    }
});

cliente.on('ready', async () => {
    console.log('✅ Conectado a WhatsApp.');
    try {
        const chats = await cliente.getChats();
        const grupos = chats.filter(c => c.isGroup);
        console.log(`Encontrados ${chats.length} chats, de los cuales ${grupos.length} son grupos.`);
        if (grupos.length > 0) {
            console.log('Primer grupo:', grupos[0].name);
        }
    } catch (e) {
        console.error('Error al obtener chats:', e.message);
    }
    process.exit(0);
});

cliente.on('disconnected', (reason) => {
    console.log('Disconnected', reason);
    process.exit(1);
});

cliente.initialize();

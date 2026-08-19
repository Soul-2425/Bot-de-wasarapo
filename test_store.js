const { Client, LocalAuth } = require('whatsapp-web.js');
const cliente = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1043293986-alpha.html",
    },
    puppeteer: { 
        headless: true, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-extensions',
            '--disable-features=ServiceWorker',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--no-first-run',        
            '--no-zygote',            
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        ] 
    },
});
cliente.on('qr', () => { console.log('QR Received!'); process.exit(1); });
cliente.on('authenticated', () => { console.log('Authenticated!'); });
cliente.on('ready', async () => {
    console.log("Got READY! Testing getChats()...");
    try {
        const chats = await cliente.getChats();
        console.log("Has getChats returned?", chats.length);
        process.exit(0);
    } catch(e) {
        console.log("Error evaluating:", e.message);
        process.exit(1);
    }
});
cliente.initialize();

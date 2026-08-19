const https = require('https');
https.get('https://api.github.com/search/issues?q=repo:pedroslopez/whatsapp-web.js+r+is+undefined', { headers: { 'User-Agent': 'Node.js' } }, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const items = json.items || [];
            console.log(items.slice(0, 3).map(i => i.title + ' - ' + i.html_url).join('\n'));
        } catch (e) { console.error('Error parsing JSON', e.message); }
    });
}).on('error', (e) => {
    console.error(e);
});

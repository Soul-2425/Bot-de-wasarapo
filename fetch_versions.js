const https = require('https');
https.get('https://api.github.com/repos/wppconnect-team/wa-version/contents/html', {
    headers: { 'User-Agent': 'Node.js' }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        const versions = json.map(x => x.name).filter(x => !x.includes('alpha'));
        console.log("LATEST STABLE:", versions.slice(-5));
    });
});

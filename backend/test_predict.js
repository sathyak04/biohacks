const http = require('http');

const data = JSON.stringify({ mutations: ['TP53_R175H', 'BRCA1_185delAG'] });

const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/predict',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.log('Predict Result:', body));
});

req.on('error', console.error);
req.write(data);
req.end();

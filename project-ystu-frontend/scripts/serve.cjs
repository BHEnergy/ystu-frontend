const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const directory = 'dist';
const root = path.resolve(__dirname, '..', directory);
const port = Number(process.env.PORT) || 8000;
const types = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
    '.json': 'application/json', '.ico': 'image/x-icon',
};
if (!fs.existsSync(root)) throw new Error('Сначала выполните npm run build');
http.createServer((req, res) => {
    try {
        let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        if (pathname.endsWith('/')) pathname += 'index.html';
        const file = path.resolve(root, '.' + pathname);
        if (!file.startsWith(root + path.sep)) {
            res.writeHead(403); res.end(); return;
        }
        fs.stat(file, (error, stat) => {
            if (error || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
            res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
            fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
        });
    } catch { res.writeHead(400); res.end('Bad request'); }
}).listen(port, 'localhost', () => console.log(`http://localhost:${port}/pages/index.html (${directory})`));

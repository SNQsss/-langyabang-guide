import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
const port = Number(process.env.PORT || 4173);
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    const decoded = decodeURIComponent(url.pathname);
    if (decoded.includes('..')) throw new Error('Invalid path');
    let relative = decoded.replace(/^\/+/, '');
    // Simulate GitHub project subpaths as well as the ordinary local root.
    if (relative.startsWith('preview-project/')) relative = relative.slice('preview-project/'.length);
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const base = path.join(root, 'site');
    const file = path.resolve(base, relative);
    if (!file.startsWith(base + path.sep)) throw new Error('Invalid path');
    const content = await fs.readFile(file);
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(content);
  } catch { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); res.end('找不到這個頁面。'); }
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/`));
process.on('SIGINT',()=>server.close(()=>process.exit()));

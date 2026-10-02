// Servidor local mínimo, sin dependencias.
//   node scripts/serve.mjs src  5173   → para desarrollar (archivos separados)
//   node scripts/serve.mjs dist 4173   → para probar lo que se publica
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir  = path.join(ROOT, process.argv[2] || 'dist');
const port = Number(process.argv[3] || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(dir, url.endsWith('/') ? url + 'index.html' : url);
  // En desarrollo (src/), el manifiesto y los íconos están en public/
  const pub = path.join(ROOT, 'public', url);
  if (!fs.existsSync(file) && pub.startsWith(path.join(ROOT, 'public')) && fs.existsSync(pub)) file = pub;
  const permitido = file.startsWith(dir) || file.startsWith(path.join(ROOT, 'public'));
  if (!permitido || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('No encontrado'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log('Sirviendo ' + path.relative(ROOT, dir) + '/ en http://localhost:' + port));

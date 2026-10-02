// Arma dist/index.html: un ÚNICO archivo con todo el CSS y el JS adentro
// (funciona sin internet y con doble clic), más los archivos de la app instalable.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC  = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');

// 1. CSS adentro del HTML
const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');
const cssTag = '<link rel="stylesheet" href="styles.css">';
if (!html.includes(cssTag)) throw new Error('No encuentro ' + cssTag + ' en src/index.html');
html = html.replace(cssTag, () => '<style>\n' + css.replace(/^(?=.)/gm, '  ') + '</style>');

// 2. Todos los <script src="js/..."> se juntan en un solo <script>, en el mismo orden
const block = html.match(/<!-- SCRIPTS[^>]*-->([\s\S]*?)<!-- \/SCRIPTS -->/);
if (!block) throw new Error('No encuentro el bloque <!-- SCRIPTS --> en src/index.html');
const files = [...block[1].matchAll(/<script src="js\/([^"]+)"><\/script>/g)].map(m => m[1]);
const enDisco = fs.readdirSync(path.join(SRC, 'js')).filter(f => f.endsWith('.js')).sort();
const faltan = enDisco.filter(f => !files.includes(f));
if (faltan.length) throw new Error('Hay archivos en src/js que no están en index.html: ' + faltan.join(', '));
const js = files.map(f => '// ═══ ' + f + ' ═══\n' + fs.readFileSync(path.join(SRC, 'js', f), 'utf8')).join('\n');
// En la versión publicada se activa la app instalable (service worker)
const jsFinal = js.replace('/*__PWA__*/false', 'true');
if (jsFinal === js) throw new Error('No encuentro /*__PWA__*/false en src/js (99-arranque.js)');
html = html.replace(block[0], () => '<script>\n' + jsFinal + '</script>');

// 3. Versión para el service worker (así la app instalada se actualiza sola)
const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), html);

// 4. Archivos públicos (manifest, íconos, service worker)
const PUB = path.join(ROOT, 'public');
if (fs.existsSync(PUB)) {
  for (const f of fs.readdirSync(PUB)) {
    let content = fs.readFileSync(path.join(PUB, f));
    if (f === 'sw.js') content = Buffer.from(content.toString('utf8').replaceAll('__VERSION__', version));
    fs.writeFileSync(path.join(DIST, f), content);
  }
}

console.log('✓ dist/index.html (' + Math.round(html.length / 1024) + ' KB, ' + files.length + ' archivos JS) · versión ' + version);

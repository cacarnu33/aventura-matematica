// Genera los íconos de la app instalable (public/*.png) dibujándolos con el navegador.
// Se corre una sola vez, o cuando se quiera cambiar el ícono:  node scripts/iconos.mjs
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

// "maskable": el sistema recorta el ícono (círculo, gota…), así que el fondo
// llena todo y el dibujo queda en el centro.
const dibujo = (size, maskable) => `
<html><body style="margin:0;background:transparent;">
<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(145deg,#2BB98A,#167A5C);
  border-radius:${maskable ? 0 : size * 0.22}px;position:relative;overflow:hidden;">
  <div style="font-family:'Segoe UI','Arial Rounded MT Bold',Arial,sans-serif;font-weight:900;
    font-size:${size * (maskable ? 0.42 : 0.56)}px;color:#FFF9F0;line-height:1;
    text-shadow:0 ${size * 0.02}px 0 rgba(0,0,0,0.18);">V</div>
  <div style="position:absolute;top:${size * (maskable ? 0.24 : 0.12)}px;right:${size * (maskable ? 0.22 : 0.12)}px;
    font-size:${size * (maskable ? 0.14 : 0.2)}px;line-height:1;">✨</div>
  <div style="position:absolute;bottom:${size * (maskable ? 0.22 : 0.1)}px;left:${size * (maskable ? 0.24 : 0.12)}px;
    width:${size * 0.09}px;height:${size * 0.09}px;border-radius:50%;background:#FFCA28;"></div>
</div></body></html>`;

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
for (const [file, size, maskable] of [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true],   // iPhone/iPad redondean solos
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(dibujo(size, maskable));
  await page.screenshot({ path: path.join(PUB, file), omitBackground: true });
  console.log('✓ public/' + file);
}
await browser.close();

// ── ARRANQUE ──────────────────────────────────────────────
// Recuperar el progreso guardado (monedas, misiones, premios) antes de dibujar
progresoCargar();

// Only init things that are safe before any screen is visited
renderPrizes();
renderHistory();
// Pre-generate values so first navigation is instant
sumaA = rnd(1,9); sumaB = rnd(1, 10-sumaA);
restaA = rnd(3,10); restaB = rnd(1, restaA-1);

// App instalable: el service worker guarda la app para usarla sin internet.
// Solo en la versión publicada (el build cambia este valor a true).
const PWA_ACTIVA = /*__PWA__*/false;
if (PWA_ACTIVA && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sin app instalable: se usa igual */ });
  });
}

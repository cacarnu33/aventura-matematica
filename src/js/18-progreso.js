// ── PROGRESO (se guarda en este dispositivo) ──────────────
// Guarda monedas, misiones cumplidas, premios canjeados e historial en
// localStorage, para que no se pierdan al cerrar la página.
// Los premios canjeados vuelven a estar disponibles al día siguiente.
// Si el navegador no deja guardar (modo privado, almacenamiento bloqueado),
// se juega igual, sin guardar.
const PROGRESO_CLAVE = 'verita-progreso-v1';

function progresoHoy() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function progresoGuardar() {
  try {
    const misiones = {};
    Object.keys(MISIONES).forEach(k => {
      misiones[k] = { ganadas: MISIONES[k].ganadas, premio: MISIONES[k].premio };
    });
    localStorage.setItem(PROGRESO_CLAVE, JSON.stringify({
      coins,
      premiosDia: progresoHoy(),
      premios: PRIZES.filter(p => p.claimed).map(p => p.id),
      historial: premiosHistorial,
      misiones,
    }));
  } catch (e) { /* sin almacenamiento: se juega igual */ }
}

function progresoCargar() {
  let datos = null;
  try { datos = JSON.parse(localStorage.getItem(PROGRESO_CLAVE) || 'null'); } catch (e) { return; }
  if (!datos || typeof datos !== 'object') return;

  if (Number.isFinite(datos.coins) && datos.coins >= 0) coins = datos.coins;
  if (Array.isArray(datos.premios) && datos.premiosDia === progresoHoy()) {
    PRIZES.forEach(p => { p.claimed = datos.premios.includes(p.id); });
  }
  if (Array.isArray(datos.historial)) premiosHistorial = datos.historial.slice(0, 50);
  if (datos.misiones && typeof datos.misiones === 'object') {
    Object.keys(datos.misiones).forEach(k => {
      const m = MISIONES[k], d = datos.misiones[k];
      if (!m || !d) return;
      if (d.ganadas && typeof d.ganadas === 'object') m.ganadas = d.ganadas;
      m.premio = !!d.premio;
    });
  }
  updateCoins(0, null);   // refresca el contador de monedas y la barra de premios
}

// Para adultos: botón al final de la pantalla de Premios
function progresoBorrar() {
  if (!confirm('¿Borrar todas las monedas, misiones y premios guardados?')) return;
  try { localStorage.removeItem(PROGRESO_CLAVE); } catch (e) {}
  location.reload();
}

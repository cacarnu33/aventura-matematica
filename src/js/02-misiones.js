// ── MISIONES (común a todos los juegos) ──────────────────
// Cada juego tiene niveles cortos. Cada nivel es una "misión" con su propio festejo:
// al terminarla, Verita elige si prueba el nivel siguiente o festeja y termina.
// La clave de cada misión es el nombre de su pantalla (ej. 'suma', 'resta').
const MISION_PREMIO = 8;   // monedas extra al cumplir todas las misiones de un juego
const MISIONES = {};

// cfg: { overlay, arena?, emoji, title, festejo, levels:[{icon,name,coins}], start(lvl), bg?, styleDisplay? }
function misionRegistrar(key, cfg) {
  MISIONES[key] = Object.assign({ ganadas:{}, premio:false, pantalla:'inicio' }, cfg);
}

function misionMostrar(m, html) {
  const ov = gei(m.overlay);
  if (!ov) return;
  ov.innerHTML = html;
  if (m.bg) ov.style.background = m.bg;
  if (m.styleDisplay) ov.style.display = 'flex';
  else ov.classList.add('show');
  misionAjustar(ov);
}

// Fondo sin transparencia (que no se mezcle con el juego de atrás) y el área
// del juego se agranda si el contenido del cartel no entra.
function misionAjustar(ov) {
  const c = getComputedStyle(ov).backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
  if (c && (c[4] === undefined || parseFloat(c[4]) > 0)) ov.style.background = 'rgb(' + c[1] + ',' + c[2] + ',' + c[3] + ')';
  ov.style.padding = '20px 12px';
  const box = ov.offsetParent;
  if (!box) return;
  box.style.minHeight = '';
  const kids = [...ov.children];
  const gap  = parseFloat(getComputedStyle(ov).rowGap) || 12;
  const need = kids.reduce((s, k) => s + k.offsetHeight, 0) + gap * (kids.length - 1) + 48;
  if (need > box.clientHeight) box.style.minHeight = need + 'px';
  ov._misionBox = box;
}

// Cada start del juego llama a esto: oculta el overlay y marca que se está jugando
function misionOcultar(key) {
  const m = MISIONES[key];
  if (!m) return;
  m.pantalla = 'juego';
  const ov = gei(m.overlay);
  if (!ov) return;
  if (ov._misionBox) ov._misionBox.style.minHeight = '';
  if (m.styleDisplay) ov.style.display = 'none';
  else ov.classList.remove('show');
}

function misionConfetti(m) {
  if (m.arena) launchConfettiIn(m.arena);
  else launchConfetti();
}

function misionActualizarMonedas() {
  if (gei('coin-display')) gei('coin-display').textContent = String(coins);
  if (gei('coins-big'))    gei('coins-big').textContent    = coins + ' 🪙';
}

// Pantalla de inicio: elegir la misión (las cumplidas muestran ✅)
function misionInicio(key) {
  const m = MISIONES[key];
  if (!m) return;
  if (m.inicio) { m.inicio(); return; }
  m.pantalla = 'inicio';
  misionMostrar(m,
    '<div style="font-size:2.5rem;">' + m.emoji + '</div>' +
    '<div class="overlay-title" style="color:white;">' + m.title + '</div>' +
    '<div class="overlay-sub" style="color:rgba(255,255,255,0.92);">Elegí una misión</div>' +
    '<div class="mision-levels">' +
      m.levels.map((l, i) =>
        `<button class="mision-level-btn" onclick="misionElegir('${key}', ${i+1})">` +
          '<span class="mision-level-icon">' + l.icon + '</span>' +
          '<span><b>Nivel ' + (i+1) + '</b><br>' + l.name + '</span>' +
          (m.ganadas[i+1] ? '<span class="mision-level-ok">✅</span>' : '') +
        '</button>'
      ).join('') +
    '</div>');
}

function misionElegir(key, lvl) {
  const m = MISIONES[key];
  if (m) m.start(lvl);
}

// Fin de un nivel: festejo propio + elegir seguir o terminar.
// Terminar la misión siempre da al menos 1 estrella.
function misionCumplida(key, lvl, hits, total) {
  const m = MISIONES[key];
  if (!m) return;
  const cfg = m.levels[lvl-1];
  m.pantalla = 'mision';
  updateCoins(cfg.coins, null);
  m.ganadas[lvl] = true;
  let extra = '';
  if (!m.premio && m.levels.every((_, i) => m.ganadas[i+1])) {
    m.premio = true;
    updateCoins(MISION_PREMIO, null);
    extra = '<div class="mision-premio">🏅 ¡Todas las misiones! +' + MISION_PREMIO + ' 🪙</div>';
  }
  progresoGuardar();
  misionActualizarMonedas();

  const r  = total ? hits / total : 1;
  const st = r >= 0.8 ? 3 : r >= 0.4 ? 2 : 1;
  const sig = m.levels[lvl];
  misionMostrar(m,
    '<div style="font-size:2.6rem;">🏆</div>' +
    '<div class="overlay-title" style="color:white;">¡Misión ' + lvl + ' cumplida!</div>' +
    '<div class="mision-stars">' + '⭐'.repeat(st) + '☆'.repeat(3-st) + '</div>' +
    '<div class="mision-premio">🪙 +' + cfg.coins + ' monedas</div>' + extra +
    '<div class="mision-btns">' +
      (sig ? `<button class="play-btn" onclick="misionElegir('${key}', ${lvl+1})">` + sig.icon + ' Probar Nivel ' + (lvl+1) + ' →</button>' : '') +
      `<button class="mision-fiesta-btn" onclick="misionFestejar('${key}')">🎉 Festejar y terminar</button>` +
    '</div>');
  misionConfetti(m);
  playSuccessSound();
  vozLeer(sig ? '¡Misión cumplida! ¿Probás el nivel ' + (lvl+1) + ', o festejamos?' : '¡Misión cumplida! ¡Sos una campeona!');
}

function misionFestejar(key) {
  const m = MISIONES[key];
  if (!m) return;
  m.pantalla = 'fiesta';
  misionMostrar(m,
    '<div style="font-size:3rem;">🥳🎉🌟</div>' +
    '<div class="overlay-title" style="color:white;">¡Muy bien, Verita!</div>' +
    '<div class="overlay-sub" style="color:rgba(255,255,255,0.92);">' + m.festejo + '</div>' +
    `<button class="play-btn" onclick="misionInicio('${key}')">Ver las misiones</button>`);
  [0, 500, 1000].forEach(t => setTimeout(() => misionConfetti(m), t));
  playSuccessSound();
  vozLeer('¡Muy bien, Verita! ' + m.festejo + '.');
}

// Texto para el botón 🔊 cuando hay una pantalla de misión a la vista (si no, null)
function misionVoz(key) {
  const m = MISIONES[key];
  if (!m || m.pantalla === 'juego') return null;
  if (m.pantalla === 'inicio') return m.inicio ? null : 'Elegí una misión. ' + m.levels.map((l, i) => 'Nivel ' + (i+1) + ', ' + l.name).join('. ') + '.';
  if (m.pantalla === 'mision') return '¡Misión cumplida! Elegí si seguís o festejamos.';
  return '¡Muy bien, Verita! ' + m.festejo + '.';
}

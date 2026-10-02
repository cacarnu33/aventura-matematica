// ── LECTURA POR VOZ (Web Speech API) ─────────────────────
// Each screen registers its instruction getter
// vozLeer() reads the current screen's instruction aloud

let vozCurrentScreen = 'inicio';
let vozUtterance = null;
let vozSpeaking  = false;

// Map each screen to a function that returns the text to read
const VOZ_TEXTS = {
  inicio: () => '¿A qué jugamos hoy? Tocá el dibujo de un juego.',
  conteo: () => {
    const n = gei('count-num') ? gei('count-num').textContent : '';
    return 'Usá los botones más y menos para contar. El número actual es ' + n + '.';
  },
  suma: () => {
    const mode = SUMA2_LEVELS[suma2.level-1].mode;
    if (mode === 'problema') return suma2.problem + ' Elegí el número.';
    if (mode === 'recta') return '¿Cuánto es ' + suma2.a + ' más ' + suma2.b + '? Empezá en el ' + suma2.a + ' y tocá la recta para saltar ' + suma2.b + ' veces. Elegí el número.';
    return '¿Cuánto es ' + suma2.a + ' más ' + suma2.b + '? Tocá los objetos para contarlos y elegí el número total.';
  },
  resta: () => {
    const mode = RESTA2_LEVELS[resta2.level-1].mode;
    if (mode === 'problema') return resta2.problem + ' Elegí el número.';
    if (mode === 'recta') return '¿Cuánto es ' + resta2.a + ' menos ' + resta2.b + '? Empezá en el ' + resta2.a + ' y tocá la recta para saltar ' + resta2.b + ' veces para atrás. Elegí el número.';
    return 'Tenemos ' + resta2.a + '. Sacá ' + resta2.b + ' tocándolos. ¿Cuántos quedan? Elegí el número.';
  },
  comparar: () => {
    const a = gei('cmp2-numA') ? gei('cmp2-numA').textContent : '';
    const b = gei('cmp2-numB') ? gei('cmp2-numB').textContent : '';
    const menos = (typeof cmp2 !== 'undefined' && cmp2.target === 'menos');
    const cual = menos ? 'el que tiene MENOS' : 'el que tiene MÁS';
    return 'Mirá las dos torres, ' + a + ' y ' + b + '. Tocá ' + cual + '. El cocodrilo siempre se come al número más grande. Si son iguales, tocá Son iguales.';
  },
  'suma-globos': () => {
    const t = gei('sg-target') ? gei('sg-target').textContent : '';
    return 'El objetivo es ' + t + '. Tocá un perrito, después tocá otro. Los dos números juntos tienen que sumar ' + t + '.';
  },
  cohetes: () => {
    const p = gei('cohetes-problem') ? gei('cohetes-problem').textContent : '';
    return '¿Cuánto es ' + p.replace('=','? ') + ' Elegí la respuesta correcta antes de que el reloj llegue a cero.';
  },
  granja: () => {
    const lbl = gei('granja-q') ? gei('granja-q').textContent : '';
    return lbl + ' Contá los grupos de animales y elegí el número total.';
  },
  conejos: () => {
    const t = gei('conejos-title') ? gei('conejos-title').textContent : '';
    return t + ' Elegí cuántas zanahorias le toca a cada conejo.';
  },
  tienda: () => {
    const phase = gei('tienda-phase1') && gei('tienda-phase1').classList.contains('active') ? 1 : 2;
    if (phase === 1) return 'Tocá los productos que querés comprar. Cuando tengas dos o más, tocá el botón para ir a pagar.';
    return 'Tocá los billetes y monedas para pagar el total. Cuando llegues al monto correcto, confirmá el pago.';
  },
  secuencias: () => {
    const hint = gei('seq-hint-text') ? gei('seq-hint-text').textContent : '';
    return hint + ' Tocá la ficha correcta para completar el patrón.';
  },
  contar: () => {
    const q = gei('contar-question') ? gei('contar-question').textContent : '';
    return q + ' Contá los objetos uno por uno y tocá el número correcto.';
  },
  memotest: () => 'Memotest matemático. Tocá una carta azul para darla vuelta. Después buscá la carta que tenga el número que corresponde a la operación. Hay cuatro pares para encontrar.',
  premios: () => {
    const coins = gei('coin-display') ? gei('coin-display').textContent : '0';
    return 'Tenés ' + coins + ' monedas. Tocá Canjear en el premio que querés.';
  },
};

function vozLeer(textoEspecifico) {
  if (!window.speechSynthesis) {
    if (gei('voz-text')) gei('voz-text').textContent = 'Tu navegador no soporta lectura por voz 😔';
    return;
  }

  vozDetener();

  const texto = textoEspecifico || misionVoz(vozCurrentScreen) || (VOZ_TEXTS[vozCurrentScreen] ? VOZ_TEXTS[vozCurrentScreen]() : 'Tocá el dibujo de un juego.');

  if (gei('voz-text')) gei('voz-text').textContent = '🔊 ' + texto;

  vozUtterance = new SpeechSynthesisUtterance(texto);
  vozUtterance.lang  = 'es-AR';
  vozUtterance.rate  = 0.82;   // slower — better for TDL
  vozUtterance.pitch = 1.05;
  vozUtterance.volume = 1;

  // Try to get a Spanish voice
  const voices = window.speechSynthesis.getVoices();
  const esVoice = voices.find(v => v.lang.startsWith('es')) ||
                  voices.find(v => v.lang.startsWith('en'));
  if (esVoice) vozUtterance.voice = esVoice;

  vozUtterance.onstart = () => {
    vozSpeaking = true;
    const btn = gei('voz-main-btn');
    if (btn) btn.classList.add('speaking');
    const stop = gei('voz-stop-btn');
    if (stop) stop.classList.add('show');
  };
  vozUtterance.onend = vozUtterance.onerror = () => {
    vozSpeaking = false;
    const btn = gei('voz-main-btn');
    if (btn) btn.classList.remove('speaking');
    const stop = gei('voz-stop-btn');
    if (stop) stop.classList.remove('show');
  };

  window.speechSynthesis.speak(vozUtterance);
}

function vozDetener() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  vozSpeaking = false;
  const btn = gei('voz-main-btn');
  if (btn) btn.classList.remove('speaking');
  const stop = gei('voz-stop-btn');
  if (stop) stop.classList.remove('show');
}

// Update current screen when navigating
const _origGoToScreen = goToScreen;
// We patch goToScreen after it's defined — do it at end of script
function vozSetScreen(name) {
  vozCurrentScreen = name;
  // Auto-read instruction when entering a new screen (after short delay)
  setTimeout(() => {
    if (VOZ_TEXTS[name]) {
      const txt = misionVoz(name) || VOZ_TEXTS[name]();
      if (gei('voz-text')) gei('voz-text').textContent = '👆 Tocá 🔊 para escuchar: ' + txt.slice(0, 60) + (txt.length > 60 ? '…' : '');
    }
  }, 400);
}

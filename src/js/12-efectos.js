// ── Confetti ──────────────────────────────────────────────
function launchConfetti() {
  const arena = gei('contar-arena');
  if (!arena) return;
  const colors = ['#FFCA28','#E53935','#1E88E5','#43A047','#8E24AA','#FB8C00'];
  for (let i = 0; i < 28; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText =
      'left:' + rnd(10, 90) + '%;' +
      'top:' + rnd(5, 40) + '%;' +
      'background:' + colors[rnd(0, colors.length-1)] + ';' +
      'width:' + rnd(6,12) + 'px;' +
      'height:' + rnd(6,12) + 'px;' +
      'animation-duration:' + (0.6 + Math.random() * 0.8) + 's;' +
      'animation-delay:' + (Math.random() * 0.3) + 's;' +
      'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';';
    arena.appendChild(piece);
    setTimeout(() => { if (piece.parentNode) piece.remove(); }, 1400);
  }
}

// ── Sound effects (Web Audio API — no files needed) ───────
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return audioCtx;
}

function playTone(freq, type, duration, delay, gainVal) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime + (delay||0));
  gain.gain.setValueAtTime(gainVal||0.2, ctx.currentTime + (delay||0));
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (delay||0) + duration);
  osc.start(ctx.currentTime + (delay||0));
  osc.stop(ctx.currentTime + (delay||0) + duration);
}

function playSuccessSound() {
  // Happy ascending arpeggio: C E G C
  [[523,0],[659,0.12],[784,0.24],[1047,0.36]].forEach(([f,d]) => playTone(f,'sine',0.18,d,0.18));
}

function playWrongSound() {
  // Low dull thud
  playTone(200, 'triangle', 0.25, 0, 0.15);
  playTone(150, 'triangle', 0.25, 0.1, 0.1);
}

function playMemoMatchSound() {
  // Joyful 5-note fanfare: C-E-G-E-C high
  [[523,0],[659,0.1],[784,0.2],[1047,0.32],[1319,0.44]].forEach(([f,d]) => playTone(f,'sine',0.22,d,0.22));
  // add sparkle high note
  playTone(1568, 'sine', 0.15, 0.55, 0.15);
}

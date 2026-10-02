// ── RESTA INTERACTIVA ─────────────────────────────────────
const RESTA2_EMOJIS = ['🍎','⭐','🐱','🌸','🚗','🦋','🐸','🍕','🐶','🍓','❤️','🐰','🌈','🎈','🍊'];
// Niveles cortos (5 ejercicios), igual que Suma:
// N1 sacar dibujitos · N2 números con recta numérica (saltos hacia atrás) · N3 problemita leído en voz alta.
const RESTA2_LEVELS = [
  { mode:'dibujos',  rounds:5, coins:3, icon:'🍎', name:'Con dibujitos', label:'Nivel 1 — con dibujitos' },
  { mode:'recta',    rounds:5, coins:4, icon:'📏', name:'Con números',   label:'Nivel 2 — con números' },
  { mode:'problema', rounds:5, coins:5, icon:'📖', name:'Problemitas',   label:'Nivel 3 — problemitas' },
];
const RESTA2_TIPS = {
  dibujos:  '💡 Tocá los que se van y contá los que quedan.',
  recta:    '💡 Empezá en el número naranja y saltá hacia atrás.',
  problema: '💡 Tocá 🔊 para escuchar el problema otra vez.',
};
// Reutiliza las cosas de Suma (SUMA2_COSAS)
const RESTA2_PROBLEMAS = [
  (a,b,c) => ['Verita tiene '+a+' '+c.n+'.', 'Regala '+b+'.', '¿'+(c.f?'Cuántas':'Cuántos')+' le quedan?'],
  (a,b,c) => ['En la caja hay '+a+' '+c.n+'.', 'Verita saca '+b+'.', '¿'+(c.f?'Cuántas':'Cuántos')+' quedan?'],
  (a,b,c) => ['Verita junta '+a+' '+c.n+'.', 'Pierde '+b+'.', '¿'+(c.f?'Cuántas':'Cuántos')+' le quedan?'],
];
let resta2 = { level:1, done:0, hits:0, score:0, a:0, b:0, answered:false, removed:0, hops:0, emoji:'🍎', problem:'' };

function resta2Cfg() { return RESTA2_LEVELS[resta2.level-1]; }

misionRegistrar('resta', {
  overlay:'resta2-overlay', arena:'resta2-arena',
  emoji:'🍎➖🍎', title:'¡Restamos juntas!', festejo:'Hoy restaste un montón',
  levels: RESTA2_LEVELS, start: startResta2,
});

function initResta2() {
  misionInicio('resta');
  updateResta2UI();
}

function startResta2(level) {
  resta2 = { level: level || 1, done:0, hits:0, score: resta2.score || 0, a:0, b:0, answered:false, removed:0, hops:0, emoji:'🍎', problem:'' };
  misionOcultar('resta');
  const mode = resta2Cfg().mode;
  ['dibujos','recta','problema'].forEach(m => {
    if (gei('resta2-'+m)) gei('resta2-'+m).style.display = (m === mode) ? '' : 'none';
  });
  if (gei('resta2-removehint')) gei('resta2-removehint').style.display = (mode === 'problema') ? 'none' : '';
  if (gei('resta2-tip')) gei('resta2-tip').textContent = RESTA2_TIPS[mode];
  updateResta2UI();
  nextResta2();
}

function updateResta2UI() {
  const cfg = resta2Cfg();
  if (gei('resta2-level-label')) gei('resta2-level-label').textContent = cfg.label;
  if (gei('resta2-hits-disp'))   gei('resta2-hits-disp').textContent   = resta2.hits+'/'+cfg.rounds;
  if (gei('resta2-score-disp'))  gei('resta2-score-disp').textContent  = String(resta2.score);
  const pct = Math.min((resta2.done/cfg.rounds)*100,100);
  if (gei('resta2-prog-fill'))   gei('resta2-prog-fill').style.width   = pct+'%';
  if (gei('resta2-prog-label'))  gei('resta2-prog-label').textContent  = resta2.done+' / '+cfg.rounds;
  const lit = resta2.hits>=4?3 : resta2.hits>=2?2 : resta2.hits>=1?1 : 0;
  if (gei('resta2-stars')) gei('resta2-stars').textContent = ['☆☆☆','⭐☆☆','⭐⭐☆','⭐⭐⭐'][lit];
}

function nextResta2() {
  resta2.answered = false;
  resta2.removed  = 0;
  resta2.hops     = 0;
  const mode = resta2Cfg().mode;
  // hasta 10 (entra en la recta), sacando como mucho 5, sin repetir el anterior
  const prevA = resta2.a, prevB = resta2.b;
  do {
    resta2.a = rnd(3, 10);
    resta2.b = rnd(1, Math.min(5, resta2.a - 1));
  } while (resta2.a === prevA && resta2.b === prevB);
  const result = resta2.a - resta2.b;

  if (gei('resta2-eqA')) gei('resta2-eqA').textContent = String(resta2.a);
  if (gei('resta2-eqB')) gei('resta2-eqB').textContent = String(resta2.b);
  if (gei('resta2-eqQ')) { const q=gei('resta2-eqQ'); q.textContent='?'; q.style.background='#E8F5E9'; q.style.borderColor='#66BB6A'; q.style.color='#66BB6A'; }
  // En los problemitas la cuenta se muestra recién al responder
  if (gei('resta2-equation')) gei('resta2-equation').style.display = (mode === 'problema') ? 'none' : '';

  if (mode === 'dibujos') renderResta2Group();
  else if (mode === 'recta') renderResta2Recta();
  else renderResta2Problema();
  updateRemoveHint();

  // 3 opciones grandes
  const opts = new Set([result]);
  while (opts.size < 3) {
    const d = result + [-2,-1,1,2,3][rnd(0,4)];
    if (d >= 0 && d !== result) opts.add(d);
  }
  const optsEl = gei('resta2-opts');
  if (optsEl) {
    optsEl.innerHTML = '';
    [...opts].sort(()=>Math.random()-.5).forEach(v => {
      const btn = document.createElement('button');
      btn.className = 'resta2-opt';
      btn.textContent = String(v);
      btn.onclick = () => onResta2Answer(btn, v, result);
      optsEl.appendChild(btn);
    });
  }

  const fb = gei('resta2-feedback');
  if (fb) { fb.textContent=''; fb.className='resta2-feedback'; }
}

function renderResta2Group() {
  resta2.emoji = RESTA2_EMOJIS[rnd(0, RESTA2_EMOJIS.length-1)];
  if (gei('resta2-grouptitle')) gei('resta2-grouptitle').textContent = 'Tenemos ' + resta2.a + ':';
  const grp = gei('resta2-group');
  if (!grp) return;
  grp.innerHTML = '';
  for (let i = 0; i < resta2.a; i++) {
    const span = document.createElement('span');
    span.className = 'resta2-obj';
    span.textContent = resta2.emoji;
    span.style.animationDelay = (i*0.04)+'s';
    span.onclick = () => {
      if (resta2.answered) return;
      if (span.classList.contains('removed')) {
        // un-remove
        span.classList.remove('removed');
        resta2.removed--;
      } else {
        if (resta2.removed >= resta2.b) return; // can't remove more than b
        span.classList.add('removed');
        resta2.removed++;
        playTone(400 - resta2.removed*30, 'triangle', 0.12, 0, 0.1); // descending tone
      }
      updateRemoveHint();
    };
    grp.appendChild(span);
  }
}

// Recta numérica 0–10: arranca en "a" y cada toque salta −1
function renderResta2Recta() {
  const el = gei('resta2-recta-line');
  if (!el) return;
  el.innerHTML = '';
  for (let n = 0; n <= 10; n++) {
    const c = document.createElement('div');
    c.className = 'suma2-recta-cell' + (n === resta2.a ? ' start' : '');
    c.id = 'resta2-rc-' + n;
    c.innerHTML = '<span class="suma2-recta-hop"></span><span class="suma2-recta-num">' + n + '</span>';
    el.appendChild(c);
  }
  el.onclick = resta2Saltar;
}

function resta2MarcarSalto(n) {
  const c = gei('resta2-rc-' + n);
  if (!c) return;
  c.classList.add('hopped-back');
  const h = c.querySelector('.suma2-recta-hop');
  if (h) h.textContent = '−1';
}

function resta2Saltar() {
  if (resta2.answered || resta2.hops >= resta2.b) return;
  resta2.hops++;
  resta2MarcarSalto(resta2.a - resta2.hops);
  playTone(400 - resta2.hops*30, 'triangle', 0.12, 0, 0.1);
  updateRemoveHint();
}

function renderResta2Problema() {
  const cosa  = SUMA2_COSAS[rnd(0, SUMA2_COSAS.length-1)];
  const lines = RESTA2_PROBLEMAS[rnd(0, RESTA2_PROBLEMAS.length-1)](resta2.a, resta2.b, cosa);
  resta2.problem = lines.join(' ');
  if (gei('resta2-prob-emoji')) gei('resta2-prob-emoji').textContent = cosa.e;
  if (gei('resta2-prob-text')) {
    gei('resta2-prob-text').innerHTML = lines.map(l =>
      '<div>' + l.replace(/\d+/g, m => '<b class="suma2-pnum">' + m + '</b>') + '</div>'
    ).join('');
  }
  setTimeout(() => {
    if (vozCurrentScreen === 'resta' && MISIONES.resta.pantalla === 'juego' && !resta2.answered) vozLeer(resta2.problem);
  }, 500);
}

function updateRemoveHint() {
  const hint = gei('resta2-removehint');
  if (!hint) return;
  const mode = resta2Cfg().mode;
  if (mode === 'recta') {
    const n = resta2.a - resta2.hops;
    if (resta2.hops >= resta2.b) {
      hint.textContent = '✅ ¡Llegaste al ' + n + '! Ahora elegí el número';
      hint.className = 'resta2-removehint done';
    } else if (resta2.hops === 0) {
      hint.textContent = '👆 Empezá en el ' + resta2.a + ' y tocá la recta ' + resta2.b + (resta2.b === 1 ? ' vez' : ' veces');
      hint.className = 'resta2-removehint';
    } else {
      hint.textContent = '👆 Saltaste ' + resta2.hops + ' para atrás… ¡otra vez!';
      hint.className = 'resta2-removehint';
    }
    return;
  }
  const left = resta2.a - resta2.removed;
  if (resta2.removed >= resta2.b) {
    hint.textContent = '✅ ¡Sacaste ' + resta2.b + '! Quedan ' + left + '. Elegí ese número';
    hint.className = 'resta2-removehint done';
  } else {
    hint.textContent = '👆 Sacá ' + resta2.b + ' (llevás ' + resta2.removed + ')';
    hint.className = 'resta2-removehint';
  }
}

function onResta2Answer(btn, val, result) {
  if (resta2.answered) return;
  resta2.answered = true;
  document.querySelectorAll('.resta2-opt').forEach(b => b.disabled = true);
  const fb   = gei('resta2-feedback');
  const q    = gei('resta2-eqQ');
  const mode = resta2Cfg().mode;

  // Mostrar la cuenta resuelta y completar el apoyo visual
  if (gei('resta2-equation')) gei('resta2-equation').style.display = '';
  if (q) { q.textContent = result; q.style.background='#C8E6C9'; q.style.borderColor='#43A047'; q.style.color='#1B5E20'; }
  if (mode === 'dibujos') {
    const objs = document.querySelectorAll('.resta2-obj');
    let r = resta2.removed;
    objs.forEach(o => { if (r < resta2.b && !o.classList.contains('removed')) { o.classList.add('removed'); r++; } });
  } else if (mode === 'recta') {
    for (let n = resta2.a - 1; n >= result; n--) resta2MarcarSalto(n);
  }

  const ok = (val === result);
  if (ok) {
    btn.classList.add('correct');
    if (fb) { fb.textContent = '🎉 ¡Muy bien! ' + resta2.a + ' − ' + resta2.b + ' = ' + result; fb.className='resta2-feedback correct'; }
    playSuccessSound();
    launchConfettiIn('resta2-arena');
    resta2.hits++;
    resta2.score += 10 + resta2.level*2;
    updateCoins(2, null);
    misionActualizarMonedas();
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('.resta2-opt').forEach(b => { if (parseInt(b.textContent)===result) b.classList.add('correct'); });
    if (fb) { fb.textContent = 'Era ' + result + ': ' + resta2.a + ' − ' + resta2.b + ' = ' + result + '. ¡Vamos con otra! 😊'; fb.className='resta2-feedback wrong'; }
    playWrongSound();
  }

  resta2.done++;
  updateResta2UI();
  const espera = ok ? 1400 : (mode === 'problema' ? 2600 : 2000);
  if (resta2.done >= resta2Cfg().rounds) {
    setTimeout(() => {
      if (fb) { fb.textContent=''; fb.className='resta2-feedback'; }
      misionCumplida('resta', resta2.level, resta2.hits, resta2Cfg().rounds);
    }, espera);
  } else {
    setTimeout(nextResta2, espera);
  }
}

// Aliases so nothing else breaks
function newResta() { /* replaced by interactive resta2 */ }
function checkResta() { /* replaced */ }

// ── SUMA INTERACTIVA ──────────────────────────────────────
const SUMA2_EMOJIS = ['🍎','⭐','🐱','🌸','🚗','🦋','🐸','🍕','🐶','🍓','❤️','🐰','🌈','🎈','🍊'];

// Niveles cortos (5 ejercicios) — cada uno es una "misión" con su propio festejo.
// N1 visual y concreto · N2 números con recta numérica · N3 problemita leído en voz alta.
const SUMA2_LEVELS = [
  { mode:'dibujos',  rounds:5, coins:3, icon:'🍎', name:'Con dibujitos', label:'Nivel 1 — con dibujitos' },
  { mode:'recta',    rounds:5, coins:4, icon:'📏', name:'Con números',   label:'Nivel 2 — con números' },
  { mode:'problema', rounds:5, coins:5, icon:'📖', name:'Problemitas',   label:'Nivel 3 — problemitas' },
];
const SUMA2_TIPS = {
  dibujos:  '💡 Contá los dos grupos juntos y elegí el número.',
  recta:    '💡 Empezá en el número naranja y saltá hacia adelante.',
  problema: '💡 Tocá 🔊 para escuchar el problema otra vez.',
};
// Cosas para los problemitas (f = femenino, para decir "¿Cuántas…?")
const SUMA2_COSAS = [
  { e:'🧸', n:'ositos',     f:false },
  { e:'🌸', n:'flores',     f:true  },
  { e:'🍪', n:'galletitas', f:true  },
  { e:'⭐', n:'estrellas',  f:true  },
  { e:'🍓', n:'frutillas',  f:true  },
  { e:'🎈', n:'globos',     f:false },
  { e:'🚗', n:'autitos',    f:false },
  { e:'🐟', n:'pececitos',  f:false },
];
const SUMA2_PROBLEMAS = [
  (a,b,c) => ['Verita tiene '+a+' '+c.n+'.', 'Le regalan '+b+' más.', '¿'+(c.f?'Cuántas':'Cuántos')+' tiene ahora?'],
  (a,b,c) => ['En la caja hay '+a+' '+c.n+'.', 'Verita pone '+b+' más.', '¿'+(c.f?'Cuántas':'Cuántos')+' hay ahora?'],
  (a,b,c) => ['Verita junta '+a+' '+c.n+'.', 'Su amiga junta '+b+'.', '¿'+(c.f?'Cuántas':'Cuántos')+' juntaron?'],
];

let suma2 = { level:1, done:0, hits:0, score:0, a:0, b:0, answered:false, counted:0, hops:0, emoji:'🍎', problem:'' };

function suma2Cfg() { return SUMA2_LEVELS[suma2.level-1]; }

misionRegistrar('suma', {
  overlay:'suma2-overlay', arena:'suma2-arena',
  emoji:'🍎➕⭐', title:'¡Sumamos juntas!', festejo:'Hoy sumaste un montón',
  levels: SUMA2_LEVELS, start: startSuma2,
});

function initSuma2() {
  misionInicio('suma');
  updateSuma2UI();
}

function startSuma2(level) {
  suma2 = { level: level || 1, done:0, hits:0, score: suma2.score || 0, a:0, b:0, answered:false, counted:0, hops:0, emoji:'🍎', problem:'' };
  misionOcultar('suma');
  const mode = suma2Cfg().mode;
  ['dibujos','recta','problema'].forEach(m => {
    if (gei('suma2-'+m)) gei('suma2-'+m).style.display = (m === mode) ? '' : 'none';
  });
  if (gei('suma2-counthint')) gei('suma2-counthint').style.display = (mode === 'problema') ? 'none' : '';
  if (gei('suma2-tip')) gei('suma2-tip').textContent = SUMA2_TIPS[mode];
  updateSuma2UI();
  nextSuma2();
}

function updateSuma2UI() {
  const cfg = suma2Cfg();
  if (gei('suma2-level-label')) gei('suma2-level-label').textContent = cfg.label;
  if (gei('suma2-hits-disp'))   gei('suma2-hits-disp').textContent   = suma2.hits+'/'+cfg.rounds;
  if (gei('suma2-score-disp'))  gei('suma2-score-disp').textContent  = String(suma2.score);
  const pct = Math.min((suma2.done/cfg.rounds)*100,100);
  if (gei('suma2-prog-fill'))   gei('suma2-prog-fill').style.width   = pct+'%';
  if (gei('suma2-prog-label'))  gei('suma2-prog-label').textContent  = suma2.done+' / '+cfg.rounds;
  const lit = suma2.hits>=4?3 : suma2.hits>=2?2 : suma2.hits>=1?1 : 0;
  if (gei('suma2-stars')) gei('suma2-stars').textContent = ['☆☆☆','⭐☆☆','⭐⭐☆','⭐⭐⭐'][lit];
}

function nextSuma2() {
  suma2.answered = false;
  suma2.counted  = 0;
  suma2.hops     = 0;
  const mode = suma2Cfg().mode;
  // números chicos para que todo se pueda contar (total ≤ 10), sin repetir el anterior
  const prevA = suma2.a, prevB = suma2.b;
  do {
    suma2.a = rnd(mode === 'problema' ? 2 : 1, 5);
    suma2.b = rnd(1, 5);
  } while (suma2.a === prevA && suma2.b === prevB);
  const total = suma2.a + suma2.b;

  // Ecuación (en los problemitas se muestra recién al responder)
  if (gei('suma2-eqA')) gei('suma2-eqA').textContent = String(suma2.a);
  if (gei('suma2-eqB')) gei('suma2-eqB').textContent = String(suma2.b);
  if (gei('suma2-equation')) {
    gei('suma2-equation').style.display = (mode === 'problema') ? 'none' : '';
    const q = gei('suma2-equation').querySelector('.suma2-eq-q');
    if (q) { q.textContent = '?'; q.style.background='#E8F5E9'; q.style.borderColor='#66BB6A'; q.style.color='#66BB6A'; }
  }

  const hint = gei('suma2-counthint');
  if (mode === 'dibujos') {
    suma2.emoji = SUMA2_EMOJIS[rnd(0, SUMA2_EMOJIS.length-1)];
    renderSuma2Group('suma2-groupA', suma2.a);
    renderSuma2Group('suma2-groupB', suma2.b);
    if (hint) { hint.textContent = '👆 Tocá los objetos para contarlos juntos'; hint.className = 'suma2-counthint'; }
  } else if (mode === 'recta') {
    renderSuma2Recta();
    if (hint) { hint.textContent = '👆 Empezá en el ' + suma2.a + ' y tocá la recta ' + suma2.b + (suma2.b === 1 ? ' vez' : ' veces'); hint.className = 'suma2-counthint'; }
  } else {
    renderSuma2Problema();
  }

  // 3 opciones grandes
  const opts = new Set([total]);
  while (opts.size < 3) {
    const d = total + [-2,-1,1,2,3][rnd(0,4)];
    if (d > 0 && d !== total) opts.add(d);
  }
  const optsEl = gei('suma2-opts');
  if (optsEl) {
    optsEl.innerHTML = '';
    [...opts].sort(()=>Math.random()-.5).forEach(v => {
      const btn = document.createElement('button');
      btn.className = 'suma2-opt';
      btn.textContent = String(v);
      btn.onclick = () => onSuma2Answer(btn, v, total);
      optsEl.appendChild(btn);
    });
  }

  const fb = gei('suma2-feedback');
  if (fb) { fb.textContent=''; fb.className='suma2-feedback'; }
}

function renderSuma2Group(id, n) {
  const el = gei(id);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const span = document.createElement('span');
    span.className = 'suma2-obj';
    span.textContent = suma2.emoji;
    span.style.animationDelay = (i*0.05)+'s';
    span.onclick = () => {
      if (span.classList.contains('counted')) return;
      span.classList.add('counted');
      suma2.counted++;
      playTone(500 + suma2.counted*60, 'sine', 0.1, 0, 0.1); // rising count tone
      const total = suma2.a + suma2.b;
      const hint = gei('suma2-counthint');
      if (hint) {
        if (suma2.counted >= total) {
          hint.textContent = '✅ ¡Contaste ' + total + ' en total! Ahora elegí el número';
          hint.className = 'suma2-counthint done';
        } else {
          hint.textContent = '👆 Contaste ' + suma2.counted + '… seguí contando';
          hint.className = 'suma2-counthint';
        }
      }
    };
    el.appendChild(span);
  }
}

// Recta numérica 0–10: arranca en "a" y cada toque salta +1
function renderSuma2Recta() {
  const el = gei('suma2-recta-line');
  if (!el) return;
  el.innerHTML = '';
  for (let n = 0; n <= 10; n++) {
    const c = document.createElement('div');
    c.className = 'suma2-recta-cell' + (n === suma2.a ? ' start' : '');
    c.id = 'suma2-rc-' + n;
    c.innerHTML = '<span class="suma2-recta-hop"></span><span class="suma2-recta-num">' + n + '</span>';
    el.appendChild(c);
  }
  el.onclick = suma2Saltar;
}

function suma2Saltar() {
  if (suma2.answered || suma2.hops >= suma2.b) return;
  suma2.hops++;
  const n = suma2.a + suma2.hops;
  const c = gei('suma2-rc-' + n);
  if (c) {
    c.classList.add('hopped');
    const h = c.querySelector('.suma2-recta-hop');
    if (h) h.textContent = '+1';
  }
  playTone(500 + suma2.hops*60, 'sine', 0.1, 0, 0.1);
  const hint = gei('suma2-counthint');
  if (hint) {
    if (suma2.hops >= suma2.b) {
      hint.textContent = '✅ ¡Llegaste al ' + n + '! Ahora elegí el número';
      hint.className = 'suma2-counthint done';
    } else {
      hint.textContent = '👆 Saltaste ' + suma2.hops + '… ¡otra vez!';
      hint.className = 'suma2-counthint';
    }
  }
}

// Problemita corto: se lee en voz alta solo al aparecer
function renderSuma2Problema() {
  const cosa  = SUMA2_COSAS[rnd(0, SUMA2_COSAS.length-1)];
  const lines = SUMA2_PROBLEMAS[rnd(0, SUMA2_PROBLEMAS.length-1)](suma2.a, suma2.b, cosa);
  suma2.problem = lines.join(' ');
  if (gei('suma2-prob-emoji')) gei('suma2-prob-emoji').textContent = cosa.e;
  if (gei('suma2-prob-text')) {
    gei('suma2-prob-text').innerHTML = lines.map(l =>
      '<div>' + l.replace(/\d+/g, m => '<b class="suma2-pnum">' + m + '</b>') + '</div>'
    ).join('');
  }
  setTimeout(() => {
    if (vozCurrentScreen === 'suma' && MISIONES.suma.pantalla === 'juego' && !suma2.answered) vozLeer(suma2.problem);
  }, 500);
}

function onSuma2Answer(btn, val, total) {
  if (suma2.answered) return;
  suma2.answered = true;
  document.querySelectorAll('.suma2-opt').forEach(b => b.disabled = true);
  const fb   = gei('suma2-feedback');
  const mode = suma2Cfg().mode;

  // Mostrar la cuenta resuelta (en los problemitas aparece recién ahora)
  if (gei('suma2-equation')) gei('suma2-equation').style.display = '';
  const q = gei('suma2-equation') ? gei('suma2-equation').querySelector('.suma2-eq-q') : null;
  if (q) { q.textContent = total; q.style.background='#C8E6C9'; q.style.borderColor='#43A047'; q.style.color='#1B5E20'; }

  // Completar el apoyo visual para que vea el resultado
  if (mode === 'dibujos') {
    document.querySelectorAll('.suma2-obj').forEach((o,i)=> setTimeout(()=>o.classList.add('counted'), i*40));
  } else if (mode === 'recta') {
    for (let n = suma2.a + 1; n <= total; n++) {
      const c = gei('suma2-rc-' + n);
      if (c) { c.classList.add('hopped'); const h = c.querySelector('.suma2-recta-hop'); if (h) h.textContent = '+1'; }
    }
  }

  const ok = (val === total);
  if (ok) {
    btn.classList.add('correct');
    if (fb) { fb.textContent = '🎉 ¡Muy bien! ' + suma2.a + ' + ' + suma2.b + ' = ' + total; fb.className='suma2-feedback correct'; }
    playSuccessSound();
    launchConfettiIn('suma2-arena');
    suma2.hits++;
    suma2.score += 10 + suma2.level*2;
    updateCoins(2, null);
    if (gei('coin-display')) gei('coin-display').textContent = String(coins);
    if (gei('coins-big'))    gei('coins-big').textContent    = coins+' 🪙';
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('.suma2-opt').forEach(b => { if (parseInt(b.textContent)===total) b.classList.add('correct'); });
    if (fb) { fb.textContent = 'Era ' + total + ': ' + suma2.a + ' + ' + suma2.b + ' = ' + total + '. ¡Vamos con otra! 😊'; fb.className='suma2-feedback wrong'; }
    playWrongSound();
  }

  suma2.done++;
  updateSuma2UI();
  const espera = ok ? 1400 : (mode === 'problema' ? 2600 : 2000);
  if (suma2.done >= suma2Cfg().rounds) {
    setTimeout(() => {
      if (fb) { fb.textContent=''; fb.className='suma2-feedback'; }
      misionCumplida('suma', suma2.level, suma2.hits, suma2Cfg().rounds);
    }, espera);
  } else {
    setTimeout(nextSuma2, espera);
  }
}

// Generic confetti into any arena id
function launchConfettiIn(arenaId) {
  const arena = gei(arenaId);
  if (!arena) return;
  const colors = ['#FFCA28','#E53935','#1E88E5','#43A047','#8E24AA','#FB8C00'];
  for (let i=0;i<24;i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = 'left:'+rnd(10,90)+'%;top:'+rnd(5,35)+'%;background:'+colors[rnd(0,colors.length-1)]+';width:'+rnd(6,12)+'px;height:'+rnd(6,12)+'px;animation-duration:'+(0.6+Math.random()*0.8)+'s;animation-delay:'+(Math.random()*0.3)+'s;border-radius:'+(Math.random()>0.5?'50%':'2px')+';';
    arena.appendChild(p);
    setTimeout(()=>{ if(p.parentNode) p.remove(); }, 1400);
  }
}

// Keep old function names as aliases so nothing else breaks
function newSuma() { /* replaced by interactive suma2 */ }
function checkSuma() { /* replaced */ }

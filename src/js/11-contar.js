// ── CONTAR OBJETOS ────────────────────────────────────────
const CONTAR_SETS = [
  // emoji, theme name, theme color
  { emoji:'⭐', name:'estrellas',  color:'#F9A825' },
  { emoji:'🍎', name:'manzanas',   color:'#E53935' },
  { emoji:'🐱', name:'gatitos',    color:'#FB8C00' },
  { emoji:'🌸', name:'flores',     color:'#E91E63' },
  { emoji:'🚗', name:'autitos',    color:'#1E88E5' },
  { emoji:'🦋', name:'mariposas',  color:'#8E24AA' },
  { emoji:'🐸', name:'ranitas',    color:'#43A047' },
  { emoji:'🍕', name:'pizzas',     color:'#FF7043' },
  { emoji:'🐶', name:'perritos',   color:'#795548' },
  { emoji:'🍭', name:'chupetines', color:'#EC407A' },
  { emoji:'🌈', name:'arcoiris',   color:'#00ACC1' },
  { emoji:'🎈', name:'globos',     color:'#AB47BC' },
];

const CONTAR_LEVELS = [
  { rounds:5, maxCount:5,  coins:3, icon:'🍎', name:'Hasta 5',  label:'Nivel 1 — hasta 5',  opts:3 },
  { rounds:5, maxCount:10, coins:4, icon:'⭐', name:'Hasta 10', label:'Nivel 2 — hasta 10', opts:3 },
  { rounds:5, maxCount:15, coins:5, icon:'🌈', name:'Hasta 15', label:'Nivel 3 — hasta 15', opts:4 },
];
misionRegistrar('contar', {
  overlay:'contar-overlay',
  emoji:'⭐🌟⭐', title:'¡Contar Objetos!', festejo:'Hoy contaste un montón',
  levels: CONTAR_LEVELS, start: startContar,
});

let ct = { level:1, done:0, hits:0, score:0, count:0, answered:false };

function initContar() {
  misionInicio('contar');
  updateContarUI();
}

function startContar(level) {
  ct = { level: level || 1, done:0, hits:0, score: ct.score || 0, count:0, answered:false };
  misionOcultar('contar');
  updateContarUI();
  nextContarProblem();
}

function updateContarUI() {
  const cfg = CONTAR_LEVELS[Math.min(ct.level,3)-1];
  if (gei('contar-level-label')) gei('contar-level-label').textContent = cfg.label;
  if (gei('contar-hits-disp'))   gei('contar-hits-disp').textContent   = ct.hits+'/'+cfg.rounds;
  if (gei('contar-score-disp'))  gei('contar-score-disp').textContent  = String(ct.score);
  const pct = Math.min((ct.done/cfg.rounds)*100,100);
  if (gei('contar-prog-fill'))   gei('contar-prog-fill').style.width   = pct+'%';
  if (gei('contar-prog-label'))  gei('contar-prog-label').textContent  = ct.done+' / '+cfg.rounds;
  const lit = ct.hits>=4?3 : ct.hits>=2?2 : ct.hits>=1?1 : 0;
  if (gei('contar-stars')) gei('contar-stars').textContent = ['☆☆☆','⭐☆☆','⭐⭐☆','⭐⭐⭐'][lit];
}

function nextContarProblem() {
  ct.answered = false;
  const cfg = CONTAR_LEVELS[Math.min(ct.level,3)-1];
  const set  = CONTAR_SETS[rnd(0, CONTAR_SETS.length-1)];
  ct.count   = rnd(1, cfg.maxCount);

  // Update question
  const q = gei('contar-question');
  if (q) q.innerHTML = '¿Cuántos <strong>' + set.name + '</strong> hay?';

  // Render objects with staggered animation
  const objsEl = gei('contar-objects');
  if (objsEl) {
    objsEl.innerHTML = '';
    for (let i = 0; i < ct.count; i++) {
      const span = document.createElement('span');
      span.className = 'contar-obj';
      span.textContent = set.emoji;
      span.style.animationDelay = (i * 0.06) + 's';
      // slight random rotation for natural feel
      span.style.transform = 'rotate(' + (rnd(-8,8)) + 'deg)';
      objsEl.appendChild(span);
    }
  }

  // Build options
  const optsEl = gei('contar-opts');
  if (optsEl) {
    optsEl.innerHTML = '';
    const wrong = new Set([ct.count]);
    while (wrong.size < cfg.opts) {
      const w = ct.count + [-3,-2,-1,1,2,3][rnd(0,5)];
      if (w > 0 && w !== ct.count) wrong.add(w);
    }
    const shuffled = [...wrong].sort(() => Math.random() - 0.5);
    shuffled.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'contar-opt';
      btn.textContent = String(val);
      btn.style.borderColor = set.color;
      btn.onclick = () => onContarAnswer(btn, val, set);
      optsEl.appendChild(btn);
    });
  }

  // Clear feedback
  const fb = gei('contar-feedback');
  if (fb) { fb.textContent = ''; fb.className = 'contar-feedback'; }
}

function onContarAnswer(btn, val, set) {
  if (ct.answered) return;
  ct.answered = true;
  document.querySelectorAll('.contar-opt').forEach(b => b.disabled = true);

  const fb = gei('contar-feedback');

  if (val === ct.count) {
    btn.classList.add('correct');

    // Bounce all objects
    document.querySelectorAll('.contar-obj').forEach((obj, i) => {
      setTimeout(() => obj.classList.add('celebrate'), i * 40);
    });

    // Confetti burst
    launchConfetti();

    // Play success sound
    playSuccessSound();

    if (fb) {
      fb.textContent = '🎉 ¡Sí! Hay ' + ct.count + ' ' + set.name + '. ¡Muy bien!';
      fb.className = 'contar-feedback correct';
    }

    ct.hits++;
    ct.score += 10 + ct.level * 2;
    updateCoins(2, null);
    if (gei('coin-display')) gei('coin-display').textContent = String(coins);
    if (gei('coins-big'))    gei('coins-big').textContent    = coins + ' 🪙';
  } else {
    btn.classList.add('wrong');
    // Show correct answer
    document.querySelectorAll('.contar-opt').forEach(b => {
      if (parseInt(b.textContent) === ct.count) b.classList.add('correct');
    });
    playWrongSound();
    if (fb) {
      fb.textContent = 'Son ' + ct.count + '… ¡Contá de nuevo la próxima! 😊';
      fb.className = 'contar-feedback wrong';
    }
  }

  const ok = (val === ct.count);
  // Cada ejercicio cuenta (acierte o no): la misión siempre se termina
  ct.done++;
  updateContarUI();
  if (ct.done >= CONTAR_LEVELS[ct.level-1].rounds) {
    setTimeout(() => {
      if (fb) { fb.textContent=''; fb.className='contar-feedback'; }
      misionCumplida('contar', ct.level, ct.hits, CONTAR_LEVELS[ct.level-1].rounds);
    }, ok ? 1500 : 1600);
  } else {
    setTimeout(nextContarProblem, ok ? 1500 : 1600);
  }
}

// ── GRANJA MÁGICA ─────────────────────────────────────────
const GRANJA_ANIMALS = {
  2: ['🐑','🐑'], 3: ['🐔','🐔'], 4: ['🐖','🐖'], 5: ['🐄','🐄']
};
// Rotate through different animals for variety
const ANIMAL_POOL = ['🐔','🐑','🐖','🐄','🐇','🐣','🦆','🐝'];
const GRANJA_LEVELS = [
  { tabla:2, coins:3, icon:'🐑', name:'Tabla del 2' },
  { tabla:3, coins:4, icon:'🐔', name:'Tabla del 3' },
  { tabla:4, coins:5, icon:'🐖', name:'Tabla del 4' },
  { tabla:5, coins:5, icon:'🐄', name:'Tabla del 5' },
];
misionRegistrar('granja', {
  overlay:'granja-overlay', bg:'rgba(0,60,0,0.9)',
  emoji:'🐔🐄🐑🐖', title:'¡Granja Mágica!', festejo:'Hoy multiplicaste un montón',
  levels: GRANJA_LEVELS, start: startGranja,
});

let gr = {
  tabla: 2,
  factor: 1,       // how many groups (1-5)
  hits: 0,
  score: 0,
  total: 5,        // ejercicios por tabla (una misión)
  done: 0,
  answered: false,
  animalIdx: 0,
};

function initGranja() {
  buildGranjaDecor();
  updateGranjaTablaUI();
  misionInicio('granja');
}

function buildGranjaDecor() {
  const arena = document.getElementById('granja-arena');
  if (arena.querySelector('.granja-sun')) return;
  // Sun
  const sun = document.createElement('div');
  sun.className = 'granja-sun';
  arena.appendChild(sun);
  // Clouds
  [[12,8,60,18],[28,4,90,14],[55,6,50,16]].forEach(([top,left,w,h]) => {
    const cl = document.createElement('div');
    cl.className = 'granja-cloud';
    cl.style.cssText = 'top:'+top+'px; left:'+left+'%; width:'+w+'px; height:'+h+'px;';
    arena.appendChild(cl);
  });
}

function selectTabla(n) {
  gr.tabla = n;
  gr.hits = 0;
  gr.done = 0;
  gr.answered = false;
  gr.animalIdx = 0;
  document.querySelectorAll('.tabla-pill').forEach(p => p.classList.remove('active'));
  const btn = document.getElementById('tab-' + n);
  if (btn) btn.classList.add('active');
  updateGranjaTablaUI();
  updateGranjaProgress();
  misionOcultar('granja');
  nextGranjaProblem();
}

function startGranja(level) {
  selectTabla(GRANJA_LEVELS[(level || 1) - 1].tabla);
}

function updateGranjaTablaUI() {
  const lbl = gei('granja-tabla-label');
  if (lbl) lbl.textContent = 'Tabla del ' + gr.tabla;
}

function nextGranjaProblem() {
  gr.answered = false;
  // factor = number of groups (1 to 5), tabla = items per group
  gr.factor = rnd(1, 5);
  const total = gr.factor * gr.tabla;
  const emoji = ANIMAL_POOL[gr.animalIdx % ANIMAL_POOL.length];
  gr.animalIdx++;

  // Update question text
  const q = gei('granja-q');
  if (q) q.textContent = gr.factor + ' grupos de ' + gr.tabla + ' — ¿cuántos hay en total?';

  // Render groups
  const groupsEl = gei('granja-groups');
  if (groupsEl) {
    groupsEl.innerHTML = '';
    for (let g = 0; g < gr.factor; g++) {
      const box = document.createElement('div');
      box.className = 'granja-group';
      box.style.animationDelay = (g * 0.08) + 's';
      for (let a = 0; a < gr.tabla; a++) {
        const span = document.createElement('span');
        span.className = 'granja-animal';
        span.textContent = emoji;
        span.style.animationDelay = (Math.random() * 1.5) + 's';
        box.appendChild(span);
      }
      groupsEl.appendChild(box);
    }
  }

  // Build 4 options
  const opts = new Set([total]);
  let attempts = 0;
  while (opts.size < 4 && attempts < 50) {
    attempts++;
    const d = total + [-gr.tabla, gr.tabla, -1, 1, gr.tabla*2, -gr.tabla*2][rnd(0,5)];
    if (d > 0 && d !== total && d <= 30) opts.add(d);
  }
  // Fallback if not enough
  let extra = 1;
  while (opts.size < 4) { if (total + extra !== total) opts.add(total + extra); extra++; }
  const shuffled = [...opts].sort(() => Math.random() - 0.5);

  const optsEl = gei('granja-opts');
  if (optsEl) {
    optsEl.innerHTML = '';
    shuffled.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'granja-opt';
      btn.textContent = String(val);
      btn.onclick = () => onGranjaAnswer(btn, val, total);
      optsEl.appendChild(btn);
    });
  }

  // Clear feedback
  const fb = gei('granja-feedback');
  if (fb) { fb.textContent = ''; fb.className = 'granja-feedback'; }
}

function onGranjaAnswer(btn, val, total) {
  if (gr.answered) return;
  gr.answered = true;

  const allBtns = document.querySelectorAll('.granja-opt');
  allBtns.forEach(b => b.disabled = true);

  const fb = gei('granja-feedback');

  if (val === total) {
    btn.classList.add('correct');
    gr.hits++;
    gr.score += 10 + gr.tabla;
    updateCoins(2, null);
    if (gei('coin-display')) gei('coin-display').textContent = String(coins);
    if (gei('coins-big')) gei('coins-big').textContent = coins + ' 🪙';
    if (fb) {
      fb.textContent = '🎉 ¡Muy bien! ' + gr.factor + ' × ' + gr.tabla + ' = ' + total;
      fb.className = 'granja-feedback correct';
    }
  } else {
    btn.classList.add('wrong');
    // Highlight correct
    allBtns.forEach(b => { if (parseInt(b.textContent) === total) b.classList.add('correct'); });
    if (fb) {
      fb.textContent = 'La respuesta es ' + total + ' — ' + gr.factor + ' × ' + gr.tabla + ' = ' + total;
      fb.className = 'granja-feedback wrong';
    }
  }

  const ok = (val === total);
  // Cada ejercicio cuenta (acierte o no): la misión siempre se termina
  gr.done++;
  updateGranjaProgress();
  if (gr.done >= gr.total) {
    setTimeout(() => {
      if (fb) { fb.textContent=''; fb.className='granja-feedback'; }
      misionCumplida('granja', GRANJA_LEVELS.findIndex(l => l.tabla === gr.tabla) + 1, gr.hits, gr.total);
    }, ok ? 1100 : 1400);
  } else {
    setTimeout(nextGranjaProblem, ok ? 1100 : 1400);
  }

  if (gei('granja-score-disp')) gei('granja-score-disp').textContent = String(gr.score);
}

function updateGranjaProgress() {
  const pct = Math.min((gr.done / gr.total) * 100, 100);
  if (gei('granja-prog-fill')) gei('granja-prog-fill').style.width = pct + '%';
  if (gei('granja-prog-label')) gei('granja-prog-label').textContent = gr.done + ' / ' + gr.total;
  if (gei('granja-hits-disp')) gei('granja-hits-disp').textContent = gr.hits + '/' + gr.total;
  // Stars: 1 at 1 hit, 2 at 2, 3 at 4
  [1,2,3].forEach((s,i) => {
    const star = gei('gstar-' + s);
    if (star) star.className = 'granja-star' + (gr.hits >= [1,2,4][i] ? ' lit' : '');
  });
}

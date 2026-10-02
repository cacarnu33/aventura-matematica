// ── CONEJOS (DIVISIÓN) ───────────────────────────────────
// Levels: [divisors available, rounds needed]
const CN_LEVELS = [
  { divisors:[2,3],     rounds:5, coins:3, icon:'🥕', name:'Entre 2 y 3',    label:'Nivel 1 — dividir entre 2 y 3' },
  { divisors:[2,3,4],   rounds:5, coins:4, icon:'🐰', name:'Entre 2, 3 y 4', label:'Nivel 2 — dividir entre 2, 3 y 4' },
  { divisors:[2,3,4,5], rounds:5, coins:5, icon:'🌟', name:'Entre 2 y 5',    label:'Nivel 3 — dividir entre 2, 3, 4 y 5' },
];
misionRegistrar('conejos', {
  overlay:'conejos-overlay',
  emoji:'🐰🥕🐰', title:'¡Conejos y Zanahorias!', festejo:'Hoy repartiste un montón de zanahorias',
  levels: CN_LEVELS, start: startConejos,
});

let cn = {
  level: 1,
  done: 0,
  hits: 0,
  score: 0,
  answered: false,
  dividend: 0,   // total zanahorias
  divisor: 0,    // conejos
  quotient: 0,   // zanahorias por conejo
};

function initConejos() {
  misionInicio('conejos');
  updateConejosLevelLabel();
  updateConejosProgress();
}

function startConejos(level) {
  cn = { level: level || 1, done:0, hits:0, score: cn.score || 0, answered:false, dividend:0, divisor:0, quotient:0 };
  misionOcultar('conejos');
  updateConejosProgress();
  updateConejosLevelLabel();
  nextConejosProblem();
}

function updateConejosLevelLabel() {
  const cfg = CN_LEVELS[Math.min(cn.level,3)-1];
  if (gei('conejos-level-label')) gei('conejos-level-label').textContent = cfg.label;
}

function nextConejosProblem() {
  cn.answered = false;
  const cfg = CN_LEVELS[Math.min(cn.level,3)-1];
  // Pick divisor and quotient so dividend is clean
  cn.divisor   = cfg.divisors[rnd(0, cfg.divisors.length-1)];
  cn.quotient  = rnd(1, Math.min(5, Math.floor(20/cn.divisor)));
  cn.dividend  = cn.divisor * cn.quotient;

  // Title
  const title = gei('conejos-title');
  if (title) {
    const zEmoji = '🥕'.repeat(Math.min(cn.dividend, 8)) + (cn.dividend > 8 ? '…' : '');
    const cEmoji = '🐰'.repeat(cn.divisor);
    title.innerHTML =
      'Tenés <strong>' + cn.dividend + ' zanahorias</strong> ' + zEmoji + '<br>' +
      'Repartí entre <strong>' + cn.divisor + ' conejos</strong> ' + cEmoji + '<br>' +
      '<span style="font-size:0.9rem; font-weight:600; color:#388E3C;">¿Cuántas le toca a cada uno?</span>';
  }

  // Render zanahorias
  const zRow = gei('zanahorias-row');
  if (zRow) {
    zRow.innerHTML = '';
    for (let i = 0; i < cn.dividend; i++) {
      const z = document.createElement('span');
      z.className = 'zanahoria';
      z.textContent = '🥕';
      z.style.animationDelay = (i * 0.04) + 's';
      zRow.appendChild(z);
    }
  }

  // Render conejos
  const cRow = gei('conejos-row');
  if (cRow) {
    cRow.innerHTML = '';
    for (let c = 0; c < cn.divisor; c++) {
      const box = document.createElement('div');
      box.className = 'conejo-box';
      box.style.animationDelay = (c * 0.1) + 's';
      box.innerHTML =
        '<span class="conejo-emoji" style="animation-delay:' + (c*0.3) + 's">🐰</span>' +
        '<div class="conejo-zanahorias" id="cbox-' + c + '"></div>' +
        '<div class="conejo-label">conejo ' + (c+1) + '</div>';
      cRow.appendChild(box);
    }
  }

  // Build options: correct + distractors
  const opts = new Set([cn.quotient]);
  let tries = 0;
  while (opts.size < 4 && tries < 60) {
    tries++;
    const d = cn.quotient + [-2,-1,1,2,3][rnd(0,4)];
    if (d > 0 && d !== cn.quotient) opts.add(d);
  }
  let extra = 1;
  while (opts.size < 4) { opts.add(cn.quotient + extra); extra++; }
  const shuffled = [...opts].sort(() => Math.random()-0.5);

  const optsEl = gei('conejos-opts');
  if (optsEl) {
    optsEl.innerHTML = '';
    shuffled.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'conejos-opt';
      btn.textContent = String(val);
      btn.onclick = () => onConejosAnswer(btn, val);
      optsEl.appendChild(btn);
    });
  }

  // Clear feedback
  const fb = gei('conejos-feedback');
  if (fb) { fb.textContent = ''; fb.className = 'conejos-feedback'; }
}

function onConejosAnswer(btn, val) {
  if (cn.answered) return;
  cn.answered = true;

  document.querySelectorAll('.conejos-opt').forEach(b => b.disabled = true);
  const fb = gei('conejos-feedback');

  if (val === cn.quotient) {
    btn.classList.add('correct');
    cn.hits++;
    cn.score += 10 + cn.level * 3;
    updateCoins(2, null);
    if (gei('coin-display')) gei('coin-display').textContent = String(coins);
    if (gei('coins-big'))    gei('coins-big').textContent = coins + ' 🪙';

    // Animate: fill each conejo box with zanahorias
    for (let c = 0; c < cn.divisor; c++) {
      const box = gei('cbox-' + c);
      if (!box) continue;
      setTimeout(() => {
        box.innerHTML = '';
        for (let z = 0; z < cn.quotient; z++) {
          const span = document.createElement('span');
          span.className = 'conejo-z';
          span.textContent = '🥕';
          span.style.animationDelay = (z * 0.07) + 's';
          box.appendChild(span);
        }
      }, c * 150);
    }

    if (fb) {
      fb.textContent = '🎉 ¡Genial! ' + cn.dividend + ' ÷ ' + cn.divisor + ' = ' + cn.quotient + ' 🥕 por conejo';
      fb.className = 'conejos-feedback correct';
    }
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('.conejos-opt').forEach(b => {
      if (parseInt(b.textContent) === cn.quotient) b.classList.add('correct');
    });
    if (fb) {
      fb.textContent = 'La respuesta es ' + cn.quotient + ' — ' + cn.dividend + ' ÷ ' + cn.divisor + ' = ' + cn.quotient;
      fb.className = 'conejos-feedback wrong';
    }
  }

  const ok = (val === cn.quotient);
  // Cada ejercicio cuenta (acierte o no): la misión siempre se termina
  cn.done++;
  updateConejosProgress();
  if (cn.done >= CN_LEVELS[cn.level-1].rounds) {
    setTimeout(() => {
      if (fb) { fb.textContent=''; fb.className='conejos-feedback'; }
      misionCumplida('conejos', cn.level, cn.hits, CN_LEVELS[cn.level-1].rounds);
    }, ok ? 1300 : 1600);
  } else {
    setTimeout(nextConejosProblem, ok ? 1300 : 1600);
  }

  if (gei('conejos-score-disp')) gei('conejos-score-disp').textContent = String(cn.score);
}

function updateConejosProgress() {
  const cfg = CN_LEVELS[Math.min(cn.level,3)-1];
  const pct = Math.min((cn.done / cfg.rounds) * 100, 100);
  if (gei('conejos-prog-fill'))  gei('conejos-prog-fill').style.width  = pct + '%';
  if (gei('conejos-prog-label')) gei('conejos-prog-label').textContent  = cn.done + ' / ' + cfg.rounds;
  if (gei('conejos-hits-disp'))  gei('conejos-hits-disp').textContent   = cn.hits + '/' + cfg.rounds;
  // Stars
  const stars = ['', '⭐', '⭐⭐', '⭐⭐⭐'];
  const lit = cn.hits >= 4 ? 3 : cn.hits >= 2 ? 2 : cn.hits >= 1 ? 1 : 0;
  if (gei('conejos-stars')) gei('conejos-stars').textContent = stars[lit] + (lit < 3 ? '☆'.repeat(3-lit) : '');
}

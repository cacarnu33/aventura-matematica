// ── COHETES ──────────────────────────────────────────────
const CR_LEVELS = [
  { max:10, time:8, hits:5, coins:3, icon:'🚀', name:'Hasta 10', label:'Nivel 1 — resta hasta 10' },
  { max:15, time:7, hits:5, coins:4, icon:'🛸', name:'Hasta 15', label:'Nivel 2 — resta hasta 15' },
  { max:20, time:6, hits:5, coins:5, icon:'🌟', name:'Hasta 20', label:'Nivel 3 — resta hasta 20' },
];
misionRegistrar('cohetes', {
  overlay:'cohetes-overlay', arena:'cohetes-arena',
  emoji:'🚀', title:'¡Juego de Cohetes!', festejo:'Hoy volaste un montón',
  levels: CR_LEVELS, start: startCohetes,
});

let cr = {
  running:false, level:1, done:0, score:0, hits:0,
  a:0, b:0, answer:0,
  timerSec:0, timerInterval:null,
  rocketY:40,
};

function initCohetes() {
  buildStars();
  updateCohetesDots();
  if (!cr.running) misionInicio('cohetes');
}

function buildStars() {
  const arena = document.getElementById('cohetes-arena');
  if (arena.querySelector('.star-dot')) return; // already built
  for (let i = 0; i < 55; i++) {
    const s = document.createElement('div');
    s.className = 'star-dot';
    const sz = rnd(1, 3);
    s.style.cssText = 'width:'+sz+'px; height:'+sz+'px; top:'+rnd(0,88)+'%; left:'+rnd(0,96)+'%;'
      + 'animation-delay:'+((i*0.13)%2.5)+'s; animation-duration:'+(1.5+Math.random())+'s;';
    arena.appendChild(s);
  }
}

function startCohetes(level) {
  cr = { running:true, level: level || 1, done:0, score: cr.score || 0, hits:0,
         a:0, b:0, answer:0, timerSec:0, timerInterval:null, rocketY:40 };
  misionOcultar('cohetes');
  ['cohetes-stats-overlay','cohetes-problem','cohetes-timer-wrap',
   'rocket-wrap','cohetes-options','cohetes-dots'].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.style.display = '';
  });
  setRocketY(40);
  updateCohetesUI();
  updateCohetesDots();
  nextCohetesProblem();
}

function resumeCohetes() {
  const o = document.getElementById('cohetes-overlay');
  if (o) o.classList.remove('show');
  cr.hits = 0;
  cr.rocketY = 40;
  setRocketY(40);
  updateCohetesDots();
  nextCohetesProblem();
}

function clearCrTimer() {
  if (cr.timerInterval) { clearInterval(cr.timerInterval); cr.timerInterval = null; }
}

function setRocketY(y) {
  cr.rocketY = y;
  const rk = document.getElementById('rocket-wrap');
  if (rk) rk.style.bottom = y + 'px';
}

function nextCohetesProblem() {
  if (!cr.running) return;
  const cfg = CR_LEVELS[cr.level - 1];
  const max = cfg.max;
  cr.a = rnd(3, max);
  cr.b = rnd(1, cr.a - 1);
  cr.answer = cr.a - cr.b;

  // Show problem
  const prob = document.getElementById('cohetes-problem');
  if (prob) prob.textContent = cr.a + ' − ' + cr.b + ' = ?';

  // Build 4 options: correct + 3 distractors
  const opts = new Set([cr.answer]);
  while (opts.size < 4) {
    let d = cr.answer + rnd(-4, 4);
    if (d >= 0 && d !== cr.answer) opts.add(d);
  }
  const shuffled = [...opts].sort(() => Math.random() - 0.5);
  const optsEl = document.getElementById('cohetes-options');
  if (optsEl) {
    optsEl.innerHTML = '';
    shuffled.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'cohetes-opt';
      btn.textContent = String(val);
      btn.onclick = () => onCohetesAnswer(btn, val);
      optsEl.appendChild(btn);
    });
  }

  // Reset rocket state (no launch/explode classes)
  const rk = document.getElementById('rocket-wrap');
  if (rk) { rk.className = 'rocket-wrap'; rk.style.bottom = cr.rocketY + 'px'; }

  // Start timer
  startCrTimer(cfg.time);
}

function startCrTimer(seconds) {
  clearCrTimer();
  cr.timerSec = seconds;
  const fill = document.getElementById('timer-fill');
  const num  = document.getElementById('timer-num');
  const totalDash = 113;

  function tick() {
    if (!cr.running) { clearCrTimer(); return; }
    if (num)  num.textContent = String(Math.ceil(cr.timerSec));
    const pct = cr.timerSec / seconds;
    if (fill) {
      fill.style.strokeDashoffset = String(totalDash * (1 - pct));
      fill.style.stroke = pct > 0.5 ? '#EF9F27' : pct > 0.25 ? '#F5A623' : '#D85A30';
    }
    cr.timerSec -= 0.1;
    if (cr.timerSec <= 0) {
      clearCrTimer();
      onTimerExpired();
    }
  }
  tick();
  cr.timerInterval = setInterval(tick, 100);
}

function onCohetesAnswer(btn, val) {
  if (!cr.running) return;
  clearCrTimer();
  const opts = document.querySelectorAll('.cohetes-opt');
  opts.forEach(b => b.disabled = true);

  if (val === cr.answer) {
    btn.classList.add('correct');
    cr.score += 10 + (cr.level * 3);
    cr.hits++;
    cr.done++;
    updateCoins(1, null);
    // Rocket rises
    const newY = Math.min(cr.rocketY + 35, 340);
    setRocketY(newY);
    updateCohetesUI();

    crSiguiente(700);
  } else {
    btn.classList.add('wrong');
    // Show correct
    opts.forEach(b => { if (parseInt(b.textContent) === cr.answer) b.classList.add('correct'); });
    cr.done++;
    // Rocket goes down a bit
    setRocketY(Math.max(cr.rocketY - 20, 40));
    updateCohetesUI();
    crSiguiente(1300);
  }
}

// Después de cada resta: sigue con otra o termina la misión (despega el cohete)
function crSiguiente(espera) {
  updateCohetesUI();
  if (cr.done >= CR_LEVELS[cr.level-1].hits) {
    cr.running = false;
    clearCrTimer();
    const rk = gei('rocket-wrap');
    if (rk) rk.classList.add('launching');
    setTimeout(() => misionCumplida('cohetes', cr.level, cr.hits, CR_LEVELS[cr.level-1].hits), 1100);
  } else {
    setTimeout(() => nextCohetesProblem(), espera);
  }
}

function onTimerExpired() {
  if (!cr.running) return;
  // Show correct answer and penalise
  const opts = document.querySelectorAll('.cohetes-opt');
  opts.forEach(b => {
    b.disabled = true;
    if (parseInt(b.textContent) === cr.answer) b.classList.add('correct');
  });
  cr.done++;
  setRocketY(Math.max(cr.rocketY - 20, 40));
  crSiguiente(1400);
}

function updateCohetesDots() {
  for (let i = 1; i <= 3; i++) {
    const d = document.getElementById('cdot-' + i);
    if (!d) continue;
    d.className = 'level-dot' + (i < cr.level ? ' done' : i === cr.level ? ' active' : '');
  }
  const lbl = document.getElementById('cohetes-level-label');
  if (lbl) lbl.textContent = CR_LEVELS[Math.min(cr.level,3)-1].label;
}

function updateCohetesUI() {
  const livesStr = '🚀 ' + (cr.done || 0) + '/' + CR_LEVELS[Math.min(cr.level,3)-1].hits;
  if (gei('cohetes-lives-disp'))  gei('cohetes-lives-disp').textContent  = livesStr;
  if (gei('cohetes-lives-arena')) gei('cohetes-lives-arena').textContent = livesStr;
  if (gei('cohetes-score-disp'))  gei('cohetes-score-disp').textContent  = String(cr.score);
  if (gei('cohetes-score-arena')) gei('cohetes-score-arena').textContent = '⭐ ' + cr.score;
  if (gei('coin-display')) gei('coin-display').textContent = String(coins);
  if (gei('coins-big'))    gei('coins-big').textContent    = coins + ' 🪙';
}

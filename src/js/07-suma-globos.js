// ── SUMA GLOBOS ─────────────────────────────────────────
const SG_COLORS = [
  ['#FF6B6B','#CC2222'],['#5BB8F5','#1A7EC8'],['#7AC74F','#3A8C1A'],
  ['#F5A623','#B87010'],['#C084F5','#7A30CC'],['#F06EAA','#BC2272'],
  ['#3DBFA8','#0A8070'],['#FF9F6B','#CC5520'],
];

// Each level: hits needed to complete, max number, coins reward
const SG_LEVELS = [
  { hits:5, max:6,  coins:3, icon:'🥉', name:'Hasta 6',  label:'Nivel 1 — suma hasta 6',  badge:'🥉' },
  { hits:5, max:10, coins:4, icon:'🥈', name:'Hasta 10', label:'Nivel 2 — suma hasta 10', badge:'🥈' },
  { hits:5, max:15, coins:5, icon:'🥇', name:'Hasta 15', label:'Nivel 3 — suma hasta 15', badge:'🥇' },
];
misionRegistrar('suma-globos', {
  overlay:'sg-overlay', arena:'sg-arena', bg:'rgba(21,101,192,0.94)',
  emoji:'🎈➕🎈', title:'¡Suma de Globos!', festejo:'Hoy sumaste un montón de globos',
  levels: SG_LEVELS, start: startSumaGlobos,
});

let sg = {
  running:false, target:0, score:0, level:1,
  done:0, hits:0, fallo:false, intervalId:null, selected:[], pair:[]
};

function initSumaGlobos() {
  updateSgProgressUI();
  if (!sg.running) misionInicio('suma-globos');
}

function updateSgProgressUI() {
  for (let i = 1; i <= 3; i++) {
    const step = document.getElementById('sg-step-' + i);
    const line = document.getElementById('sg-line-' + i);
    step.className = 'sg-step' + (i < sg.level ? ' done' : i === sg.level ? ' active' : '');
    if (line) line.className = 'sg-step-line' + (i < sg.level ? ' done' : '');
  }
}

function startSumaGlobos(level) {
  sg = { running:true, target:0, score: sg.score || 0, level: level || 1, done:0, hits:0, fallo:false, intervalId:null, selected:[], pair:[] };
  clearSgBalloons();
  misionOcultar('suma-globos');
  updateSgUI();
  updateSgProgressUI();
  newSgRound();
}

function resumeSumaGlobos() {
  document.getElementById('sg-overlay').classList.remove('show');
  sg.selected = [];
  sg.done = 0;
  updateSgProgressUI();
  newSgRound();
}

function clearSgTimers() {
  if (sg.intervalId) { clearTimeout(sg.intervalId); sg.intervalId = null; }
}

function clearSgBalloons() {
  document.getElementById('sg-arena').querySelectorAll('.balloon-wrap,.puppy-wrap').forEach(b => b.remove());
  sg.selected = [];
}

function sgLevelCfg() { return SG_LEVELS[Math.min(sg.level,3) - 1]; }

function newSgRound() {
  const cfg = sgLevelCfg();
  const max = cfg.max;
  // Keep both numbers small and visible — max 5 each at level 1
  const maxA = Math.min(Math.floor(max / 2), sg.level === 1 ? 3 : 5);
  const a = rnd(1, maxA);
  const b = rnd(1, Math.min(max - a, sg.level === 1 ? 3 : max - a));
  sg.target = a + b;
  sg.pair = [a, b];
  sg.selected = [];
  sg.fallo = false;
  if (gei('sg-target'))     gei('sg-target').textContent     = String(sg.target);
  if (gei('sg-level-badge')) gei('sg-level-badge').textContent = cfg.label;
  if (gei('sg-selected'))   gei('sg-selected').textContent    = '— + ? = ' + (sg.target || '?');
  updateSgHits();
  clearSgBalloons();
  spawnSgRoundBalloons(a, b, max);
}

function updateSgHits() {
  const cfg = sgLevelCfg();
  if (gei('sg-hits')) gei('sg-hits').textContent = sg.done + '/' + cfg.hits;
}

// Velocidad de subida (segundos): más lento = más tiempo para pensar
function sgDur() { return sg.level === 1 ? 22 : sg.level === 2 ? 20 : 18; }

function spawnSgRoundBalloons(a, b, max) {
  const vals = [a, b];
  // Only 1 distractor at level 1, 2 at level 2, 2 at level 3 — keep it calm
  const extras = sg.level === 1 ? 1 : 2;
  for (let i = 0; i < extras; i++) {
    let v, tries = 0;
    do {
      v = rnd(1, max); tries++;
    } while (tries < 30 && (vals.includes(v) || v + a === sg.target || v + b === sg.target));
    vals.push(v);
  }
  // shuffle
  for (let i = vals.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [vals[i],vals[j]] = [vals[j],vals[i]];
  }
  const duration = sgDur();
  vals.forEach((v, idx) => {
    // Stagger more — one at a time with 1.2s gap so screen is never crowded
    setTimeout(() => { if (sg.running) spawnSgBalloon(v, duration); }, idx * 1200);
  });
  scheduleSgExtra();
}

function scheduleSgExtra() {
  clearSgTimers();
  // Very infrequent extras — one every 8-10 seconds max
  const delay = sg.level === 1 ? 10000 : 8000;
  sg.intervalId = setTimeout(() => {
    if (!sg.running) return;
    // Count current puppies on screen — don't add if already 4+
    const arena = document.getElementById('sg-arena');
    const onScreen = arena ? arena.querySelectorAll('.puppy-wrap,.balloon-wrap').length : 0;
    if (onScreen < 4) {
      const max = sgLevelCfg().max;
      let v, tries = 0;
      do { v = rnd(1, max); tries++; } while (tries < 15 && (v === sg.pair[0] || v === sg.pair[1]));
      const dur = sgDur();
      spawnSgBalloon(v, dur);
    }
    scheduleSgExtra();
  }, delay);
}

function spawnSgBalloon(value, duration) {
  const arena = document.getElementById('sg-arena');
  const arenaW = arena.offsetWidth || 360;
  const size = Math.min(105, Math.max(82, arenaW * 0.22));
  const puppyIdx = rnd(0, PUPPIES.length - 1);
  const left = getSpawnLeft('sg-arena', arenaW, size);
  const dur = duration || sgDur();

  const wrap = document.createElement('div');
  wrap.className = 'puppy-wrap';
  wrap.style.cssText = 'left:' + left + 'px; animation-duration:' + dur + 's; bottom:-130px;';
  wrap.dataset.value = value;
  wrap.innerHTML = makePuppySVG(value, puppyIdx, size);

  wrap.addEventListener('click', () => onSgClick(wrap, value));
  wrap.addEventListener('animationend', () => onSgEscape(wrap, value));
  arena.appendChild(wrap);
}

function onSgClick(el, value) {
  if (!sg.running || el.classList.contains('popping') || el.classList.contains('sg-chosen')) return;
  // works for both balloon-wrap and puppy-wrap
  value = parseInt(value);

  if (sg.selected.length === 0) {
    sg.selected.push({ el, value });
    el.classList.add('sg-chosen');
    if (gei('sg-selected')) gei('sg-selected').textContent = value + ' + ? = ' + sg.target;
    return;
  }

  const first = sg.selected[0];
  if (first.el === el) {
    sg.selected = [];
    el.classList.remove('sg-chosen');
    if (gei('sg-selected')) gei('sg-selected').textContent = '— + ? = ' + sg.target;
    return;
  }

  const sum = first.value + value;
  if (gei('sg-selected')) gei('sg-selected').textContent = first.value + ' + ' + value + ' = ' + sum;

  if (sum === sg.target) {
    [first.el, el].forEach(b => {
      b.classList.remove('sg-chosen');
      b.classList.add('popping');
      setTimeout(() => { if (b.parentNode) b.remove(); }, 320);
    });
    sg.score += 10 + sg.level * 5;
    sg.done++;
    if (!sg.fallo) sg.hits++;
    sg.selected = [];
    updateCoins(2, null);
    if (gei('coin-display')) gei('coin-display').textContent = String(coins);
    if (gei('coins-big')) gei('coins-big').textContent = coins + ' 🪙';
    showToast('🎉 ' + first.value + ' + ' + value + ' = ' + sg.target + '! +2 🪙');
    updateSgHits();

    if (sg.done >= sgLevelCfg().hits) {
      // Misión cumplida
      sg.running = false;
      clearSgTimers();
      setTimeout(() => { clearSgBalloons(); misionCumplida('suma-globos', sg.level, sg.hits, sgLevelCfg().hits); }, 500);
    } else {
      setTimeout(() => { if (sg.running) newSgRound(); }, 500);
    }

  } else {
    [first.el, el].forEach(b => {
      b.classList.remove('sg-chosen');
      b.style.animation = 'none';
      b.style.opacity = '0.2';
      b.style.pointerEvents = 'none';
      setTimeout(() => { if (b.parentNode) b.remove(); }, 450);
    });
    sg.selected = [];
    sg.fallo = true;
    showToast('Casi… ¡probá con otros dos! 😊');
    // Sin castigo: los globos que forman el par vuelven a aparecer
    const dur = sgDur();
    [first.value, value].forEach(v => {
      if (v === sg.pair[0] || v === sg.pair[1]) setTimeout(() => { if (sg.running) spawnSgBalloon(v, dur); }, 500);
    });
    if (gei('sg-selected')) gei('sg-selected').textContent = '— + ? = ' + sg.target;
  }
  updateSgUI();
}

function onSgEscape(el, value) {
  if (!el.parentNode || !sg.running) return;
  value = parseInt(value);
  const isPair = (value === sg.pair[0] || value === sg.pair[1]);
  // If it was selected, deselect it
  sg.selected = sg.selected.filter(s => s.el !== el);
  if (document.getElementById('sg-selected'))
    if (gei('sg-selected')) gei('sg-selected').textContent = sg.selected.length ? sg.selected[0].value + ' + ? = ' + sg.target : '— + ? = ' + sg.target;
  el.remove();
  if (!isPair) return; // distractors just disappear — no penalty
  // Correct pair balloon escaped: just respawn it, NO life lost
  const dur = sgDur();
  setTimeout(() => { if (sg.running) spawnSgBalloon(value, dur); }, 500);
}

function updateSgUI() {
  const hearts = ['','❤️','❤️❤️','❤️❤️❤️','❤️❤️❤️❤️','❤️❤️❤️❤️❤️'];
  if (gei('sg-lives')) gei('sg-lives').textContent = sgLevelCfg().badge;
  if (gei('sg-score')) gei('sg-score').textContent = String(sg.score);
  if (gei('coins-big')) gei('coins-big').textContent = coins + ' 🪙';
  if (gei('coin-display')) gei('coin-display').textContent = String(coins);
}

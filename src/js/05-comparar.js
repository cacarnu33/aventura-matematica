// ── COMPARAR — El cocodrilo glotón ───────────────────────
const CMP2_LEVELS = [
  { rounds:5, max:9,  unit:17, allowEqual:false, menos:false, coins:3, icon:'🐊', name:'Hasta 9',     label:'Nivel 1 — hasta 9' },
  { rounds:5, max:15, unit:9,  allowEqual:true,  menos:false, coins:4, icon:'⚖️', name:'Hasta 15',    label:'Nivel 2 — hasta 15' },
  { rounds:5, max:20, unit:6,  allowEqual:true,  menos:true,  coins:5, icon:'🔀', name:'Más y menos', label:'Nivel 3 — más y menos' },
];
misionRegistrar('comparar', {
  overlay:'cmp2-overlay', arena:'cmp2-arena',
  emoji:'🐊⚖️', title:'El cocodrilo glotón', festejo:'Hoy comparaste un montón',
  levels: CMP2_LEVELS, start: startCmp2,
});
let cmp2 = { level:1, done:0, hits:0, score:0, a:7, b:4, target:'mas', answered:false };

function initCmp2() {
  misionInicio('comparar');
  updateCmp2UI();
}

function startCmp2(level) {
  cmp2 = { level: level || 1, done:0, hits:0, score: cmp2.score || 0, a:7, b:4, target:'mas', answered:false };
  misionOcultar('comparar');
  updateCmp2UI();
  nextCmp2();
}

function updateCmp2UI() {
  const cfg = CMP2_LEVELS[Math.min(cmp2.level,3)-1];
  if (gei('cmp2-level-label')) gei('cmp2-level-label').textContent = cfg.label;
  if (gei('cmp2-hits-disp'))   gei('cmp2-hits-disp').textContent   = cmp2.hits+'/'+cfg.rounds;
  if (gei('cmp2-score-disp'))  gei('cmp2-score-disp').textContent  = String(cmp2.score);
  const pct = Math.min((cmp2.done/cfg.rounds)*100,100);
  if (gei('cmp2-prog-fill'))   gei('cmp2-prog-fill').style.width   = pct+'%';
  if (gei('cmp2-prog-label'))  gei('cmp2-prog-label').textContent  = cmp2.done+' / '+cfg.rounds;
  const lit = cmp2.hits>=4?3 : cmp2.hits>=2?2 : cmp2.hits>=1?1 : 0;
  if (gei('cmp2-stars')) gei('cmp2-stars').textContent = ['☆☆☆','⭐☆☆','⭐⭐☆','⭐⭐⭐'][lit];
}

function cmp2RenderTower(id, n, unit) {
  const el = gei(id);
  if (!el) return;
  el.innerHTML = '';
  for (let i=0;i<n;i++) {
    const c = document.createElement('div');
    c.className = 'cmp2-cube';
    c.style.width = '40px';
    c.style.height = unit + 'px';
    c.style.animationDelay = (i*0.03)+'s';
    el.appendChild(c);
  }
}

// Friendly crocodile head. dir: 'left' (boca abre a la izquierda = >),
// 'right' (boca abre a la derecha = <), 'equal', 'neutral'.
function cmp2CrocSVG(dir) {
  const grad = '<defs><radialGradient id="cmpcg" cx="40%" cy="30%" r="72%">' +
    '<stop offset="0%" stop-color="#AED581"/><stop offset="100%" stop-color="#558B2F"/>' +
    '</radialGradient></defs>';
  if (dir === 'equal') {
    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' + grad +
      '<circle cx="60" cy="62" r="52" fill="url(#cmpcg)" stroke="#33691E" stroke-width="3"/>' +
      '<circle cx="42" cy="40" r="11" fill="white"/><circle cx="44" cy="42" r="5.5" fill="#222"/>' +
      '<circle cx="78" cy="40" r="11" fill="white"/><circle cx="80" cy="42" r="5.5" fill="#222"/>' +
      '<rect x="40" y="80" width="40" height="7" rx="3.5" fill="#33691E"/>' +
      '</svg>';
  }
  if (dir === 'neutral') {
    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' + grad +
      '<circle cx="60" cy="62" r="52" fill="url(#cmpcg)" stroke="#33691E" stroke-width="3"/>' +
      '<circle cx="42" cy="40" r="11" fill="white"/><circle cx="44" cy="42" r="5.5" fill="#222"/>' +
      '<circle cx="78" cy="40" r="11" fill="white"/><circle cx="80" cy="42" r="5.5" fill="#222"/>' +
      '<ellipse cx="60" cy="84" rx="9" ry="7" fill="#33691E"/>' +
      '</svg>';
  }
  const flip = (dir === 'right');
  const inner =
    '<path d="M60 62 L15 36 A52 52 0 1 1 15 88 Z" fill="url(#cmpcg)" stroke="#33691E" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M58 62 L31 47 A31 31 0 0 0 31 77 Z" fill="#EF9A9A"/>' +
    '<polygon points="33,49 42,55 33,58" fill="white"/>' +
    '<polygon points="33,75 42,69 33,72" fill="white"/>' +
    '<circle cx="80" cy="34" r="11" fill="white" stroke="#33691E" stroke-width="2"/><circle cx="82" cy="35" r="5.5" fill="#222"/>' +
    '<circle cx="93" cy="58" r="3.5" fill="#33691E"/>';
  const g = '<g'+(flip?' transform="translate(120,0) scale(-1,1)"':'')+'>' + inner + '</g>';
  return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' + grad + g + '</svg>';
}

function nextCmp2() {
  cmp2.answered = false;
  const cfg = CMP2_LEVELS[Math.min(cmp2.level,3)-1];
  let a, b;
  if (cfg.allowEqual && Math.random() < 0.18) {
    a = b = rnd(2, cfg.max);
  } else {
    do { a = rnd(1, cfg.max); b = rnd(1, cfg.max); }
    while (a === b || (cfg.max <= 9 && Math.abs(a - b) < 2));
  }
  cmp2.a = a; cmp2.b = b;
  cmp2.target = (cfg.menos && Math.random() < 0.5) ? 'menos' : 'mas';

  if (gei('cmp2-numA')) gei('cmp2-numA').textContent = a;
  if (gei('cmp2-numB')) gei('cmp2-numB').textContent = b;
  cmp2RenderTower('cmp2-towerA', a, cfg.unit);
  cmp2RenderTower('cmp2-towerB', b, cfg.unit);

  const croc = gei('cmp2-croc');
  if (croc) { croc.innerHTML = cmp2CrocSVG('neutral'); croc.classList.remove('chomp'); }
  if (gei('cmp2-statement')) gei('cmp2-statement').innerHTML = '❔';

  if (gei('cmp2-boxA')) gei('cmp2-boxA').className = 'cmp2-box';
  if (gei('cmp2-boxB')) gei('cmp2-boxB').className = 'cmp2-box';
  if (gei('cmp2-equal')) gei('cmp2-equal').className = 'cmp2-equal-btn';

  const hint = gei('cmp2-hint');
  if (hint) {
    if (cmp2.target === 'menos') { hint.textContent = '👇 Tocá el que tiene MENOS'; hint.className = 'cmp2-hint menos'; }
    else { hint.textContent = '👆 Tocá el que tiene MÁS'; hint.className = 'cmp2-hint'; }
  }
  const fb = gei('cmp2-feedback');
  if (fb) { fb.textContent = ''; fb.className = 'cmp2-feedback'; }
}

function onCmp2Pick(pick) {
  if (cmp2.answered) return;
  cmp2.answered = true;
  const a = cmp2.a, b = cmp2.b;

  if (gei('cmp2-boxA')) gei('cmp2-boxA').classList.add('dim');
  if (gei('cmp2-boxB')) gei('cmp2-boxB').classList.add('dim');
  if (gei('cmp2-equal')) gei('cmp2-equal').classList.add('dim');

  const rel = a > b ? '>' : a < b ? '<' : '=';
  const crocDir = rel === '>' ? 'left' : rel === '<' ? 'right' : 'equal';
  const bigger = Math.max(a, b), smaller = Math.min(a, b);

  let correctPick;
  if (rel === '=') correctPick = '=';
  else if (cmp2.target === 'mas') correctPick = (a > b ? 'A' : 'B');
  else correctPick = (a < b ? 'A' : 'B');

  // Reveal the hungry crocodile + the symbol it forms
  const croc = gei('cmp2-croc');
  if (croc) { croc.innerHTML = cmp2CrocSVG(crocDir); croc.classList.add('chomp'); }
  const st = gei('cmp2-statement');
  if (st) {
    if (rel === '=')      st.innerHTML = '<span class="big">'+a+'</span> = <span class="big">'+b+'</span>';
    else if (rel === '>') st.innerHTML = '<span class="big">'+a+'</span> &gt; <span>'+b+'</span>';
    else                  st.innerHTML = '<span>'+a+'</span> &lt; <span class="big">'+b+'</span>';
  }

  // Highlight the box she should have tapped
  if (correctPick === '=') {
    if (gei('cmp2-boxA')) gei('cmp2-boxA').classList.add('winner');
    if (gei('cmp2-boxB')) gei('cmp2-boxB').classList.add('winner');
    if (gei('cmp2-equal')) gei('cmp2-equal').classList.add('eq-win');
  } else {
    const cb = gei('cmp2-box' + correctPick);
    if (cb) cb.classList.add('winner');
  }

  const fb = gei('cmp2-feedback');
  const isCorrect = (pick === correctPick);

  if (isCorrect) {
    if (fb) {
      if (rel === '=') fb.textContent = '🎉 ¡Son iguales! El cocodrilo no sabe a cuál comer 😄';
      else if (cmp2.target === 'mas') fb.textContent = '🎉 ¡Sí! El ' + bigger + ' es MÁS. ¡Ñam! 🐊';
      else fb.textContent = '🎉 ¡Sí! El ' + smaller + ' es MENOS. ¡Muy bien! ⭐';
      fb.className = 'cmp2-feedback correct';
    }
    playSuccessSound();
    launchConfettiIn('cmp2-arena');
    cmp2.hits++;
    cmp2.score += 8 + cmp2.level * 2;
    updateCoins(2, null);
    if (gei('coin-display')) gei('coin-display').textContent = String(coins);
    if (gei('coins-big'))    gei('coins-big').textContent    = coins + ' 🪙';
  } else {
    if ((pick === 'A' || pick === 'B') && pick !== correctPick) {
      const wb = gei('cmp2-box' + pick);
      if (wb) wb.classList.add('loser');
    }
    if (fb) {
      if (rel === '=') fb.textContent = 'Casi… ¡eran IGUALES! Mirá 😊';
      else if (cmp2.target === 'mas') fb.textContent = 'Casi… el ' + bigger + ' es el MÁS grande 😊';
      else fb.textContent = 'Casi… el ' + smaller + ' es el MENOS 😊';
      fb.className = 'cmp2-feedback wrong';
    }
    playWrongSound();
  }

  // Cada ejercicio cuenta (acierte o no): la misión siempre se termina
  cmp2.done++;
  updateCmp2UI();
  if (cmp2.done >= CMP2_LEVELS[cmp2.level-1].rounds) {
    setTimeout(() => {
      if (fb) { fb.textContent=''; fb.className='cmp2-feedback'; }
      misionCumplida('comparar', cmp2.level, cmp2.hits, CMP2_LEVELS[cmp2.level-1].rounds);
    }, isCorrect ? 1600 : 2100);
  } else {
    setTimeout(nextCmp2, isCorrect ? 1600 : 2100);
  }
}

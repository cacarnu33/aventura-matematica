let coins = 0;
let countVal = 0;
let countEmoji = '🍎';
let sumaA, sumaB, restaA, restaB, cmpA, cmpB;
let conteoMilestones = [5, 10, 15, 20];
let reachedMilestones = new Set();
let premiosHistorial = []; // premios canjeados (no se llama "history" para no pisar window.history)

// La barra de progreso de premios llega hasta el premio más caro
const MAX_PRIZE_COST = 25;

const PRIZES = [
  { id:'p1', emoji:'🍬', name:'Un caramelo', cost:5, claimed:false },
  { id:'p2', emoji:'📺', name:'10 min de tele', cost:8, claimed:false },
  { id:'p3', emoji:'🎨', name:'Pintar con mamá', cost:10, claimed:false },
  { id:'p4', emoji:'🧁', name:'Elegir la merienda', cost:12, claimed:false },
  { id:'p5', emoji:'🎮', name:'Juego a elección', cost:15, claimed:false },
  { id:'p6', emoji:'🌟', name:'Noche de película', cost:18, claimed:false },
  { id:'p7', emoji:'🛍️', name:'Salida especial', cost:20, claimed:false },
  { id:'p8', emoji:'🎪', name:'Paseo sorpresa', cost:25, claimed:false },
];

const OBJ_EMOJIS = ['🍎','⭐','🐱','🌸','🚗','🦋','🐸','🍕'];

const JUEGO_NOMBRES = {
  conteo:'🍎 Conteo', contar:'⭐ Contar', secuencias:'🔢 Patrones',
  suma:'➕ Suma', resta:'➖ Resta', 'suma-globos':'🎈 Globos', cohetes:'🚀 Cohetes', comparar:'🐊 Más o menos',
  granja:'🐔 Granja', conejos:'🐰 Conejos', tienda:'🛒 Tienda', memotest:'🃏 Memo', premios:'🎁 Premios',
};

function goToScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  // Fuera del inicio: botón 🏠 Inicio y el nombre del juego arriba
  document.body.classList.toggle('en-juego', name !== 'inicio');
  if (gei('header-juego')) gei('header-juego').textContent = JUEGO_NOMBRES[name] || '';
  window.scrollTo(0, 0);
  if (name === 'cohetes') initCohetes();
  if (name === 'suma-globos') initSumaGlobos();
  if (name === 'granja') initGranja();
  if (name === 'conejos') initConejos();
  if (name === 'tienda') initTienda();
  if (name === 'secuencias') initSecuencias();
  if (name === 'contar') initContar();
  if (name === 'memotest') initMemotest();
  vozSetScreen(name);
  if (name === 'suma') initSuma2();
  if (name === 'resta') initResta2();
  if (name === 'comparar') initCmp2();
  if (name === 'premios') { renderPrizes(); renderHistory(); }
}

function gei(id) { return document.getElementById(id); }

function updateCoins(amount, earnElId) {
  coins += amount;
  const coinDisp = gei('coin-display');
  const coinsBig = gei('coins-big');
  const fill = gei('progress-fill');
  const nextLabel = gei('next-prize-label');
  if (coinDisp) coinDisp.textContent = String(coins);
  if (coinsBig) coinsBig.textContent = coins + ' 🪙';
  const pct = Math.min((coins / MAX_PRIZE_COST) * 100, 100);
  if (fill) fill.style.width = pct + '%';
  const next = PRIZES.filter(p => !p.claimed && p.cost > coins)[0];
  if (nextLabel) nextLabel.textContent = next ? 'Próximo: ' + next.cost + ' 🪙' : '¡Podés canjear premios!';
  progresoGuardar();
  if (earnElId) {
    const earnEl = gei(earnElId);
    if (earnEl) {
      earnEl.innerHTML = '<span class="coin-earn">+' + amount + ' 🪙 ganadas</span>';
      setTimeout(() => { if (earnEl) earnEl.innerHTML = ''; }, 2500);
    }
  }
}

function showToast(msg) {
  const t = gei('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function renderPrizes() {
  const grid = document.getElementById('prizes-grid');
  grid.innerHTML = '';
  PRIZES.forEach(p => {
    const canBuy = coins >= p.cost && !p.claimed;
    const div = document.createElement('div');
    div.className = 'prize-card' + (canBuy ? ' available' : '') + (p.claimed ? ' claimed' : '');
    div.innerHTML =
      '<span class="prize-emoji">' + p.emoji + '</span>' +
      '<div class="prize-name">' + p.name + '</div>' +
      '<div class="prize-cost">' + (p.claimed ? '' : p.cost + ' 🪙') + '</div>' +
      (p.claimed
        ? '<div class="prize-claimed-badge">✓ Canjeado</div>'
        : '<button class="prize-btn' + (canBuy ? ' can-buy' : '') + '" ' +
          (canBuy ? '' : 'disabled') +
          ' onclick="claimPrize(\'' + p.id + '\')">' +
          (canBuy ? 'Canjear ✨' : 'Faltan ' + (p.cost - coins) + ' 🪙') +
          '</button>'
      );
    grid.appendChild(div);
  });
}

function claimPrize(id) {
  const p = PRIZES.find(x => x.id === id);
  if (!p || p.claimed || coins < p.cost) return;
  coins -= p.cost;
  p.claimed = true;
  if (gei('coin-display')) gei('coin-display').textContent = String(coins);
  if (gei('coins-big')) gei('coins-big').textContent = coins + ' 🪙';
  const pct = Math.min((coins / MAX_PRIZE_COST) * 100, 100);
  if (gei('progress-fill')) gei('progress-fill').style.width = pct + '%';
  const nextAfter = PRIZES.filter(p => !p.claimed && p.cost > coins)[0];
  if (gei('next-prize-label'))
    gei('next-prize-label').textContent = nextAfter ? 'Próximo premio: ' + nextAfter.cost + ' 🪙' : '¡Podés canjear todos!';
  premiosHistorial.unshift({ emoji: p.emoji, name: p.name, cost: p.cost, date: new Date().toLocaleDateString('es-AR') });
  progresoGuardar();
  renderPrizes();
  renderHistory();
  showToast('¡Felicitaciones! ' + p.emoji + ' ' + p.name);
}

function renderHistory() {
  const el = document.getElementById('history-list');
  if (premiosHistorial.length === 0) {
    el.innerHTML = '<div style="font-size:0.85rem; color:var(--text-light); text-align:center; padding:1.5rem 0; font-weight:600;">Todavía no canjeaste ningún premio</div>';
    return;
  }
  el.innerHTML = premiosHistorial.map(h =>
    '<div class="history-item">' +
    '<div class="history-item-left"><span style="font-size:1.2rem;">' + h.emoji + '</span> ' + h.name + '</div>' +
    '<div class="history-item-right">−' + h.cost + ' 🪙 · ' + h.date + '</div>' +
    '</div>'
  ).join('');
}

function setEmoji(el, emoji) {
  document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  countEmoji = emoji;
  renderObjects();
}

function changeCount(delta) {
  countVal = Math.max(0, Math.min(20, countVal + delta));
  if (gei('count-num')) gei('count-num').textContent = String(countVal);
  if (gei('prev-num')) gei('prev-num').textContent = String(countVal > 0 ? countVal - 1 : '—');
  if (gei('next-num')) gei('next-num').textContent = String(countVal < 20 ? countVal + 1 : '—');
  renderObjects();
  if (conteoMilestones.includes(countVal) && !reachedMilestones.has(countVal)) {
    reachedMilestones.add(countVal);
    updateCoins(1, 'conteo-earn');
  }
}

function renderObjects() {
  const grid = document.getElementById('objects-grid');
  grid.innerHTML = '';
  for (let i = 0; i < countVal; i++) {
    const span = document.createElement('span');
    span.className = 'obj';
    span.style.animationDelay = (i * 0.025) + 's';
    span.textContent = countEmoji;
    grid.appendChild(span);
  }
}

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makeVisual(a, b, op, containerId) {
  const el = document.getElementById(containerId);
  const emj = OBJ_EMOJIS[rnd(0, OBJ_EMOJIS.length - 1)];
  let html = '<div class="group-box"><div class="group-emojis">';
  for (let i = 0; i < a; i++) html += '<span style="font-size:1.3rem;">' + emj + '</span>';
  html += '</div><div class="group-num">' + a + '</div></div>';
  html += '<span class="op-sign">' + op + '</span>';
  if (op === '+') {
    html += '<div class="group-box"><div class="group-emojis">';
    for (let i = 0; i < b; i++) html += '<span style="font-size:1.3rem;">' + emj + '</span>';
    html += '</div><div class="group-num">' + b + '</div></div>';
  } else {
    html += '<div class="group-box"><div class="group-emojis">';
    for (let i = 0; i < a; i++) {
      const faded = i >= (a - b);
      html += '<span style="font-size:1.3rem; opacity:' + (faded ? '0.18' : '1') + ';">' + emj + '</span>';
    }
    html += '</div><div class="group-num">−' + b + '</div></div>';
  }
  el.innerHTML = html;
}

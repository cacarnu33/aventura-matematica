// ── MEMOTEST MATEMÁTICO ───────────────────────────────────
// 3 levels, 4 pairs each, operation ↔ result matching

const MEMO_LEVELS = [
  { label:'Nivel 1 — Sumas fáciles', coins:3, icon:'➕', name:'Sumas fáciles',
    // Each pair has a UNIQUE result — no duplicates possible
    pairs: [
      {op:'1 + 2', res:3},
      {op:'2 + 2', res:4},
      {op:'2 + 3', res:5},
      {op:'3 + 3', res:6},
      {op:'3 + 4', res:7},
      {op:'4 + 4', res:8},
      {op:'4 + 5', res:9},
      {op:'5 + 5', res:10},
    ]
  },
  { label:'Nivel 2 — Restas', coins:4, icon:'➖', name:'Restas',
    pairs: [
      {op:'5 − 3',  res:2},
      {op:'7 − 4',  res:3},
      {op:'8 − 4',  res:4},
      {op:'8 − 3',  res:5},
      {op:'9 − 3',  res:6},
      {op:'9 − 2',  res:7},
      {op:'10 − 2', res:8},
      {op:'12 − 3', res:9},
    ]
  },
  { label:'Nivel 3 — Sumas grandes', coins:5, icon:'🧮', name:'Sumas grandes',
    pairs: [
      {op:'5 + 6',  res:11},
      {op:'6 + 6',  res:12},
      {op:'6 + 7',  res:13},
      {op:'7 + 7',  res:14},
      {op:'8 + 7',  res:15},
      {op:'9 + 7',  res:16},
      {op:'9 + 8',  res:17},
      {op:'9 + 9',  res:18},
    ]
  },
];

let memo = {
  level: 1,
  pairs: [],          // [{op, res, id}] — 4 pairs per game
  cards: [],          // all 8 cards shuffled [{id, type:'op'|'res', text, pairId}]
  flipped: [],        // indices of currently flipped (max 2)
  matched: new Set(), // pairIds that are matched
  tries: 0,
  locked: false,      // prevent clicks while animating
};

// La pantalla de inicio del memotest conserva sus instrucciones con pictogramas
const MEMO_INTRO_HTML = gei('memo-overlay') ? gei('memo-overlay').innerHTML : '';
misionRegistrar('memotest', {
  overlay:'memo-overlay',
  emoji:'🃏🧮🃏', title:'¡Memotest Matemático!', festejo:'Hoy encontraste un montón de pares',
  levels: MEMO_LEVELS, start: selectMemoLevel, inicio: memoIntro,
});

function memoIntro() {
  MISIONES.memotest.pantalla = 'inicio';
  const ov = gei('memo-overlay');
  if (!ov) return;
  ov.innerHTML = MEMO_INTRO_HTML;
  ov.classList.add('show');
  misionAjustar(ov);
}

function initMemotest() {
  memoIntro();
}

function selectMemoLevel(n) {
  memo.level = n;
  document.querySelectorAll('.memo-level-btn').forEach((b,i) => {
    b.classList.toggle('active', i+1 === n);
  });
  if (gei('memo-level-label')) gei('memo-level-label').textContent = MEMO_LEVELS[n-1].label;
  startMemotest();
}

function startMemotest() {
  const cfg = MEMO_LEVELS[Math.min(memo.level,3)-1];

  // Pick 4 random pairs ensuring all results are unique
  const shuffledPool = [...cfg.pairs].sort(() => Math.random() - 0.5);
  const chosen = [];
  const usedResults = new Set();
  for (const p of shuffledPool) {
    if (!usedResults.has(p.res)) {
      usedResults.add(p.res);
      chosen.push(p);
    }
    if (chosen.length === 4) break;
  }
  memo.pairs = chosen.map((p, i) => ({...p, id: i}));
  memo.matched = new Set();
  memo.tries   = 0;
  memo.flipped = [];
  memo.locked  = false;

  // Build 8 cards: one op card + one res card per pair
  const cards = [];
  memo.pairs.forEach(p => {
    cards.push({pairId: p.id, type: 'op',  text: p.op,        res: p.res});
    cards.push({pairId: p.id, type: 'res', text: String(p.res), res: p.res});
  });
  memo.cards = cards.sort(() => Math.random() - 0.5);

  misionOcultar('memotest');

  updateMemoUI();
  renderMemoGrid();

  const fb = gei('memo-feedback');
  if (fb) { fb.textContent = ''; fb.className = 'memo-feedback'; }
}

function updateMemoUI() {
  const matched = memo.matched.size;
  if (gei('memo-pairs-disp'))   gei('memo-pairs-disp').textContent   = matched + '/4';
  if (gei('memo-tries-disp'))   gei('memo-tries-disp').textContent   = String(memo.tries);
}

function renderMemoGrid() {
  const grid = gei('memo-grid');
  if (!grid) return;
  grid.innerHTML = '';

  memo.cards.forEach((card, idx) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'memo-card';
    cardEl.dataset.idx = String(idx);

    cardEl.innerHTML =
      '<div class="memo-card-inner">' +
        // Back side (hidden)
        '<div class="memo-card-back"></div>' +
        // Front side (revealed)
        '<div class="memo-card-front type-' + card.type + '">' +
          card.text +
        '</div>' +
      '</div>';

    cardEl.addEventListener('click', () => onMemoCardClick(idx));
    grid.appendChild(cardEl);
  });
}

function memoHablar(texto) {
  return texto.replace(/\s*\+\s*/g, ' más ').replace(/\s*[−-]\s*/g, ' menos ');
}

function memoMarca(el, tipo) {
  if (!el || el.querySelector('.memo-mark')) return;
  const m = document.createElement('div');
  m.className = 'memo-mark ' + tipo;
  m.textContent = tipo === 'ok' ? '✓' : '✗';
  el.appendChild(m);
}

function onMemoCardClick(idx) {
  if (memo.locked) return;
  if (memo.flipped.includes(idx)) return;
  if (memo.matched.has(memo.cards[idx].pairId)) return;

  // Flip this card
  const cardEl = grid_card(idx);
  if (cardEl) cardEl.classList.add('flipped');
  memo.flipped.push(idx);

  // Play flip sound — soft click
  playTone(600, 'sine', 0.07, 0, 0.08);
  playTone(800, 'sine', 0.05, 0.06, 0.06);

  if (memo.flipped.length === 2) {
    memo.tries++;
    memo.locked = true;
    updateMemoUI();

    const [i1, i2] = memo.flipped;
    const c1 = memo.cards[i1];
    const c2 = memo.cards[i2];
    const isMatch = c1.pairId === c2.pairId;
    // Si es pareja, la voz lee la cuenta completa en onMemoMatch
    if (!isMatch) vozLeer(memoHablar(memo.cards[idx].text));

    // Esperar a que termine el giro (300 ms) antes de mostrar el resultado
    setTimeout(() => {
      if (isMatch) {
        onMemoMatch(i1, i2, c1, c2);
      } else {
        onMemoMiss(i1, i2);
      }
    }, 450);
  } else {
    vozLeer(memoHablar(memo.cards[idx].text));
  }
}

function onMemoMatch(i1, i2, c1, c2) {
  memo.matched.add(c1.pairId);
  memo.flipped = [];
  memo.locked  = false;

  // Mark as matched
  const el1 = grid_card(i1);
  const el2 = grid_card(i2);
  if (el1) el1.classList.add('matched');
  if (el2) el2.classList.add('matched');

  const fb = gei('memo-feedback');
  const opCard  = c1.type==='op' ? c1 : c2;
  const resCard = c1.type==='res' ? c1 : c2;
  if (fb) {
    fb.innerHTML = '✓ <strong>' + opCard.text + ' = ' + resCard.text + '</strong> ¡Muy bien!';
    fb.className = 'memo-feedback correct';
  }

  // Pulso + borde verde + ✓ y un sonido alegre (sin confetti en cada par: menos ruido visual)
  memoMarca(el1, 'ok');
  memoMarca(el2, 'ok');
  playMemoMatchSound();
  vozLeer(memoHablar(opCard.text) + ' es ' + resCard.text + '. ¡Muy bien!');

  updateMemoUI();

  // Check if all matched
  if (memo.matched.size === 4) {
    setTimeout(onMemoComplete, 900);
  }
}

function onMemoMiss(i1, i2) {
  const el1 = grid_card(i1);
  const el2 = grid_card(i2);

  // Sacudida + borde rojo + ✗
  if (el1) el1.classList.add('wrong-flip');
  if (el2) el2.classList.add('wrong-flip');
  memoMarca(el1, 'no');
  memoMarca(el2, 'no');

  const fb = gei('memo-feedback');
  if (fb) {
    fb.textContent = '✗ No son pareja. ¡Mirá dónde están! 👀';
    fb.className = 'memo-feedback wrong';
  }

  playWrongSound();

  // Pausa de memoria: 1 segundo para registrar dónde estaban antes de ocultarlas
  setTimeout(() => {
    [el1, el2].forEach(el => {
      if (!el) return;
      el.classList.remove('flipped', 'wrong-flip');
      const m = el.querySelector('.memo-mark');
      if (m) m.remove();
    });
    memo.flipped = [];
    memo.locked  = false;
    if (fb) { fb.textContent = ''; fb.className = 'memo-feedback'; }
  }, 1000);
}

function onMemoComplete() {
  // Estrellas según intentos (4 = perfecto); terminar siempre da al menos 1
  const hits = memo.tries <= 4 ? 4 : memo.tries <= 6 ? 2 : 1;
  misionCumplida('memotest', memo.level, hits, 4);
}

function grid_card(idx) {
  const grid = gei('memo-grid');
  if (!grid) return null;
  return grid.querySelector('[data-idx="' + idx + '"]');
}

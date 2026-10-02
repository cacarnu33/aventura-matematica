// ── TIENDA ────────────────────────────────────────────────
// Argentine money: coins and bills
const AR_MONEY = [
  { val:1,   label:'$1',   type:'coin', color:['#B0BEC5','#78909C'] },
  { val:2,   label:'$2',   type:'coin', color:['#B0BEC5','#78909C'] },
  { val:5,   label:'$5',   type:'coin', color:['#FFD54F','#FFA000'] },
  { val:10,  label:'$10',  type:'coin', color:['#FFD54F','#FFA000'] },
  { val:50,  label:'$50',  type:'bill', color:['#A5D6A7','#388E3C'] },
  { val:100, label:'$100', type:'bill', color:['#90CAF9','#1565C0'] },
  { val:200, label:'$200', type:'bill', color:['#FFCC80','#E65100'] },
  { val:500, label:'$500', type:'bill', color:['#CE93D8','#6A1B9A'] },
];

// Cosas para comprar: en cada compra se elige un estante distinto
const TIENDA_ESTANTES = [
  { titulo:'Útiles',    cosas:[['✏️','Lápiz'],['📏','Regla'],['📓','Cuaderno'],['🖍️','Crayón'],['✂️','Tijera'],['🎨','Pintura']] },
  { titulo:'Juguetes',  cosas:[['🧸','Osito'],['⚽','Pelota'],['🚗','Autito'],['🎈','Globo'],['🎲','Dado'],['🛴','Monopatín']] },
  { titulo:'Golosinas', cosas:[['🍬','Caramelo'],['🍭','Chupetín'],['🍫','Chocolate'],['🍪','Galletita'],['🍦','Helado'],['🍩','Dona']] },
  { titulo:'Frutas',    cosas:[['🍎','Manzana'],['🍌','Banana'],['🍓','Frutilla'],['🍊','Naranja'],['🍇','Uvas'],['🍉','Sandía']] },
  { titulo:'Ropa',      cosas:[['👕','Remera'],['🧢','Gorra'],['🧦','Medias'],['👟','Zapatillas'],['🧤','Guantes'],['🎒','Mochila']] },
];
let tiendaUltimoEstante = -1;

// Prices by level
const TIENDA_LEVELS = [
  { rounds:4, coins:3, icon:'✏️', name:'Precios simples',   label:'Nivel 1 — precios simples',   prices:[5,10,15,20,25] },
  { rounds:4, coins:4, icon:'🍎', name:'Precios medianos',  label:'Nivel 2 — precios medianos',  prices:[50,100,150,200,250] },
  { rounds:4, coins:5, icon:'🧸', name:'Con vuelto', label:'Nivel 3 — desafío con vuelto', prices:[250,300,350,400,450,500] },
];

let td = {
  level: 1,
  hits: 0,
  score: 0,
  cart: [],         // [{emoji, name, price}]
  wallet: [],       // [{val, label, type, color, id}]
  walletTotal: 0,
  cartTotal: 0,
  currentProducts: [],
  phase: 1,
  pendingVuelto: 0,
};

misionRegistrar('tienda', {
  overlay:'tienda-overlay',
  emoji:'🛒💰', title:'¡La Tiendita!', festejo:'Hoy hiciste un montón de compras',
  levels: TIENDA_LEVELS, start: startTienda,
});

function initTienda() {
  misionInicio('tienda');
  updateTiendaLevelLabel();
  renderTiendaShelf();
  renderMoney();
  updateTiendaProgress();
}

function updateTiendaLevelLabel() {
  const cfg = TIENDA_LEVELS[Math.min(td.level,3)-1];
  if (gei('tienda-level-label')) gei('tienda-level-label').textContent = cfg.label;
}

function renderTiendaShelf() {
  const cfg = TIENDA_LEVELS[Math.min(td.level,3)-1];
  // Un estante distinto en cada compra, 4 cosas con precios distintos del nivel
  let idx;
  do { idx = rnd(0, TIENDA_ESTANTES.length-1); } while (idx === tiendaUltimoEstante);
  tiendaUltimoEstante = idx;
  const cosas  = [...TIENDA_ESTANTES[idx].cosas].sort(() => Math.random()-0.5).slice(0,4);
  const precios = [...cfg.prices].sort(() => Math.random()-0.5);
  const shuffled = cosas.map(([emoji, name], i) => ({ emoji, name, price: precios[i % precios.length] }));
  if (gei('tienda-estante')) gei('tienda-estante').textContent = TIENDA_ESTANTES[idx].titulo;
  td.currentProducts = shuffled;
  td.cart = [];
  td.cartTotal = 0;

  const shelf = gei('tienda-shelf');
  if (!shelf) return;
  shelf.innerHTML = '';
  shuffled.forEach(p => {
    const div = document.createElement('div');
    div.className = 'tienda-product';
    div.dataset.price = String(p.price);
    div.dataset.name = p.name;
    div.dataset.emoji = p.emoji;
    div.innerHTML =
      '<div class="tienda-product-emoji">' + p.emoji + '</div>' +
      '<div class="tienda-product-name">' + p.name + '</div>' +
      '<div class="tienda-product-price">$' + p.price + '</div>';
    div.onclick = () => toggleCart(div, p);
    shelf.appendChild(div);
  });

  updateCartDisplay();
  updatePayBtn();
  if (gei('tienda-feedback')) { gei('tienda-feedback').textContent = ''; gei('tienda-feedback').className = 'tienda-feedback'; }
}

function toggleCart(el, product) {
  const idx = td.cart.findIndex(c => c.name === product.name);
  if (idx >= 0) {
    td.cart.splice(idx, 1);
    el.classList.remove('selected');
  } else {
    if (td.cart.length >= 3) return; // max 3 items
    td.cart.push(product);
    el.classList.add('selected');
  }
  td.cartTotal = td.cart.reduce((s,c) => s+c.price, 0);
  updateCartDisplay();
  updatePayBtn();
}

function updateCartDisplay() {
  const el = gei('tienda-cart-items');
  const tot = gei('tienda-total-disp');
  if (!el) return;
  if (td.cart.length === 0) {
    el.innerHTML = '<span style="font-size:0.82rem; color:var(--text-light); font-weight:600;">Elegí productos del estante</span>';
  } else {
    el.innerHTML = td.cart.map(c =>
      '<div class="tienda-cart-item">' + c.emoji + ' ' + c.name + ' <strong>$' + c.price + '</strong></div>'
    ).join('');
  }
  if (tot) tot.textContent = '$' + td.cartTotal;
}

function updatePayBtn() {
  const btn = gei('tienda-pay-btn');
  if (btn) btn.disabled = td.cart.length < 2;
}

function goToPhase2() {
  if (td.cart.length < 2) return;
  td.phase = 2;
  td.wallet = [];
  td.walletTotal = 0;

  gei('tienda-phase1').classList.remove('active');
  gei('tienda-phase2').classList.add('active');

  if (gei('tienda-total-p2')) gei('tienda-total-p2').textContent = '$' + td.cartTotal;
  renderMoney();
  updateWalletDisplay();
  updateConfirmBtn();
}

function backToPhase1() {
  td.phase = 1;
  if (gei('tienda-phase2')) gei('tienda-phase2').classList.remove('active');
  if (gei('tienda-phase3')) gei('tienda-phase3').classList.remove('active');
  if (gei('tienda-phase1')) gei('tienda-phase1').classList.add('active');
}

function makeBillSVG(money) {
  const [c1,c2] = money.color;
  if (money.type === 'coin') {
    // Coin: circle
    return '<svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="cg_'+money.val+'" cx="38%" cy="32%" r="65%">' +
        '<stop offset="0%" stop-color="white" stop-opacity="0.5"/>' +
        '<stop offset="100%" stop-color="'+c2+'" stop-opacity="1"/>' +
      '</radialGradient></defs>' +
      '<circle cx="26" cy="26" r="24" fill="url(#cg_'+money.val+')" stroke="'+c2+'" stroke-width="1.5"/>' +
      '<circle cx="26" cy="26" r="17" fill="white" opacity="0.92"/>' +
      '<text x="26" y="32" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="16" font-weight="700" fill="#263238">'+money.label+'</text>' +
    '</svg>';
  } else {
    // Bill: rectangle
    const w=76, h=38;
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="bg_'+money.val+'" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="'+c1+'"/><stop offset="100%" stop-color="'+c2+'"/>' +
      '</linearGradient></defs>' +
      '<rect width="'+w+'" height="'+h+'" rx="5" fill="url(#bg_'+money.val+')" stroke="'+c2+'" stroke-width="1.2"/>' +
      '<rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="3" fill="none" stroke="white" stroke-width="0.8" opacity="0.4"/>' +
      '<rect x="'+(w/2-25)+'" y="'+(h/2-11)+'" width="50" height="22" rx="11" fill="white" opacity="0.92"/>' +
      '<text x="'+(w/2)+'" y="'+(h/2+6)+'" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="16" font-weight="700" fill="'+c2+'">'+money.label+'</text>' +
    '</svg>';
  }
}

function renderMoney() {
  const row = gei('money-bills-row');
  if (!row) return;
  row.innerHTML = '';
  // Show only denominations <= total needed (rounded sensibly)
  const useful = AR_MONEY.filter(m => m.val <= td.cartTotal + 10);
  const toShow = useful.length > 0 ? useful : AR_MONEY.slice(0,5);
  toShow.forEach(money => {
    const btn = document.createElement('button');
    btn.className = 'money-btn';
    btn.innerHTML = makeBillSVG(money) + '<span class="money-btn-label">' + money.label + '</span>';
    btn.onclick = () => addToWallet(money);
    row.appendChild(btn);
  });
}

let walletIdCounter = 0;
function addToWallet(money) {
  if (td.walletTotal >= td.cartTotal + 500) return; // cap overflow
  const item = { ...money, uid: walletIdCounter++ };
  td.wallet.push(item);
  td.walletTotal += money.val;
  updateWalletDisplay();
  updateConfirmBtn();
}

function removeFromWallet(uid) {
  const idx = td.wallet.findIndex(w => w.uid === uid);
  if (idx < 0) return;
  td.walletTotal -= td.wallet[idx].val;
  td.wallet.splice(idx, 1);
  updateWalletDisplay();
  updateConfirmBtn();
}

function updateWalletDisplay() {
  const zone = gei('wallet-zone');
  const tot  = gei('wallet-total');
  if (!zone) return;
  if (td.wallet.length === 0) {
    zone.innerHTML = '<span class="wallet-empty">Tocá un billete o moneda para pagarlo</span>';
  } else {
    zone.innerHTML = '';
    td.wallet.forEach(item => {
      const span = document.createElement('span');
      span.className = 'wallet-item';
      span.innerHTML = makeBillSVG(item);
      span.title = 'Tocar para devolver';
      span.onclick = () => removeFromWallet(item.uid);
      zone.appendChild(span);
    });
  }
  if (tot) tot.textContent = '$' + td.walletTotal;
}

function updateConfirmBtn() {
  const btn = gei('tienda-confirm-btn');
  if (!btn) return;
  // Enable only when wallet >= cartTotal
  btn.disabled = td.walletTotal < td.cartTotal;
  if (td.walletTotal >= td.cartTotal && td.walletTotal > 0) {
    btn.textContent = td.walletTotal === td.cartTotal
      ? '✓ ¡Pago exacto! Confirmar'
      : '✓ Pago $' + td.walletTotal + ' (vuelto: $' + (td.walletTotal - td.cartTotal) + ')';
  } else {
    btn.textContent = td.walletTotal > 0
      ? 'Faltan $' + (td.cartTotal - td.walletTotal) + ' más'
      : '✓ ¡Confirmar pago!';
  }
}

function confirmPayment() {
  if (td.walletTotal < td.cartTotal) return;
  const exact = td.walletTotal === td.cartTotal;
  const vuelto = td.walletTotal - td.cartTotal;

  if (!exact) {
    // Go to phase 3 — vuelto question
    td.pendingVuelto = vuelto;
    showVueltoQuestion(vuelto);
  } else {
    // Exact payment — skip phase 3
    finishPurchase(true, 0);
  }
}

function showVueltoQuestion(vuelto) {
  // Switch to phase 3
  gei('tienda-phase2').classList.remove('active');
  gei('tienda-phase3').classList.add('active');

  if (gei('vuelto-compra')) gei('vuelto-compra').textContent = '$' + td.cartTotal;
  if (gei('vuelto-pago'))   gei('vuelto-pago').textContent   = '$' + td.walletTotal;
  if (gei('vuelto-feedback')) { gei('vuelto-feedback').textContent = ''; gei('vuelto-feedback').className = 'tienda-feedback'; }

  // Build 4 options: correct vuelto + 3 distractors
  const opts = new Set([vuelto]);
  let tries = 0;
  while (opts.size < 4 && tries < 60) {
    tries++;
    const d = vuelto + [-10,-5,5,10,15,-15][rnd(0,5)];
    if (d >= 0 && d !== vuelto) opts.add(d);
  }
  let extra = 5;
  while (opts.size < 4) { opts.add(vuelto + extra); extra += 5; }
  const shuffled = [...opts].sort(() => Math.random()-0.5);

  const optsEl = gei('vuelto-opts');
  if (optsEl) {
    optsEl.innerHTML = '';
    shuffled.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'granja-opt'; // reuse same style — big round buttons
      btn.style.cssText = 'min-width:72px; height:72px; font-size:1.2rem;';
      btn.innerHTML = '$' + val;
      btn.onclick = () => onVueltoAnswer(btn, val, vuelto);
      optsEl.appendChild(btn);
    });
  }
}

function onVueltoAnswer(btn, val, vuelto) {
  document.querySelectorAll('#vuelto-opts .granja-opt').forEach(b => b.disabled = true);
  const fb = gei('vuelto-feedback');
  if (val === vuelto) {
    btn.classList.add('correct');
    if (fb) { fb.textContent = '🎉 ¡Correcto! Te dan $' + vuelto + ' de vuelto. ¡Sos una crack!'; fb.className = 'tienda-feedback correct'; }
    setTimeout(() => finishPurchase(false, vuelto), 1200);
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('#vuelto-opts .granja-opt').forEach(b => {
      if (b.textContent === '$' + vuelto) b.classList.add('correct');
    });
    if (fb) { fb.textContent = 'El vuelto correcto es $' + vuelto + ' ($' + td.walletTotal + ' − $' + td.cartTotal + ')'; fb.className = 'tienda-feedback wrong'; }
    setTimeout(() => finishPurchase(false, vuelto), 1600);
  }
}

function finishPurchase(exact, vuelto) {
  td.hits++;
  td.score += exact ? 20 : 15;

  updateCoins(exact ? 3 : 2, null);
  if (gei('coin-display')) gei('coin-display').textContent = String(coins);
  if (gei('coins-big'))    gei('coins-big').textContent = coins + ' 🪙';
  if (gei('tienda-score-disp')) gei('tienda-score-disp').textContent = String(td.score);
  updateTiendaProgress();

  if (td.hits >= TIENDA_LEVELS[td.level-1].rounds) {
    setTimeout(() => misionCumplida('tienda', td.level, td.hits, TIENDA_LEVELS[td.level-1].rounds), 1200);
  } else {
    setTimeout(() => { backToPhase1(); renderTiendaShelf(); }, 1200);
  }
}

function updateTiendaProgress() {
  const cfg = TIENDA_LEVELS[Math.min(td.level,3)-1];
  const pct = Math.min((td.hits / cfg.rounds) * 100, 100);
  if (gei('tienda-prog-fill'))  gei('tienda-prog-fill').style.width  = pct + '%';
  if (gei('tienda-prog-label')) gei('tienda-prog-label').textContent  = td.hits + ' / ' + cfg.rounds;
  if (gei('tienda-hits-disp'))  gei('tienda-hits-disp').textContent   = td.hits + '/' + cfg.rounds;
  const lit = td.hits >= Math.floor(cfg.rounds*0.75) ? 3 : td.hits >= Math.floor(cfg.rounds*0.4) ? 2 : td.hits >= 1 ? 1 : 0;
  const stars = ['☆☆☆','⭐☆☆','⭐⭐☆','⭐⭐⭐'];
  if (gei('tienda-stars')) gei('tienda-stars').textContent = stars[lit];
}

function startTienda(level) {
  td = { level: level || 1, hits:0, score: td.score || 0, cart:[], wallet:[], walletTotal:0, cartTotal:0, currentProducts:[], phase:1, pendingVuelto:0 };
  misionOcultar('tienda');
  if (gei('tienda-score-disp')) gei('tienda-score-disp').textContent = String(td.score);
  backToPhase1();
  updateTiendaLevelLabel();
  renderTiendaShelf();
  renderMoney();
  updateTiendaProgress();
}

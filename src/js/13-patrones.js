// ── SECUENCIAS ────────────────────────────────────────────
// 3 levels: numbers → colors → shapes
// 4 tiles per sequence, blank always last → super clear
// 4 answer options, big and tappable

const SQ_COLORS = [
  {name:'rojo',    hex:'#E53935'},
  {name:'azul',    hex:'#1E88E5'},
  {name:'verde',   hex:'#43A047'},
  {name:'amarillo',hex:'#F9A825'},
  {name:'naranja', hex:'#FB8C00'},
  {name:'violeta', hex:'#8E24AA'},
];
const SQ_SHAPES = [
  {name:'círculo',   svg: c=>`<circle cx="30" cy="30" r="24" fill="${c}"/>`},
  {name:'cuadrado',  svg: c=>`<rect x="6" y="6" width="48" height="48" rx="8" fill="${c}"/>`},
  {name:'triángulo', svg: c=>`<polygon points="30,5 57,55 3,55" fill="${c}"/>`},
  {name:'estrella',  svg: c=>`<polygon points="30,4 36,22 56,22 40,34 46,54 30,42 14,54 20,34 4,22 24,22" fill="${c}"/>`},
  {name:'corazón',   svg: c=>`<path d="M30 50 C5 35 5 10 20 10 C25 10 30 15 30 15 C30 15 35 10 40 10 C55 10 55 35 30 50Z" fill="${c}"/>`},
];
const SQ_NUM_BG = ['#E53935','#1E88E5','#43A047','#F9A825'];

// Levels: which type and how many rounds
const SQ_LEVELS = [
  {type:'number', rounds:5, coins:3, label:'Nivel 1 — Números', name:'Números', icon:'🔢'},
  {type:'color',  rounds:5, coins:4, label:'Nivel 2 — Colores', name:'Colores', icon:'🎨'},
  {type:'shape',  rounds:5, coins:5, label:'Nivel 3 — Figuras', name:'Figuras', icon:'🔷'},
];
misionRegistrar('secuencias', {
  overlay:'seq-overlay', styleDisplay:true,
  emoji:'🔢🎨🔷', title:'¡Patrones Mágicos!', festejo:'Hoy encontraste un montón de patrones',
  levels: SQ_LEVELS, start: startSecuencias,
});

let sq = {level:1, done:0, hits:0, fallo:false, score:0, answer:'', dragVal:null, filled:false};
let sqDragEl = null, sqClone = null;

function initSecuencias() {
  misionInicio('secuencias');
  updateSqUI();
}

function startSecuencias(level) {
  sq = {level: level || 1, done:0, hits:0, fallo:false, score: sq.score || 0, answer:'', dragVal:null, filled:false};
  misionOcultar('secuencias');
  updateSqUI();
  nextSqProblem();
}

function updateSqUI() {
  const cfg = SQ_LEVELS[Math.min(sq.level,3)-1];
  if (gei('seq-level-label')) gei('seq-level-label').textContent = cfg.label;
  if (gei('seq-type-badge'))  gei('seq-type-badge').textContent  = cfg.icon + ' ' + cfg.label;
  if (gei('seq-hits-disp'))   gei('seq-hits-disp').textContent   = sq.hits + '/' + cfg.rounds;
  if (gei('seq-score-disp'))  gei('seq-score-disp').textContent  = String(sq.score);
  const pct = Math.min((sq.done/cfg.rounds)*100,100);
  if (gei('seq-prog-fill'))   gei('seq-prog-fill').style.width   = pct + '%';
  if (gei('seq-prog-label'))  gei('seq-prog-label').textContent  = sq.done + ' / ' + cfg.rounds;
  const lit = sq.hits>=4?3 : sq.hits>=2?2 : sq.hits>=1?1 : 0;
  if (gei('seq-stars'))       gei('seq-stars').textContent       = ['☆☆☆','⭐☆☆','⭐⭐☆','⭐⭐⭐'][lit];
}

function nextSqProblem() {
  sq.filled   = false;
  sq.fallo    = false;
  sq.dragVal  = null;
  sqDragEl    = null;
  const fb = gei('seq-feedback');
  if (fb) { fb.textContent = ''; fb.style.color = ''; }

  const cfg = SQ_LEVELS[Math.min(sq.level,3)-1];
  if      (cfg.type === 'number') buildSqNumber();
  else if (cfg.type === 'color')  buildSqColor();
  else                             buildSqShape();
}

// ── NUMBER sequence ───────────────────────────────────────
function buildSqNumber() {
  // step of 1, 2 or 5 — always start low so numbers are small
  const steps = [1,2,2,2,5];
  const step  = steps[rnd(0, steps.length-1)];
  const start = rnd(1, 5);
  // 4 tiles: 3 shown + 1 blank (always the 4th = last)
  const seq = [start, start+step, start+step*2, start+step*3];
  sq.answer  = String(seq[3]);

  updateSqHint('🔢',
    'Los números suben de ' + step + ' en ' + step + '.',
    seq.slice(0,3).map((v,i)=>sqMiniNum(v,i)).join(sqMiniArr()) + sqMiniArr() + sqMiniBlank()
  );

  const row = gei('seq-row');
  if (!row) return;
  row.innerHTML = '';
  seq.forEach((v, i) => {
    if (i > 0) row.insertAdjacentHTML('beforeend', sqArrow());
    if (i === 3) row.insertAdjacentHTML('beforeend', sqDropZone());
    else row.insertAdjacentHTML('beforeend', sqNumTile(v, i));
  });

  // 4 options: correct + 3 wrong (±step variations)
  const opts = new Set([seq[3]]);
  const wrongs = [seq[3]-step, seq[3]+step, seq[3]+step*2, seq[3]-1, seq[3]+1];
  for (const w of wrongs) { if (w > 0 && opts.size < 4) opts.add(w); }
  while (opts.size < 4) opts.add(seq[3] + opts.size);
  renderSqOpts([...opts].sort(()=>Math.random()-.5).map((v,i) =>
    ({val: String(v), html: String(v), bg: SQ_NUM_BG[i%4]})
  ));
}

// ── COLOR sequence ────────────────────────────────────────
function buildSqColor() {
  // Simple AB pattern: A B A B — blank is 4th (B)
  const [cA, cB] = sqShuffle(SQ_COLORS).slice(0, 2);
  const pat = [cA, cB, cA, cB]; // 4 tiles, blank = 4th
  sq.answer   = pat[3].name;

  updateSqHint('🎨',
    'Dos colores que se turnan: ' + cA.name + ' → ' + cB.name + ' → ' + cA.name + ' → ?',
    sqMiniColor(cA) + sqMiniArr() + sqMiniColor(cB) + sqMiniArr() + sqMiniColor(cA) + sqMiniArr() + sqMiniBlank()
  );

  const row = gei('seq-row');
  if (!row) return;
  row.innerHTML = '';
  pat.forEach((c, i) => {
    if (i > 0) row.insertAdjacentHTML('beforeend', sqArrow());
    if (i === 3) row.insertAdjacentHTML('beforeend', sqDropZone());
    else row.insertAdjacentHTML('beforeend', sqColorTile(c));
  });

  // 4 options: correct + 3 other colors
  const others = sqShuffle(SQ_COLORS.filter(c => c.name !== cA.name && c.name !== cB.name)).slice(0, 2);
  const pool = sqShuffle([pat[3], others[0], others[1], cA]); // cA as distractor
  renderSqOpts(pool.map(c => ({
    val:  c.name,
    html: `<span style="font-size: 0.85rem;font-weight:800;color:white;">${c.name}</span>`,
    bg:   c.hex,
  })));
}

// ── SHAPE sequence ────────────────────────────────────────
function buildSqShape() {
  // Simple AB pattern with shapes, one color
  const [sA, sB] = sqShuffle(SQ_SHAPES).slice(0, 2);
  const col = sqShuffle(SQ_COLORS)[0];
  const pat = [sA, sB, sA, sB]; // 4 tiles, blank = 4th
  sq.answer   = pat[3].name;

  updateSqHint('🔷',
    'Dos figuras que se turnan: ' + sA.name + ' → ' + sB.name + ' → ' + sA.name + ' → ?',
    sqMiniShape(sA, col) + sqMiniArr() + sqMiniShape(sB, col) + sqMiniArr() + sqMiniShape(sA, col) + sqMiniArr() + sqMiniBlank()
  );

  const row = gei('seq-row');
  if (!row) return;
  row.innerHTML = '';
  pat.forEach((s, i) => {
    if (i > 0) row.insertAdjacentHTML('beforeend', sqArrow());
    if (i === 3) row.insertAdjacentHTML('beforeend', sqDropZone());
    else row.insertAdjacentHTML('beforeend', sqShapeTile(s, col));
  });

  // 4 options: correct + 3 other shapes
  const others = sqShuffle(SQ_SHAPES.filter(s => s.name !== sA.name && s.name !== sB.name)).slice(0, 2);
  const pool = sqShuffle([pat[3], others[0], others[1], sA]);
  renderSqOpts(pool.map(s => ({
    val:  s.name,
    html: `<svg width="44" height="44" viewBox="0 0 60 60">${s.svg(col.hex)}</svg>`,
    bg:   'white',
    border: col.hex,
  })));
}

// ── Render helpers ────────────────────────────────────────
function sqShuffle(arr) { return [...arr].sort(()=>Math.random()-.5); }

function sqNumTile(v, i) {
  const bg = SQ_NUM_BG[i % SQ_NUM_BG.length];
  return `<div style="width:72px;height:72px;border-radius:16px;background:${bg};display:flex;align-items:center;justify-content:center;font-family:var(--font-num);font-size:2rem;font-weight:800;color:white;border:3px solid rgba(0,0,0,0.08);box-shadow:0 4px 10px rgba(0,0,0,0.15);flex-shrink:0;">${v}</div>`;
}
function sqColorTile(c) {
  return `<div style="width:72px;height:72px;border-radius:16px;background:${c.hex};display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:800;color:white;border:3px solid rgba(0,0,0,0.08);box-shadow:0 4px 10px rgba(0,0,0,0.15);flex-shrink:0;text-align:center;padding:4px;">${c.name}</div>`;
}
function sqShapeTile(s, col) {
  return `<div style="width:72px;height:72px;border-radius:16px;background:white;display:flex;align-items:center;justify-content:center;border:3px solid ${col.hex};box-shadow:0 4px 10px rgba(0,0,0,0.12);flex-shrink:0;"><svg width="48" height="48" viewBox="0 0 60 60">${s.svg(col.hex)}</svg></div>`;
}
function sqArrow() {
  return `<span style="font-size:1.6rem;color:#9C27B0;opacity:0.4;flex-shrink:0;">→</span>`;
}
function sqDropZone() {
  return `<div id="seq-drop" ondragover="event.preventDefault();this.style.background='rgba(156,39,176,0.2)';" ondragleave="this.style.background='rgba(255,255,255,0.6)';" ondrop="onSqDrop(event)" style="width:72px;height:72px;border-radius:16px;border:3.5px dashed #9C27B0;background:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;font-size:2rem;color:#CE93D8;flex-shrink:0;cursor:pointer;transition:all 0.15s;" onclick="onSqDropClick()">❓</div>`;
}

function renderSqOpts(pool) {
  const el = gei('seq-options');
  if (!el) return;
  el.innerHTML = '';
  pool.forEach(item => {
    const border = item.border ? `border:3px solid ${item.border};` : 'border:3px solid rgba(0,0,0,0.08);';
    const btn = document.createElement('div');
    btn.className = 'seq-opt';
    btn.dataset.value = item.val;
    btn.draggable = true;
    btn.style.cssText = `width:76px;height:76px;border-radius:16px;background:${item.bg};${border}display:flex;align-items:center;justify-content:center;font-family:var(--font-num);font-size:1.8rem;font-weight:800;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.18);cursor:pointer;flex-shrink:0;transition:transform 0.12s;`;
    btn.innerHTML = item.html;
    btn.addEventListener('click',    () => onSqOptClick(btn));
    btn.addEventListener('dragstart', e => { sqDragEl=btn; sq.dragVal=btn.dataset.value; e.dataTransfer.effectAllowed='move'; btn.style.opacity='0.4'; });
    btn.addEventListener('dragend',  () => btn.style.opacity='');
    btn.addEventListener('touchstart', sqTS, {passive:false});
    btn.addEventListener('touchmove',  sqTM, {passive:false});
    btn.addEventListener('touchend',   sqTE, {passive:false});
    el.appendChild(btn);
  });
}

// ── Click to place (most important for TDL kids on tablets) ──
let sqSelectedOpt = null;
function onSqOptClick(btn) {
  if (sq.filled) return;
  // First tap → highlight; second tap on same → deselect; different → place
  if (sqSelectedOpt === btn) {
    btn.style.transform = '';
    btn.style.boxShadow = '';
    sqSelectedOpt = null;
    sq.dragVal = null;
    return;
  }
  if (sqSelectedOpt) { sqSelectedOpt.style.transform=''; sqSelectedOpt.style.boxShadow=''; }
  sqSelectedOpt = btn;
  sq.dragVal = btn.dataset.value;
  btn.style.transform = 'scale(1.12) translateY(-4px)';
  btn.style.boxShadow = '0 8px 20px rgba(156,39,176,0.4)';
  // Auto-fill drop zone after short delay so kid can see which is selected
  setTimeout(() => { if (!sq.filled && sq.dragVal) checkSqAnswer(sq.dragVal); }, 300);
}

function onSqDropClick() {
  if (sq.dragVal) checkSqAnswer(sq.dragVal);
}
function onSqDrop(e) {
  e.preventDefault();
  const drop = gei('seq-drop');
  if (drop) drop.style.background = 'rgba(255,255,255,0.6)';
  if (sq.dragVal) checkSqAnswer(sq.dragVal);
}

// ── Touch drag ────────────────────────────────────────────
function sqTS(e) {
  e.preventDefault();
  const opt = e.currentTarget;
  sqDragEl = opt; sq.dragVal = opt.dataset.value;
  sqClone = opt.cloneNode(true);
  sqClone.style.cssText += 'position:fixed;opacity:0.85;pointer-events:none;z-index:9999;transform:scale(1.1);';
  document.body.appendChild(sqClone);
  sqMoveClone(e.touches[0]);
  opt.style.opacity = '0.4';
}
function sqTM(e) {
  e.preventDefault();
  if (!sqClone) return;
  sqMoveClone(e.touches[0]);
  const drop = gei('seq-drop');
  if (drop) {
    const r=drop.getBoundingClientRect(), t=e.touches[0];
    const over=t.clientX>=r.left&&t.clientX<=r.right&&t.clientY>=r.top&&t.clientY<=r.bottom;
    drop.style.background = over ? 'rgba(156,39,176,0.2)' : 'rgba(255,255,255,0.6)';
  }
}
function sqTE(e) {
  e.preventDefault();
  if (sqClone) { sqClone.remove(); sqClone=null; }
  if (sqDragEl) sqDragEl.style.opacity='';
  const drop = gei('seq-drop');
  if (drop && drop.style.background.includes('0.2')) {
    drop.style.background='rgba(255,255,255,0.6)';
    if (sq.dragVal) checkSqAnswer(sq.dragVal);
  }
  sqDragEl=null;
}
function sqMoveClone(t) {
  if (!sqClone) return;
  sqClone.style.left=(t.clientX-sqClone.offsetWidth/2)+'px';
  sqClone.style.top =(t.clientY-sqClone.offsetHeight/2)+'px';
}

// ── Answer check ──────────────────────────────────────────
function checkSqAnswer(val) {
  if (sq.filled) return;
  sq.filled = true;
  if (sqSelectedOpt) { sqSelectedOpt.style.transform=''; sqSelectedOpt.style.boxShadow=''; sqSelectedOpt=null; }

  const drop = gei('seq-drop');
  const fb   = gei('seq-feedback');
  const correct = String(val) === String(sq.answer);
  const draggedOpt = document.querySelector('.seq-opt[data-value="'+val+'"]');

  // Fill the drop zone
  if (drop && draggedOpt) {
    drop.style.cssText = draggedOpt.style.cssText + 'border-style:solid;border-color:'+(correct?'#43A047':'#D84040')+';cursor:default;';
    drop.innerHTML = draggedOpt.innerHTML;
    drop.removeAttribute('ondragover'); drop.removeAttribute('ondragleave'); drop.removeAttribute('ondrop');
  }
  document.querySelectorAll('.seq-opt').forEach(b => b.style.pointerEvents='none');

  if (correct) {
    if (draggedOpt) draggedOpt.style.opacity='0.3';
    if (fb) { fb.textContent='🎉 ¡Muy bien! ¡Encontraste el patrón!'; fb.style.color='#1B5E20'; }
    sq.done++; if (!sq.fallo) sq.hits++; sq.score += 10 + sq.level*2;
    updateCoins(2, null);
    if (gei('coin-display')) gei('coin-display').textContent=String(coins);
    if (gei('coins-big'))    gei('coins-big').textContent=coins+' 🪙';
    updateSqUI();

    if (sq.done >= SQ_LEVELS[sq.level-1].rounds) {
      setTimeout(() => {
        if (fb) { fb.textContent=''; fb.style.color=''; }
        misionCumplida('secuencias', sq.level, sq.hits, SQ_LEVELS[sq.level-1].rounds);
      }, 1300);
    } else {
      setTimeout(nextSqProblem, 1300);
    }
  } else {
    if (fb) { fb.textContent='Esa no es… mirá el patrón de nuevo 🤔'; fb.style.color='#D85A30'; }
    sq.filled=false;
    sq.fallo=true;
    setTimeout(()=>{
      if (drop) {
        drop.style.cssText='width:72px;height:72px;border-radius:16px;border:3.5px dashed #9C27B0;background:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;font-size:2rem;color:#CE93D8;flex-shrink:0;cursor:pointer;transition:all 0.15s;';
        drop.innerHTML='❓';
        drop.setAttribute('ondragover',"event.preventDefault();this.style.background='rgba(156,39,176,0.2)';");
        drop.setAttribute('ondragleave',"this.style.background='rgba(255,255,255,0.6)';");
        drop.setAttribute('ondrop','onSqDrop(event)');
      }
      document.querySelectorAll('.seq-opt').forEach(b=>b.style.pointerEvents='');
      if (fb) { fb.textContent=''; fb.style.color=''; }
    }, 1000);
  }
}

// ── Hint panel ────────────────────────────────────────────
function updateSqHint(icon, text, demoHTML) {
  if (gei('seq-hint-icon')) gei('seq-hint-icon').textContent = icon;
  if (gei('seq-hint-text')) gei('seq-hint-text').textContent = text;
  if (gei('seq-hint-demo')) gei('seq-hint-demo').innerHTML   = demoHTML;
}
function sqMiniNum(v,i) {
  return `<div style="width:28px;height:28px;border-radius:7px;background:${SQ_NUM_BG[i%4]};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.8rem;color:white;flex-shrink:0;">${v}</div>`;
}
function sqMiniColor(c) {
  return `<div style="width:28px;height:28px;border-radius:7px;background:${c.hex};flex-shrink:0;"></div>`;
}
function sqMiniShape(s,c) {
  return `<div style="width:28px;height:28px;border-radius:7px;background:white;border:2px solid ${c.hex};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 60 60">${s.svg(c.hex)}</svg></div>`;
}
function sqMiniArr() {
  return `<span style="font-size: 0.85rem;color:#9C27B0;opacity:0.6;">→</span>`;
}
function sqMiniBlank() {
  return `<div style="width:28px;height:28px;border-radius:7px;border:2px dashed #9C27B0;display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:#CE93D8;flex-shrink:0;">?</div>`;
}

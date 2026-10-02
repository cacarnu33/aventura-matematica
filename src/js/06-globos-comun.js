// ── SHARED BALLOON HELPERS ──────────────────────────────
function makeBalloonSVG(value, colorPair, size) {
  const [fill, shadow] = colorPair;
  const w = size, h = size * 1.18;
  const cx = w/2, cy = h*0.46;
  const rx = w*0.46, ry = h*0.44;
  const gid = 'bg' + value + '_' + (Date.now() % 99999);
  return '<svg class="balloon-svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><radialGradient id="'+gid+'" cx="38%" cy="32%" r="62%">' +
      '<stop offset="0%" stop-color="white" stop-opacity="0.35"/>' +
      '<stop offset="100%" stop-color="'+shadow+'" stop-opacity="1"/>' +
    '</radialGradient></defs>' +
    '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="url(#'+gid+')" stroke="'+shadow+'" stroke-width="1.5" opacity="0.95"/>' +
    '<ellipse cx="'+(cx*0.72)+'" cy="'+(cy*0.62)+'" rx="'+(rx*0.18)+'" ry="'+(ry*0.13)+'" fill="white" opacity="0.45" transform="rotate(-30,'+(cx*0.72)+','+(cy*0.62)+')"/>' +
    '<polygon points="'+(cx-6)+','+(cy+ry)+' '+(cx+6)+','+(cy+ry)+' '+cx+','+(cy+ry+10)+'" fill="'+fill+'"/>' +
    '<text x="'+cx+'" y="'+(cy+6)+'" text-anchor="middle" dominant-baseline="middle" font-family="Fredoka, sans-serif" font-size="'+(size*0.32)+'px" font-weight="800" fill="white" paint-order="stroke" stroke="rgba(0,0,0,0.25)" stroke-width="2">'+value+'</text>' +
  '</svg>';
}

// Shared horizontal-spread spawner — tracks recently used x positions
// Each game passes its own usedLeft array reference

function getSpawnLeft(arenaId, arenaW, size) {
  const minGap = size + 20;
  const margin = Math.ceil(size / 2) + 14;
  const maxLeft = arenaW - margin;
  if (maxLeft <= margin) return Math.floor(arenaW / 2);

  // Read live positions of existing balloons
  const arena = document.getElementById(arenaId);
  const occupied = arena
    ? Array.from(arena.querySelectorAll('.balloon-wrap,.puppy-wrap'))
        .map(b => parseInt(b.style.left) || 0)
    : [];

  for (let attempt = 0; attempt < 20; attempt++) {
    const left = rnd(margin, maxLeft);
    const tooClose = occupied.some(used => Math.abs(used - left) < minGap);
    if (!tooClose) return left;
  }
  // Divide arena into columns and pick least-occupied
  const cols = Math.max(2, Math.floor(arenaW / (size + 16)));
  const colW = arenaW / cols;
  let best = margin, bestCount = Infinity;
  for (let c = 0; c < cols; c++) {
    const cx = Math.round(colW * c + colW / 2);
    if (cx < margin || cx > maxLeft) continue;
    const cnt = occupied.filter(u => Math.abs(u - cx) < minGap).length;
    if (cnt < bestCount) { bestCount = cnt; best = cx; }
  }
  return best;
}


// Puppy characters for Suma Globos — original SVG designs
const PUPPIES = [
  { name:'Rojo',    body:'#E53935', helmet:'#B71C1C', badge:'#FFEB3B', ear:'#C62828' },
  { name:'Azul',    body:'#1E88E5', helmet:'#0D47A1', badge:'#F5F5F5', ear:'#1565C0' },
  { name:'Amarillo',body:'#F9A825', helmet:'#E65100', badge:'#FFFFFF', ear:'#F57F17' },
  { name:'Rosa',    body:'#E91E63', helmet:'#880E4F', badge:'#FFFFFF', ear:'#C2185B' },
  { name:'Verde',   body:'#43A047', helmet:'#1B5E20', badge:'#FFEB3B', ear:'#2E7D32' },
  { name:'Naranja', body:'#FB8C00', helmet:'#E65100', badge:'#FFFFFF', ear:'#EF6C00' },
];

function makePuppySVG(value, puppyIdx, size) {
  const p = PUPPIES[puppyIdx % PUPPIES.length];
  const w = size, h = size * 1.1;
  const cx = w / 2;

  // Body proportions
  const bodyY = h * 0.38, bodyR = w * 0.38;
  const headY = h * 0.26, headR = w * 0.28;
  const earW = w * 0.13, earH = w * 0.16;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
    <defs>
      <radialGradient id="pbody${puppyIdx}_${value}" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${p.body}"/>
      </radialGradient>
      <radialGradient id="phead${puppyIdx}_${value}" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stop-color="white" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${p.ear}"/>
      </radialGradient>
    </defs>

    <!-- Body -->
    <ellipse cx="${cx}" cy="${bodyY}" rx="${bodyR}" ry="${bodyR*0.85}"
      fill="url(#pbody${puppyIdx}_${value})" stroke="${p.ear}" stroke-width="1.2"/>

    <!-- Tail -->
    <path d="M${cx+bodyR*0.7},${bodyY} Q${cx+bodyR*1.2},${bodyY-bodyR*0.5} ${cx+bodyR*0.9},${bodyY-bodyR*0.9}"
      stroke="${p.ear}" stroke-width="${w*0.055}" fill="none" stroke-linecap="round"/>

    <!-- Left ear -->
    <ellipse cx="${cx - headR*0.7}" cy="${headY - headR*0.6}"
      rx="${earW}" ry="${earH}" fill="${p.ear}" transform="rotate(-20,${cx - headR*0.7},${headY - headR*0.6})"/>
    <!-- Right ear -->
    <ellipse cx="${cx + headR*0.7}" cy="${headY - headR*0.6}"
      rx="${earW}" ry="${earH}" fill="${p.ear}" transform="rotate(20,${cx + headR*0.7},${headY - headR*0.6})"/>

    <!-- Head -->
    <circle cx="${cx}" cy="${headY}" r="${headR}"
      fill="url(#phead${puppyIdx}_${value})" stroke="${p.ear}" stroke-width="1.2"/>

    <!-- Snout -->
    <ellipse cx="${cx}" cy="${headY + headR*0.45}" rx="${headR*0.52}" ry="${headR*0.32}" fill="white" opacity="0.85"/>
    <!-- Nose -->
    <ellipse cx="${cx}" cy="${headY + headR*0.32}" rx="${headR*0.18}" ry="${headR*0.13}" fill="#333"/>
    <!-- Smile -->
    <path d="M${cx - headR*0.22},${headY + headR*0.52} Q${cx},${headY + headR*0.68} ${cx + headR*0.22},${headY + headR*0.52}"
      stroke="#555" stroke-width="1.2" fill="none" stroke-linecap="round"/>

    <!-- Eyes -->
    <circle cx="${cx - headR*0.34}" cy="${headY - headR*0.08}" r="${headR*0.14}" fill="#222"/>
    <circle cx="${cx + headR*0.34}" cy="${headY - headR*0.08}" r="${headR*0.14}" fill="#222"/>
    <circle cx="${cx - headR*0.3}"  cy="${headY - headR*0.12}" r="${headR*0.05}" fill="white"/>
    <circle cx="${cx + headR*0.3}"  cy="${headY - headR*0.12}" r="${headR*0.05}" fill="white"/>

    <!-- Helmet/hat -->
    <ellipse cx="${cx}" cy="${headY - headR*0.55}" rx="${headR*0.85}" ry="${headR*0.28}"
      fill="${p.helmet}"/>
    <rect x="${cx - headR*0.62}" y="${headY - headR*0.95}" width="${headR*1.24}" height="${headR*0.5}"
      rx="${headR*0.18}" fill="${p.helmet}"/>
    <!-- Helmet badge -->
    <circle cx="${cx}" cy="${headY - headR*0.75}" r="${headR*0.18}" fill="${p.badge}" opacity="0.9"/>

    <!-- Paws -->
    <ellipse cx="${cx - bodyR*0.5}" cy="${bodyY + bodyR*0.72}" rx="${w*0.1}" ry="${w*0.07}"
      fill="${p.ear}" stroke="${p.body}" stroke-width="0.8"/>
    <ellipse cx="${cx + bodyR*0.5}" cy="${bodyY + bodyR*0.72}" rx="${w*0.1}" ry="${w*0.07}"
      fill="${p.ear}" stroke="${p.body}" stroke-width="0.8"/>

    <!-- Number badge -->
    <circle cx="${cx + bodyR*0.82}" cy="${bodyY - bodyR*0.75}" r="${headR*0.52}" fill="white" stroke="${p.helmet}" stroke-width="2"/>
    <text x="${cx + bodyR*0.82}" y="${bodyY - bodyR*0.75 + headR*0.18}"
      text-anchor="middle" font-family="Fredoka, sans-serif" font-size="${headR*0.7}px"
      font-weight="900" fill="${p.helmet}">${value}</text>
  </svg>`;
}

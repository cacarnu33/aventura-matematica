// Pruebas de punta a punta: lo que haría Verita, pero automático.
import { test, expect } from '@playwright/test';

const JUEGOS = ['conteo', 'contar', 'secuencias', 'suma', 'resta', 'suma-globos', 'cohetes', 'comparar', 'granja', 'conejos', 'tienda', 'memotest'];
const CON_MISIONES = JUEGOS.filter(j => j !== 'conteo');

// Junta los errores de JavaScript de la página: ninguna prueba debe terminar con errores
test.beforeEach(async ({ page }, info) => {
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errores.push(m.text()); });
  info.errores = errores;
  // La voz no hace falta en las pruebas (y en modo automático puede no existir)
  await page.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => {}); });
});
test.afterEach(async ({}, info) => {
  expect(info.errores, 'errores de JavaScript en la página').toEqual([]);
});

// Ayudante: juega una misión dentro de la página, respondiendo bien salvo la 2ª
async function jugarMision(page, clave, estado, respuesta) {
  return page.evaluate(async ({ clave, estado, respuesta }) => {
    const esperar = ms => new Promise(r => setTimeout(r, ms));
    const hasta = async (fn, ms = 5000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (fn()) return true; } catch (e) {} await esperar(50); } return false; };
    const st = () => window.eval(estado);
    const responder = new Function('equivocarse', respuesta);
    goToScreen(clave);
    misionElegir(clave, 1);
    for (let i = 0; i < 5; i++) {
      const antes = st().done;
      await hasta(() => !st().answered);
      await esperar(100);
      responder(i === 1);
      if (!(await hasta(() => st().done > antes))) return 'no avanzó en el ejercicio ' + (i + 1);
    }
    if (!(await hasta(() => MISIONES[clave].pantalla === 'mision', 6000))) return 'no apareció "misión cumplida"';
    return { done: st().done, hits: st().hits, ganadas: MISIONES[clave].ganadas };
  }, { clave, estado, respuesta });
}
const tocar = (sel, valor) => `
  const bs = [...document.querySelectorAll('${sel}')];
  const b = equivocarse ? bs.find(x => +x.textContent !== ${valor}) : bs.find(x => +x.textContent === ${valor});
  b.click();`;

test.describe('inicio y navegación', () => {
  test('abre en la pantalla de inicio con todos los juegos', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#screen-inicio')).toBeVisible();
    await expect(page.locator('.home-tile')).toHaveCount(JUEGOS.length);
    await expect(page.locator('.home-btn')).toBeHidden();
  });

  test('cada tarjeta abre su juego y 🏠 vuelve al inicio', async ({ page }) => {
    await page.goto('/');
    for (const tile of await page.locator('.home-tile').all()) {
      await tile.click();
      await expect(page.locator('.home-btn')).toBeVisible();
      await page.locator('.home-btn').click();
      await expect(page.locator('#screen-inicio')).toBeVisible();
    }
  });

  test('cada juego muestra "Elegí una misión" (o las instrucciones del memotest)', async ({ page }) => {
    await page.goto('/');
    for (const j of CON_MISIONES) {
      const r = await page.evaluate(j => { goToScreen(j); const ov = document.getElementById(MISIONES[j].overlay); return { pantalla: MISIONES[j].pantalla, visible: getComputedStyle(ov).display !== 'none' }; }, j);
      expect(r, j).toEqual({ pantalla: 'inicio', visible: true });
    }
  });

  test('en el celular el cartel de misión entra completo en cada juego', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const cortados = await page.evaluate(j => j.filter(k => {
      goToScreen(k); misionInicio(k);
      const ov = document.getElementById(MISIONES[k].overlay), r = ov.getBoundingClientRect();
      return [...ov.children].some(c => { const b = c.getBoundingClientRect(); return b.top < r.top - 1 || b.bottom > r.bottom + 1; });
    }), CON_MISIONES);
    expect(cortados).toEqual([]);
  });
});

test.describe('misiones completas (con un error a propósito)', () => {
  const casos = [
    ['suma',     'suma2',  tocar('.suma2-opt', 'suma2.a + suma2.b')],
    ['resta',    'resta2', tocar('.resta2-opt', 'resta2.a - resta2.b')],
    ['contar',   'ct',     tocar('.contar-opt', 'ct.count')],
    ['conejos',  'cn',     tocar('.conejos-opt', 'cn.quotient')],
    ['granja',   'gr',     tocar('.granja-opt', 'gr.factor * gr.tabla')],
    ['comparar', 'cmp2',   `const a = cmp2.a, b = cmp2.b;
      const c = a === b ? '=' : (cmp2.target === 'mas' ? (a > b ? 'A' : 'B') : (a < b ? 'A' : 'B'));
      onCmp2Pick(equivocarse ? (c === 'A' ? 'B' : 'A') : c);`],
  ];
  for (const [clave, estado, respuesta] of casos) {
    test(clave, async ({ page }) => {
      await page.goto('/');
      const r = await jugarMision(page, clave, estado, respuesta);
      expect(r).toEqual({ done: 5, hits: 4, ganadas: { 1: true } });
    });
  }

  test('cohetes (incluye dejar pasar el reloj)', async ({ page }) => {
    await page.goto('/');
    const r = await page.evaluate(async () => {
      const esperar = ms => new Promise(r => setTimeout(r, ms));
      const hasta = async (fn, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await esperar(50); } return false; };
      goToScreen('cohetes'); misionElegir('cohetes', 1);
      for (let i = 0; i < 5; i++) {
        const antes = cr.done;
        await hasta(() => document.querySelector('.cohetes-opt') && ![...document.querySelectorAll('.cohetes-opt')].some(b => b.disabled), 4000);
        if (i !== 2) [...document.querySelectorAll('.cohetes-opt')].find(b => +b.textContent === cr.answer).click();
        await hasta(() => cr.done > antes, 10000);   // en el 3º se acaba el tiempo
      }
      await hasta(() => MISIONES.cohetes.pantalla === 'mision', 4000);
      return { done: cr.done, hits: cr.hits, pantalla: MISIONES.cohetes.pantalla };
    });
    expect(r).toEqual({ done: 5, hits: 4, pantalla: 'mision' });
  });

  test('patrones (si se equivoca, reintenta)', async ({ page }) => {
    await page.goto('/');
    const r = await page.evaluate(async () => {
      const esperar = ms => new Promise(r => setTimeout(r, ms));
      goToScreen('secuencias'); misionElegir('secuencias', 1);
      for (let i = 0; i < 5; i++) {
        const antes = sq.done;
        while (sq.filled) await esperar(50);
        if (i === 0) {
          const mal = [...document.querySelectorAll('.seq-opt')].map(b => b.dataset.value).find(v => String(v) !== String(sq.answer));
          checkSqAnswer(mal); await esperar(1200);
        }
        checkSqAnswer(sq.answer);
        while (sq.done === antes) await esperar(50);
      }
      while (MISIONES.secuencias.pantalla !== 'mision') await esperar(50);
      return { done: sq.done, hits: sq.hits };
    });
    expect(r).toEqual({ done: 5, hits: 4 });
  });

  test('tienda (4 compras)', async ({ page }) => {
    await page.goto('/');
    const r = await page.evaluate(async () => {
      goToScreen('tienda'); misionElegir('tienda', 1);
      for (let i = 0; i < 4; i++) { finishPurchase(true, 0); await new Promise(r => setTimeout(r, 1300)); }
      return MISIONES.tienda.pantalla;
    });
    expect(r).toBe('mision');
  });
});

test.describe('memotest', () => {
  test('par correcto marca ✓ y un error marca ✗ y vuelve a ocultar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { goToScreen('memotest'); startMemotest(); });
    const r = await page.evaluate(async () => {
      const esperar = ms => new Promise(r => setTimeout(r, ms));
      const c = memo.cards;
      const b = c.findIndex((x, i) => i > 0 && x.pairId !== c[0].pairId);
      onMemoCardClick(0); onMemoCardClick(b); await esperar(700);
      const marcasError = document.querySelectorAll('.memo-mark.no').length;
      await esperar(1000);
      const ocultas = document.querySelectorAll('.memo-card.flipped').length === 0;
      const p = c.findIndex((x, i) => i > 0 && x.pairId === c[0].pairId);
      onMemoCardClick(0); onMemoCardClick(p); await esperar(700);
      return { marcasError, ocultas, marcasOk: document.querySelectorAll('.memo-mark.ok').length, pares: memo.matched.size };
    });
    expect(r).toEqual({ marcasError: 2, ocultas: true, marcasOk: 2, pares: 1 });
  });

  test('los resultados de un tablero nunca se repiten', async ({ page }) => {
    await page.goto('/');
    const repetidos = await page.evaluate(() => {
      let malos = 0;
      for (let lvl = 1; lvl <= 3; lvl++) for (let k = 0; k < 50; k++) {
        memo.level = lvl; startMemotest();
        const res = memo.pairs.map(p => p.res);
        if (new Set(res).size !== res.length) malos++;
      }
      return malos;
    });
    expect(repetidos).toBe(0);
  });
});

test.describe('reglas de los ejercicios', () => {
  test('suma y resta siempre entran en la recta 0–10', async ({ page }) => {
    await page.goto('/');
    const fuera = await page.evaluate(() => {
      let malos = [];
      for (let lvl = 1; lvl <= 3; lvl++) {
        startSuma2(lvl); startResta2(lvl);
        for (let k = 0; k < 200; k++) {
          nextSuma2(); nextResta2();
          if (suma2.a + suma2.b > 10 || suma2.a < 1 || suma2.b < 1) malos.push('suma ' + suma2.a + '+' + suma2.b);
          if (resta2.a > 10 || resta2.a - resta2.b < 1 || resta2.b < 1) malos.push('resta ' + resta2.a + '-' + resta2.b);
        }
      }
      return malos.slice(0, 5);
    });
    expect(fuera).toEqual([]);
  });
});

test.describe('progreso guardado', () => {
  test('monedas y misiones siguen ahí después de recargar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { updateCoins(7, null); misionCumplida('suma', 1, 4, 5); });
    await page.reload();
    const r = await page.evaluate(() => ({ coins, ganadas: MISIONES.suma.ganadas, pantalla: document.getElementById('coin-display').textContent }));
    expect(r.coins).toBeGreaterThanOrEqual(10);       // 7 + 3 de la misión
    expect(r.pantalla).toBe(String(r.coins));
    expect(r.ganadas).toEqual({ 1: true });
  });

  test('canjear un premio descuenta monedas y queda en el historial', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => updateCoins(10, null));
    await page.locator('.gift-btn').click();
    await page.locator('.prize-btn.can-buy').first().click();
    await expect(page.locator('.history-item')).toHaveCount(1);
    await page.reload();
    await page.locator('.gift-btn').click();
    await expect(page.locator('.history-item')).toHaveCount(1);
    await expect(page.locator('.prize-claimed-badge')).toHaveCount(1);
  });

  test('"Borrar progreso" empieza de cero', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => updateCoins(5, null));
    page.on('dialog', d => d.accept());
    await page.locator('.gift-btn').click();
    await page.locator('.progreso-borrar-btn').click();
    await page.waitForLoadState('load');
    expect(await page.evaluate(() => coins)).toBe(0);
  });

  test('si el navegador no deja guardar, se juega igual', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqueado'); } });
    });
    await page.goto('/');
    await page.evaluate(() => updateCoins(3, null));
    expect(await page.evaluate(() => coins)).toBe(3);
  });
});

test.describe('app instalable', () => {
  test('tiene manifiesto, íconos y service worker activo', async ({ page }) => {
    await page.goto('/');
    const manifest = await (await page.request.get('/manifest.webmanifest')).json();
    expect(manifest.short_name).toBe('Verita');
    for (const icon of manifest.icons) expect((await page.request.get('/' + icon.src)).status(), icon.src).toBe(200);
    const sw = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state);
    expect(sw).toBe('activated');
    // El build tiene que poner la versión real (si no, las copias viejas nunca se borran)
    const swCodigo = await (await page.request.get('/sw.js')).text();
    expect(swCodigo).not.toContain('__VERSION__');
    expect(swCodigo).toMatch(/const CACHE = 'verita-\d{12}';/);
  });

  test('funciona sin internet después de la primera visita', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();   // ya controlada por el service worker
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#screen-inicio')).toBeVisible();
    await expect(page.locator('.home-tile')).toHaveCount(JUEGOS.length);
    await context.setOffline(false);
  });
});

test.describe('versión de desarrollo (archivos separados)', () => {
  test('src/ carga sin errores y se puede jugar', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page.locator('.home-tile')).toHaveCount(JUEGOS.length);
    const r = await jugarMision(page, 'suma', 'suma2', tocar('.suma2-opt', 'suma2.a + suma2.b'));
    expect(r).toEqual({ done: 5, hits: 4, ganadas: { 1: true } });
  });
});

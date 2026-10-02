# Las Aventuras de Verita

Aplicación web educativa de matemática. El código se edita **separado en archivos**
(`src/`) y el build arma **un único `dist/index.html`** con todo adentro, que
funciona sin internet y con doble clic. Publicada, además es una **app instalable
(PWA)** que funciona offline y **guarda el progreso** en el dispositivo.

## Para quién es (esto define TODAS las decisiones)

Diseñada para **una nena de 7 a 9 años con TDL (Trastorno del Desarrollo del
Lenguaje) y posible dislexia**. Cualquier cambio respeta estos principios:

- **Carga verbal mínima**: textos cortos, directos, sin párrafos largos.
- **Apoyo visual permanente**: todo concepto se muestra con objetos, colores o
  pictogramas, no solo con números o palabras.
- **Fuente clara y grande**: "Comic Neue" para textos (la `a` y la `g` como se
  escriben a mano) y "Fredoka" (redondeada) para números y títulos — variables
  CSS `--font-text` y `--font-num`.
- **Sin presión de tiempo** (excepto el juego de Cohetes, opcional, con reloj).
- **Feedback inmediato y concreto**: al acertar, festejo (confetti + sonido +
  animación); al equivocarse, mensaje amable y se muestra la respuesta correcta.
  Nunca castigo.
- **Tocar en vez de escribir**: casi todos los juegos se resuelven eligiendo entre
  opciones grandes, no con teclado.
- **Lectura por voz**: botón 🔊 fijo abajo que lee la instrucción de cada pantalla
  (Web Speech API, español es-AR, velocidad lenta 0.82x).

Regla mental: **más visual y más simple es siempre mejor**. Si dudás, elegí la
opción más concreta.

## Estructura técnica

- **Dónde está cada cosa**:
  - `src/index.html` — el HTML de todas las pantallas.
  - `src/styles.css` — todos los estilos.
  - `src/js/NN-nombre.js` — un archivo por juego o sistema (`01-base`,
    `02-misiones`, `03-suma`… `17-voz`, `18-progreso`, `99-arranque`). Son
    **scripts clásicos que comparten el ámbito global** (no módulos): por eso los
    `onclick="..."` del HTML funcionan. Se cargan en orden numérico; un archivo
    nuevo se agrega con su `<script src>` en `src/index.html` (el build avisa si
    falta).
  - `public/` — manifiesto, íconos y `sw.js` (service worker) de la app instalable.
  - `scripts/` — `build.mjs`, `serve.mjs` (servidor local) e `iconos.mjs`.
  - `tests/app.spec.mjs` — pruebas automáticas (Playwright + Edge).
  - `dist/` — lo que se publica; **se genera, no se edita**.
- **Navegación por pantallas**: la app abre en `screen-inicio`, con tarjetas
  de colores agrupadas por tema (Contar · Sumar y restar · Más juegos). Cada
  tarjeta llama a `goToScreen('nombre')`, que oculta todas las `.screen` y
  muestra la elegida. Dentro de un juego, el header muestra "🏠 Inicio" y el
  nombre del juego (`JUEGO_NOMBRES`); 🎁 y las monedas llevan a Premios. Un
  juego nuevo necesita su tarjeta en `screen-inicio` y su entrada en
  `JUEGO_NOMBRES`.
- **Helper clave**: `gei(id)` es atajo de `document.getElementById(id)`.
  **IMPORTANTE**: todo acceso al DOM va protegido con `if (gei('id'))` antes de
  escribir, porque algunas funciones corren antes de que la pantalla esté visible
  y eso dispara "Cannot set properties of null".
- **Sonidos**: Web Audio API (`playTone`, `playSuccessSound`, `playWrongSound`),
  sin archivos de audio externos.
- **Confetti**: `launchConfettiIn(arenaId)` inyecta piezas animadas en cualquier
  contenedor.
- **Monedas y premios**: variable global `coins`, función
  `updateCoins(cantidad, elementoId)`. Tienda de premios canjeables. La barra de
  progreso va hasta `MAX_PRIZE_COST` (25). El historial de canjes es
  `premiosHistorial`.
- **Progreso guardado** (`18-progreso.js`): `progresoGuardar()` guarda en
  `localStorage` (clave `verita-progreso-v1`) monedas, misiones cumplidas,
  premios canjeados e historial; se llama desde `updateCoins`, `claimPrize` y
  `misionCumplida`. `progresoCargar()` corre al arrancar. Los premios canjeados
  vuelven a estar disponibles al día siguiente. Si el navegador no deja guardar,
  se juega igual. Si se agrega algo que deba recordarse, sumarlo ahí.

## Patrón común de cada juego

Casi todos siguen la misma estructura:

- Un array `XXX_LEVELS` con la config de cada nivel (rondas, dificultad, monedas).
- Un objeto de estado global (ej. `suma2`, `resta2`, `cmp2`, `memo`).
- `initXxx()` — muestra el overlay de inicio.
- `startXxx()` — resetea el estado y arranca.
- `nextXxxProblem()` — genera el siguiente ejercicio.
- `onXxxAnswer()` — verifica, da feedback, suma monedas, avanza de nivel.
- `updateXxxUI()` — actualiza puntos, aciertos, barra de progreso y estrellas.

### Misiones (todos los juegos)

Cada nivel es una **misión corta** (5 ejercicios; Tienda 4 compras; Memotest un
tablero de 4 pares). Sistema común en el bloque `MISIONES` del script:

- `misionRegistrar(clave, cfg)` — la clave es el nombre de la pantalla
  (`'suma'`, `'suma-globos'`…); `cfg.levels` necesita `icon`, `name` y `coins`.
- `initXxx()` llama a `misionInicio(clave)` → Verita elige el nivel.
- `startXxx(level)` llama a `misionOcultar(clave)`.
- Cada ejercicio cuenta **acierte o no** (`done`), así la misión siempre se
  termina; `hits` solo define las estrellas (mínimo 1).
- Al terminar: `misionCumplida(clave, nivel, hits, total)` → festejo con
  "Probar Nivel N →" o "🎉 Festejar y terminar". Sin vidas ni "game over".
- Suma y Resta siguen la progresión visual → números con recta numérica →
  problemita leído en voz alta.

## Juegos incluidos (orden del menú)

🍎 Conteo · ➕ Suma · ➖ Resta · 🐊 Más o menos (comparar, cocodrilo glotón) ·
🎈 Suma Globos · 🚀 Cohetes (resta con reloj) · 🐔 Granja (multiplicación) ·
🐰 Conejos (división) · 🛒 Tienda (precios/pago/vuelto) · 🔢 Patrones/Secuencias ·
⭐ Contar Objetos · 🃏 Memotest · 🎁 Premios.

## Convenciones — NO romper

- **Siempre proteger el DOM**: `if (gei('id')) gei('id').textContent = ...` —
  nunca acceso directo sin chequeo.
- **Después de cada cambio, correr `npm run verificar`** (TypeScript + build +
  pruebas). Tiene que terminar sin errores. Si se agrega un juego o una regla
  nueva, agregar su prueba en `tests/app.spec.mjs`.
- **Editar siempre en `src/`**, nunca en `dist/`.
- **Almacenamiento**: solo a través de `18-progreso.js` (siempre con
  `try/catch`). No guardar nada fuera de ese archivo.
- **Resultados únicos**: cuando dos opciones puedan dar el mismo resultado
  (ej. memotest 3+5 y 4+4 dan 8), garantizar que los pares elegidos sean únicos.
- **Colores y fuente consistentes** con el resto (variables CSS `--green`,
  `--amber`, `--coral`, `--blue`, etc.).

## Comandos

```bash
npm install          # una sola vez (TypeScript y Playwright, solo para desarrollar)
npm run dev          # desarrollar: http://localhost:5173 (archivos separados)
npm run build        # arma dist/index.html (un solo archivo) + app instalable
npm run preview      # build y servir dist/ en http://localhost:4173
npm run check        # TypeScript revisa el JS (errores de tipeo, funciones que no existen)
npm test             # build + pruebas automáticas en Edge
npm run verificar    # check + test: correr antes de publicar
node scripts/iconos.mjs   # regenerar los íconos de public/
```

Las pruebas usan Microsoft Edge instalado (`channel: 'msedge'`), no hace falta
descargar navegadores. Si una falla, el detalle queda en `playwright-report/`.

### Deploy (Vercel)

`vercel.json` le indica a Vercel que corra `npm run build` y publique `dist/`.
Cada build cambia la versión del service worker, así la app instalada se
actualiza sola la próxima vez que se abre con internet.

```bash
git push            # Vercel redeploya solo si el repo está conectado
# o, sin pasar por GitHub:
vercel --prod
```

## Tono al pedir cambios

Cuando se agrega o mejora un juego, recordar siempre:

- Es para una nena con TDL y posible dislexia.
- Más visual y más simple es siempre mejor.
- Festejo generoso al acertar, nunca castigo al equivocarse.
- Antes de construir, preguntar lo justo (edad objetivo, tipo de mecánica) para
  acertar al primer intento — sin sobrecargar de preguntas.

/* ==========================================================================
   hero.js — canvas road-grid background + badge parallax tilt

   The backdrop is a perspective plane rushing toward a vanishing point: static
   converging rails, horizontal rungs that accelerate downward, and a drift of
   headlight specks. It reads as motion down a road without a single stock
   photo. Theme-aware, visibility-gated, and reduced to one still frame when
   the visitor asks for less motion.
   ========================================================================== */

const RUNGS = 22;
const SPECKS = 46;
const RAILS = 15;

function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const get = (n, f) => (cs.getPropertyValue(n) || f).trim();
  return {
    brand: get('--brand', '#f2a22b'),
    hot: get('--brand-hot', '#ff7a18'),
    dim: get('--fg-3', '#6a6760'),
    light: document.documentElement.dataset.theme === 'light'
  };
}

/** #rrggbb -> "r,g,b" so we can build rgba() at arbitrary alpha. */
function rgb(hex) {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '242,162,43';
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export function initHero() {
  const canvas = document.getElementById('heroCanvas');
  const hero = document.getElementById('hero');
  if (!canvas || !hero) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let W = 0, H = 0, dpr = 1;
  let pal = readPalette();
  let brandRGB = rgb(pal.brand);
  let hotRGB = rgb(pal.hot);
  let dimRGB = rgb(pal.dim);

  let t = 0;                 // travel phase
  let visible = true;
  let raf = 0;

  // pointer / scroll influence, eased toward their targets every frame
  let px = 0, pxTarget = 0;
  let py = 0, pyTarget = 0;
  let sink = 0;                // extra vertical offset contributed by scroll

  const specks = Array.from({ length: SPECKS }, () => ({
    x: Math.random(),
    z: Math.random(),
    s: 0.4 + Math.random() * 1.5,
    o: 0.15 + Math.random() * 0.5
  }));

  function resize() {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    px += (pxTarget - px) * 0.055;
    py += (pyTarget - py) * 0.055;

    const vx = W * 0.5 + px * W * 0.09;
    const vy = H * (0.47 + py * 0.06 + sink * 0.09);
    const floor = H * 1.02;
    const depth = floor - vy;
    if (depth <= 0) return;

    // ---- converging rails -------------------------------------------------
    ctx.lineWidth = 1;
    for (let i = 0; i <= RAILS; i++) {
      const k = i / RAILS;
      // spread rails wide so the plane runs past both edges
      const xEnd = vx + (k - 0.5) * W * 3.4;
      const fade = 1 - Math.abs(k - 0.5) * 1.35;
      ctx.strokeStyle = `rgba(${dimRGB},${Math.max(0, fade) * 0.19})`;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(xEnd, floor);
      ctx.stroke();
    }

    // ---- rushing rungs ----------------------------------------------------
    for (let i = 0; i < RUNGS; i++) {
      const z = ((i / RUNGS) + t) % 1;
      const p = z * z;                    // bunch the rungs up near the horizon
      const y = vy + p * depth;
      const half = (W * 1.7) * p + W * 0.02;
      const a = Math.min(p * 1.5, 1) * 0.34;

      ctx.strokeStyle = i % 4 === 0
        ? `rgba(${brandRGB},${a * 1.25})`
        : `rgba(${dimRGB},${a * 0.75})`;
      ctx.lineWidth = 0.6 + p * 1.9;
      ctx.beginPath();
      ctx.moveTo(vx - half, y);
      ctx.lineTo(vx + half, y);
      ctx.stroke();
    }

    // ---- horizon glow -----------------------------------------------------
    const glow = ctx.createRadialGradient(vx, vy, 0, vx, vy, W * 0.42);
    glow.addColorStop(0, `rgba(${hotRGB},${pal.light ? 0.16 : 0.24})`);
    glow.addColorStop(0.45, `rgba(${brandRGB},${pal.light ? 0.05 : 0.08})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // horizon hairline
    ctx.strokeStyle = `rgba(${brandRGB},${pal.light ? 0.3 : 0.42})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vx - W * 0.46, vy);
    ctx.lineTo(vx + W * 0.46, vy);
    ctx.stroke();

    // ---- headlight specks -------------------------------------------------
    for (const s of specks) {
      const z = (s.z + t * 0.55) % 1;
      const p = z * z;
      const y = vy - 30 + p * depth * 0.98;
      const x = vx + (s.x - 0.5) * W * (0.25 + p * 2.6);
      const r = s.s * (0.35 + p * 2.4);
      ctx.fillStyle = `rgba(${brandRGB},${s.o * p * 0.9})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    t = (t + 0.0016) % 1;
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (raf || reduced.matches) return;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  // ---- wiring -------------------------------------------------------------
  const ro = new ResizeObserver(() => { resize(); draw(); });
  ro.observe(hero);

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start(); else stop();
  }, { threshold: 0 });
  io.observe(hero);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (visible) start();
  });

  document.addEventListener('rg:theme', () => {
    pal = readPalette();
    brandRGB = rgb(pal.brand);
    hotRGB = rgb(pal.hot);
    dimRGB = rgb(pal.dim);
    draw();
  });

  addEventListener('pointermove', (e) => {
    pxTarget = (e.clientX / innerWidth) * 2 - 1;
    pyTarget = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  addEventListener('scroll', () => {
    // drop the vanishing point as the hero scrolls away, independently of the
    // pointer influence above
    sink = Math.min(scrollY / innerHeight, 1);
  }, { passive: true });

  reduced.addEventListener('change', () => {
    stop();
    if (!reduced.matches) start(); else draw();
  });

  resize();
  draw();
  start();

  initBadgeTilt();
  initFilm();
}

/* --------------------------------------------------------- badge tilt --- */

function initBadgeTilt() {
  const badge = document.getElementById('heroBadge');
  if (!badge) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let rx = 0, ry = 0, tx = 0, ty = 0, drift = 0, raf = 0;

  addEventListener('pointermove', (e) => {
    tx = (e.clientY / innerHeight - 0.5) * -16;
    ty = (e.clientX / innerWidth - 0.5) * 16;
  }, { passive: true });

  function frame() {
    rx += (tx - rx) * 0.06;
    ry += (ty - ry) * 0.06;
    drift += 0.006;
    const float = Math.sin(drift) * 8;
    badge.style.transform =
      `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(${float.toFixed(2)}px)`;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf) raf = requestAnimationFrame(frame);
  });
}

/* ------------------------------------------------------------- hero film --- */
/**
 * Decides whether the ride footage is worth its bytes, and plays it if so.
 * Markup deliberately carries no `autoplay` and preload="none", so nothing is
 * fetched until this runs. When we bail out, the <video> still paints its
 * poster frame — a 66 KB still with the same grade — so the hero keeps its
 * atmosphere for a fraction of the data.
 */
function initFilm() {
  const film = document.querySelector('.hero__film');
  const video = document.getElementById('heroVideo');
  const hero = document.getElementById('hero');
  if (!film || !video || !hero) return;

  const conn = navigator.connection || {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = conn.saveData === true;
  const slow = /(^|-)2g$/.test(conn.effectiveType || '');
  const small = matchMedia('(max-width: 46rem)').matches;

  // Poster-only: still graded, still atmospheric, ~1/15th of the bytes.
  if (reduced || saveData || slow || small) {
    film.classList.add('is-on');
    return;
  }

  let playing = false;
  const play = () => {
    // Autoplay can still be refused (battery saver, iOS low power); the poster
    // simply stays, which is a perfectly good outcome.
    video.play().then(() => { playing = true; }).catch(() => {});
  };

  video.addEventListener('loadeddata', () => film.classList.add('is-on'), { once: true });

  video.preload = 'auto';
  video.load();
  play();

  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) play();
    else if (playing) video.pause();
  }, { threshold: 0 });
  io.observe(hero);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (hero.getBoundingClientRect().bottom > 0) play();
  });
}

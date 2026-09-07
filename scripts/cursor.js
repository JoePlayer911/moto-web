/* ==========================================================================
   cursor.js — custom pointer: a dot that leads, a ring that trails, and a
   label pill that drops out from under the cursor on interactive targets.

   Desktop / fine-pointer only, and never under reduced motion — the native
   cursor is only hidden once this module has actually taken over, so touch,
   no-JS and reduced-motion visitors keep the system pointer.
   ========================================================================== */

const LERP_DOT = 0.9;    // the dot is effectively the pointer: near-instant
const LERP_PILL = 0.34;  // the label trails just enough to feel physical
const LERP_RING = 0.16;  // the ring lags furthest
const MAGNET_RADIUS = 90;
const MAGNET_PULL = 0.34;

export function initCursor() {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduced) return;

  const el = document.getElementById('cursor');
  if (!el) return;

  const dot = el.querySelector('.cursor__dot');
  const ring = el.querySelector('.cursor__ring');
  const pill = el.querySelector('.cursor__pill');
  const label = el.querySelector('.cursor__label');
  if (!dot || !ring || !pill || !label) return;

  let mx = innerWidth / 2, my = innerHeight / 2;
  let dx = mx, dy = my;
  let px = mx, py = my;
  let rx = mx, ry = my;
  let live = false;

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX;
    my = e.clientY;
    if (!live) {
      live = true;
      el.classList.add('is-live');
      // Take the system cursor away only once a real mouse has actually
      // moved. On a hybrid device (touchscreen laptop, tablet + trackpad)
      // `pointer: fine` can match while the visitor is using touch — hiding
      // their cursor before seeing one would strand them without a pointer.
      document.documentElement.classList.add('has-cursor');
    }
  }, { passive: true });

  // Switched back to touch on a hybrid device — give the system cursor back.
  addEventListener('touchstart', () => {
    live = false;
    el.classList.remove('is-live');
    document.documentElement.classList.remove('has-cursor');
  }, { passive: true });

  document.addEventListener('pointerleave', () => { live = false; el.classList.remove('is-live'); });
  document.addEventListener('pointerenter', () => { live = true; el.classList.add('is-live'); });

  // Keep the pointer hidden while a native UI surface has focus instead.
  addEventListener('blur', () => el.classList.remove('is-live'));

  /* ---- hover targets --------------------------------------------------- */
  const HOVERABLE = 'a, button, [data-cursor], input, label, .post';

  function enter(target) {
    const labelled = target.closest('[data-cursor]');
    const text = labelled?.dataset.cursor || '';
    if (text) label.textContent = text;
    el.classList.add('is-hover');
    el.classList.toggle('has-label', Boolean(text));
  }

  function leave() {
    el.classList.remove('is-hover', 'has-label');
  }

  document.addEventListener('pointerover', (e) => {
    const hit = e.target.closest?.(HOVERABLE);
    if (hit) enter(hit);
  });

  document.addEventListener('pointerout', (e) => {
    if (e.target.closest?.(HOVERABLE) && !e.relatedTarget?.closest?.(HOVERABLE)) leave();
  });

  /* ---- magnetic elements ----------------------------------------------- */
  const magnets = [...document.querySelectorAll('[data-magnetic]')];

  function magnetise() {
    for (const m of magnets) {
      const r = m.getBoundingClientRect();
      if (r.width === 0) continue;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(mx - cx, my - cy);
      const reach = Math.max(r.width, r.height) / 2 + MAGNET_RADIUS;

      if (dist < reach) {
        const pull = (1 - dist / reach) * MAGNET_PULL;
        m.style.transform = `translate(${(mx - cx) * pull}px, ${(my - cy) * pull}px)`;
      } else if (m.style.transform) {
        m.style.transform = '';
      }
    }
  }

  /* ---- loop ------------------------------------------------------------ */
  function frame() {
    dx += (mx - dx) * LERP_DOT;
    dy += (my - dy) * LERP_DOT;
    px += (mx - px) * LERP_PILL;
    py += (my - py) * LERP_PILL;
    rx += (mx - rx) * LERP_RING;
    ry += (my - ry) * LERP_RING;

    // The -50% centring lives in CSS so it can compose with the pill's own
    // drop-out transform without the two fighting over one property.
    dot.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rx.toFixed(2)}px, ${ry.toFixed(2)}px) translate(-50%, -50%)`;
    pill.style.transform = `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px)`;

    magnetise();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

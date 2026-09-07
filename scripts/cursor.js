/* ==========================================================================
   cursor.js — trailing ring cursor with contextual labels + magnetic targets
   Desktop / fine-pointer only. Never runs for touch or reduced-motion users,
   so the native cursor is left completely alone where it matters.
   ========================================================================== */

const LERP_DOT = 0.9;
const LERP_RING = 0.16;
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
  const label = el.querySelector('.cursor__label');

  let mx = innerWidth / 2, my = innerHeight / 2;
  let dx = mx, dy = my, rx = mx, ry = my;
  let live = false;

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX;
    my = e.clientY;
    if (!live) { live = true; el.classList.add('is-live'); }
  }, { passive: true });

  document.addEventListener('pointerleave', () => { live = false; el.classList.remove('is-live'); });
  document.addEventListener('pointerenter', () => { live = true; el.classList.add('is-live'); });

  // --- hover targets -------------------------------------------------------
  const HOVERABLE = 'a, button, [data-cursor], input, label, .post';

  document.addEventListener('pointerover', (e) => {
    const hit = e.target.closest?.(HOVERABLE);
    if (!hit) return;
    const text = hit.closest('[data-cursor]')?.dataset.cursor || '';
    label.textContent = text;
    el.classList.add('is-hover');
    el.classList.toggle('has-label', Boolean(text));
  });

  document.addEventListener('pointerout', (e) => {
    if (e.target.closest?.(HOVERABLE) && !e.relatedTarget?.closest?.(HOVERABLE)) {
      el.classList.remove('is-hover', 'has-label');
    }
  });

  // --- magnetic elements ---------------------------------------------------
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

  // --- loop ----------------------------------------------------------------
  function frame() {
    dx += (mx - dx) * LERP_DOT;
    dy += (my - dy) * LERP_DOT;
    rx += (mx - rx) * LERP_RING;
    ry += (my - ry) * LERP_RING;

    dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;

    magnetise();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

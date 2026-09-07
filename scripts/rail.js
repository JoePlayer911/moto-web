/* ==========================================================================
   rail.js — scroll-reactive marquee + pinned horizontal process rail
   ========================================================================== */

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- ticker --- */
/**
 * Seamless marquee whose speed and direction follow the page scroll: it idles
 * one way, accelerates when you scroll down, and reverses when you scroll up.
 */
export function initTicker() {
  const row = document.querySelector('[data-ticker]');
  if (!row || reduced()) return;

  const set = row.firstElementChild;
  if (!set) return;

  let setW = 0;
  let offset = 0;
  let velocity = 0;
  let lastY = scrollY;
  let raf = 0;
  let running = false;

  function build() {
    // Rebuild from a single pristine set, then clone until it covers 2 screens.
    [...row.children].slice(1).forEach((n) => n.remove());
    setW = set.getBoundingClientRect().width;
    if (setW < 1) return;
    const copies = Math.ceil((innerWidth * 2) / setW) + 1;
    for (let i = 0; i < copies; i++) row.append(set.cloneNode(true));
  }

  addEventListener('scroll', () => {
    velocity += (scrollY - lastY) * 0.06;
    lastY = scrollY;
  }, { passive: true });

  function frame() {
    velocity *= 0.92;                       // decay back to the idle drift
    offset -= 0.55 + velocity;
    if (setW > 0) {
      // keep offset inside one set width so the loop never shows a seam
      if (offset <= -setW) offset += setW;
      if (offset > 0) offset -= setW;
    }
    row.style.transform = `translate3d(${offset.toFixed(2)}px,0,0)`;
    raf = requestAnimationFrame(frame);
  }

  function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
  io.observe(row.parentElement);

  addEventListener('resize', build, { passive: true });
  document.addEventListener('rg:lang', () => requestAnimationFrame(build));

  // Fonts change the measured width — rebuild once they land.
  build();
  if (document.fonts?.ready) document.fonts.ready.then(build);
}

/* ------------------------------------------------------------------ rail --- */
/**
 * Pins the process section and converts vertical scroll into horizontal
 * travel. Below the desktop breakpoint (or under reduced motion) it degrades
 * to an ordinary snap-scrolling carousel, which is nicer on a phone anyway.
 */
export function initRail() {
  const rail = document.getElementById('rail');
  const track = document.getElementById('railTrack');
  const bar = document.getElementById('railBar');
  if (!rail || !track) return;

  const viewport = rail.querySelector('.rail__viewport');
  let distance = 0;
  let railTop = 0;
  let pinned = false;
  let ticking = false;

  function canPin() {
    return innerWidth >= 992 && !reduced();
  }

  function measure() {
    if (!canPin()) {
      pinned = false;
      rail.classList.remove('is-pinned');
      rail.style.removeProperty('height');
      track.style.transform = '';
      if (bar) bar.style.inlineSize = '';
      return;
    }

    // Measure with any previous transform cleared, or scrollWidth lies.
    track.style.transform = '';
    distance = Math.max(0, track.scrollWidth - viewport.clientWidth);

    if (distance < 40) {
      pinned = false;
      rail.classList.remove('is-pinned');
      rail.style.removeProperty('height');
      return;
    }

    pinned = true;
    rail.classList.add('is-pinned');
    rail.style.height = `${distance + innerHeight}px`;

    // Document-absolute top. offsetTop would be measured against .section,
    // which is position:relative, and the rail would finish scrolling long
    // before it reached the viewport.
    railTop = rail.getBoundingClientRect().top + scrollY;

    update();
  }

  function update() {
    if (!pinned) return;
    const p = Math.min(Math.max((scrollY - railTop) / distance, 0), 1);
    track.style.transform = `translate3d(${(-p * distance).toFixed(2)}px,0,0)`;
    if (bar) bar.style.inlineSize = `${(12 + p * 88).toFixed(2)}%`;
  }

  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });

  addEventListener('resize', measure, { passive: true });
  document.addEventListener('rg:lang', () => requestAnimationFrame(measure));
  if (document.fonts?.ready) document.fonts.ready.then(measure);

  measure();
}

/* ==========================================================================
   reveal.js — per-character headline reveals, scroll-in transitions, and
               odometer counters.

   Each initialiser prepares the DOM immediately (so nothing flashes in
   un-animated and then hides itself) but waits on a `gate` promise — the
   preloader — before it starts observing. That way the first reveal happens
   when the visitor can actually see it, not behind the curtain.
   ========================================================================== */

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** One shared observer for every [data-reveal] element, including later ones. */
let revealIO = null;

function revealObserver() {
  revealIO ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  return revealIO;
}

/**
 * Stagger a group of siblings and hand them to the reveal observer.
 * Exported so modules that inject markup later (the Instagram feed) can join.
 */
export function registerReveal(els) {
  const list = [...els];
  if (!list.length) return;

  if (reduced()) {
    list.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const seen = new Map();
  list.forEach((el) => {
    const p = el.parentElement;
    const n = seen.get(p) ?? 0;
    seen.set(p, n + 1);
    el.style.setProperty('--delay', `${Math.min(n, 8) * 70}ms`);
  });

  const io = revealObserver();
  list.forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------- split text --- */

/* CJK ranges break freely between glyphs; Latin words must not. */
const CJK = /[⺀-鿿豈-﫿︰-﹏＀-｠]/;

/**
 * Tokenise into pieces that are each safe to make an inline-block:
 * every CJK glyph stands alone, every run of Latin stays glued together,
 * and spaces are returned as-is so lines can still wrap between words.
 */
function tokenise(text) {
  const out = [];
  let buf = '';

  const flush = () => { if (buf) { out.push(buf); buf = ''; } };

  for (const ch of text) {
    if (ch === ' ') { flush(); out.push(' '); }
    else if (CJK.test(ch)) { flush(); out.push(ch); }
    else buf += ch;
  }
  flush();
  return out;
}

/**
 * Rebuild a heading as masked per-character spans, grouped into unbreakable
 * words. Without the word grouping each glyph becomes its own inline-block
 * and the browser happily wraps in the middle of a word. Idempotent.
 */
function split(host) {
  // data-split="whole" opts out of character splitting: the line animates in
  // one piece, which keeps gradient text (background-clip) renderable — a
  // per-character split puts each glyph in its own layer and breaks the clip.
  if (host.dataset.split === 'whole') return;

  const target = host.querySelector('[data-i18n]') || host;
  const text = target.textContent;
  if (!text.trim()) return;

  const frag = document.createDocumentFragment();
  let i = 0;

  for (const token of tokenise(text)) {
    if (token === ' ') {
      frag.append(document.createTextNode(' '));
      continue;
    }

    const word = document.createElement('span');
    word.className = 'word';

    for (const ch of token) {
      const mask = document.createElement('span');
      mask.className = 'char';
      mask.style.setProperty('--i', String(i++));
      const inner = document.createElement('b');
      inner.textContent = ch;
      mask.append(inner);
      word.append(mask);
    }

    frag.append(word);
  }

  target.replaceChildren(frag);
}

export function initSplit(gate = Promise.resolve()) {
  const hosts = [...document.querySelectorAll('[data-split]')];
  if (!hosts.length) return;

  if (reduced()) {
    hosts.forEach((h) => h.classList.add('is-in'));
    return;
  }

  // Split now so the characters are already masked while the loader is up.
  hosts.forEach(split);

  // A language swap rewrites textContent, destroying the char spans — rebuild
  // them and keep anything already on screen visible.
  document.addEventListener('rg:lang', () => {
    hosts.forEach((h) => {
      const wasIn = h.classList.contains('is-in');
      split(h);
      if (wasIn) h.classList.add('is-in');
    });
  });

  gate.then(() => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

    hosts.forEach((h) => io.observe(h));
  });
}

/* ------------------------------------------------------------- reveals --- */

export function initReveal(gate = Promise.resolve()) {
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!items.length) return;
  gate.then(() => registerReveal(items));
}

/* ------------------------------------------------------------ counters --- */

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function runCount(el) {
  const target = Number(el.dataset.count || 0);
  const suffix = el.dataset.suffix || '';
  const raw = 'raw' in el.dataset;
  const fmt = (n) => (raw ? String(n) : n.toLocaleString('en-US'));

  if (reduced()) {
    el.textContent = fmt(target) + suffix;
    return;
  }

  const dur = 1500;
  const t0 = performance.now();

  function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = fmt(Math.round(target * easeOut(p))) + (p === 1 ? suffix : '');
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function initCounters(gate = Promise.resolve()) {
  const nums = [...document.querySelectorAll('[data-count]')];
  if (!nums.length) return;

  // The markup ships the real figures so they are correct with JavaScript
  // disabled; now that we know we can animate, reset to zero first.
  if (!reduced()) nums.forEach((n) => { n.textContent = '0'; });

  gate.then(() => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        runCount(e.target);
        io.unobserve(e.target);
      }
    }, { threshold: 0.6 });

    nums.forEach((n) => io.observe(n));
  });
}

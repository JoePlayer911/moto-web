/* ==========================================================================
   main.js — boot sequence and the small page-level behaviours:
   preloader, sticky/auto-hiding nav, scroll progress, scroll-spy, mobile
   menu, language toggle, copy-to-clipboard, contact dock, back-to-top.
   ========================================================================== */

import { apply as applyI18n, toggleLang, t } from './i18n.js';
import { initTheme } from './theme.js';
import { initCursor } from './cursor.js';
import { initSplit, initReveal, initCounters } from './reveal.js';
import { initHero } from './hero.js';
import { initTicker, initRail } from './rail.js';
import { initQuote } from './quote.js';
import { initFeed } from './instagram.js';

/* --------------------------------------------------------------- loader --- */
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return Promise.resolve();

  const num = document.getElementById('loaderNum');
  const arc = loader.querySelector('.loader__arc');
  const CIRC = 339.3;

  const MIN_MS = 450;      // don't flash a curtain that was never readable
  const FINISH_MS = 300;   // time to run the last stretch out to 100
  const CAP_MS = 2600;     // hard ceiling, however slow the network is

  let settledAt = 0;
  let progressAtSettle = 0;

  // Real signals: fonts decoded and the window fully loaded — or the cap,
  // whichever lands first. (race, not all: the cap is a ceiling, and waiting
  // *for* it would floor every visit at 2.6s.)
  Promise.race([
    Promise.allSettled([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })))
    ]),
    new Promise((r) => setTimeout(r, CAP_MS))
  ]).then(() => { settledAt = performance.now(); });

  return new Promise((resolve) => {
    const t0 = performance.now();

    // Progress is a function of elapsed time, never of frame count: a
    // throttled tab or a 30fps device would otherwise sit under the curtain
    // for several seconds waiting for enough frames to tick by.
    function tick(now) {
      const elapsed = now - t0;
      let progress;

      if (settledAt) {
        if (!progressAtSettle) progressAtSettle = 90 * (1 - Math.exp(-(settledAt - t0) / 500));
        const k = Math.min((now - settledAt) / FINISH_MS, 1);
        progress = progressAtSettle + (100 - progressAtSettle) * k;
      } else {
        progress = 90 * (1 - Math.exp(-elapsed / 500));   // asymptotic creep
      }

      if (num) num.textContent = String(Math.round(progress));
      if (arc) arc.style.strokeDashoffset = String(CIRC * (1 - progress / 100));

      if (progress >= 99.5 && elapsed >= MIN_MS) {
        loader.classList.add('is-done');
        setTimeout(() => loader.remove(), 700);
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ------------------------------------------------------------------ nav --- */
function initNav() {
  const nav = document.getElementById('nav');
  const progress = document.getElementById('navProgress');
  if (!nav) return;

  let lastY = scrollY;
  let ticking = false;

  function update() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;

    nav.classList.toggle('is-stuck', y > 24);

    // Hide going down, reveal going up — but never while the menu is open.
    const menuOpen = document.getElementById('menu')?.classList.contains('is-open');
    if (!menuOpen) {
      nav.classList.toggle('is-hidden', y > innerHeight * 0.8 && y > lastY + 6);
    }

    if (progress && max > 0) progress.style.inlineSize = `${Math.min((y / max) * 100, 100)}%`;

    lastY = y;
    ticking = false;
  }

  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  update();
}

/* ------------------------------------------------------------ scroll-spy --- */
function initSpy() {
  const links = [...document.querySelectorAll('.nav__links a[href^="#"]')];
  if (!links.length) return;

  const map = new Map();
  links.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec) map.set(sec, a);
  });

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((l) => l.classList.remove('is-current'));
      map.get(e.target)?.classList.add('is-current');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });

  map.forEach((_, sec) => io.observe(sec));
}

/* ----------------------------------------------------------------- menu --- */
function initMenu() {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  if (!burger || !menu) return;

  const links = [...menu.querySelectorAll('a')];
  links.forEach((a, i) => a.style.setProperty('--i', String(i)));

  function setOpen(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 720);
    }
  }

  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      burger.focus();
    }
  });

  // Leaving the mobile breakpoint should never strand an open overlay.
  matchMedia('(min-width: 62rem)').addEventListener('change', (e) => {
    if (e.matches && menu.classList.contains('is-open')) setOpen(false);
  });
}

/* ------------------------------------------------------------ copy links --- */
function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const slot = btn.querySelector('[data-i18n]') || btn;
    const key = slot.dataset?.i18n;

    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
        document.body.append(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
      }
      if (!ok) return;

      slot.textContent = t('br.copied');
      btn.classList.add('is-done');
      setTimeout(() => {
        slot.textContent = key ? t(key) : t('br.copy');
        btn.classList.remove('is-done');
      }, 1600);
    });
  });
}

/* ----------------------------------------------------------------- dock --- */
function initDock() {
  const dock = document.getElementById('dock');
  const contact = document.getElementById('contact');
  if (!dock || !contact) return;

  // The dock is redundant once the full contact block is on screen.
  const io = new IntersectionObserver(([e]) => {
    dock.classList.toggle('is-tucked', e.isIntersecting);
  }, { threshold: 0.28 });
  io.observe(contact);
}

/* ----------------------------------------------------------------- misc --- */
function initMisc() {
  const stamp = document.getElementById('yearStamp');
  if (stamp) stamp.textContent = String(new Date().getFullYear());

  document.getElementById('toTop')?.addEventListener('click', () => {
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    scrollTo({ top: 0, behavior });
  });

  document.getElementById('langToggle')?.addEventListener('click', toggleLang);
}

/* ----------------------------------------------------------------- boot --- */
function boot() {
  applyI18n();

  initTheme();
  initNav();
  initSpy();
  initMenu();
  initCopy();
  initDock();
  initMisc();
  initCursor();

  initHero();
  initTicker();
  initRail();
  initQuote();

  // The curtain gates every entrance animation: markup is prepared straight
  // away, but nothing plays until the visitor can actually see it.
  const curtain = initLoader();

  initSplit(curtain);
  initReveal(curtain);
  initCounters(curtain);

  initFeed(curtain);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

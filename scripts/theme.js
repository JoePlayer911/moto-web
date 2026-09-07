/* ==========================================================================
   theme.js — dark/light with a circular reveal sweep from the toggle button
   The pre-paint inline script in index.html has already resolved the initial
   theme; this module only handles switching and system-preference sync.
   ========================================================================== */

const root = document.documentElement;
const media = matchMedia('(prefers-color-scheme: light)');

export function theme() {
  return root.dataset.theme === 'light' ? 'light' : 'dark';
}

function paint(next) {
  root.dataset.theme = next;
  const btn = document.getElementById('themeToggle');
  if (btn) btn.setAttribute('aria-pressed', String(next === 'light'));
  document.dispatchEvent(new CustomEvent('rg:theme', { detail: { theme: next } }));
}

function persist(next) {
  try { localStorage.setItem('rg-theme', next); } catch (e) { /* private mode */ }
}

/**
 * Swap the theme. When the browser supports the View Transitions API — and the
 * visitor has not asked for reduced motion — the new theme irises out from the
 * button that was pressed. Everywhere else it is an instant, correct swap.
 */
export function toggleTheme(origin) {
  const next = theme() === 'dark' ? 'light' : 'dark';
  persist(next);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduced) {
    paint(next);
    return;
  }

  if (origin) {
    const r = origin.getBoundingClientRect();
    root.style.setProperty('--sweep-x', `${((r.left + r.width / 2) / innerWidth) * 100}%`);
    root.style.setProperty('--sweep-y', `${((r.top + r.height / 2) / innerHeight) * 100}%`);
  }

  root.classList.add('theme-sweep');
  const vt = document.startViewTransition(() => paint(next));
  vt.finished.finally(() => root.classList.remove('theme-sweep'));
}

export function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.setAttribute('aria-pressed', String(theme() === 'light'));
    btn.addEventListener('click', () => toggleTheme(btn));
  }

  // Follow the OS only while the visitor has not made an explicit choice.
  media.addEventListener('change', (e) => {
    let stored = null;
    try { stored = localStorage.getItem('rg-theme'); } catch (err) { /* ignore */ }
    if (stored !== 'light' && stored !== 'dark') paint(e.matches ? 'light' : 'dark');
  });
}

/* ==========================================================================
   instagram.js — renders the cached feed from data/instagram.json

   The site never calls Instagram at runtime: Instagram blocks unauthenticated
   browser requests and its CDN URLs are signed and expire. Instead we read a
   committed JSON snapshot (see tools/README-instagram.md for how it is
   produced). If the file is missing, empty or malformed, the section falls
   back to a designed panel rather than a broken grid.
   ========================================================================== */

import { t } from './i18n.js';
import { registerReveal } from './reveal.js';

const FEED_URL = 'data/instagram.json';
const MAX = 9;
const PROFILE = 'https://www.instagram.com/rays_garage2022';

const ICON_VIDEO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const ICON_ALBUM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h11a2 2 0 0 1 2 2v11h-2V5H8V3zM5 7h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/></svg>';

/** First meaningful line of a caption, trimmed for the overlay. */
function tidyCaption(raw = '') {
  const line = raw
    .split('\n')
    .map((s) => s.trim())
    .find((s) => s && !s.startsWith('#')) || raw.replace(/\n+/g, ' ').trim();
  return line.length > 130 ? `${line.slice(0, 130)}…` : line;
}

function dateLabel(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD, locale-stable
}

function buildPost(item, i) {
  const a = document.createElement('a');
  a.className = 'post';
  a.href = item.permalink || PROFILE;
  a.target = '_blank';
  a.rel = 'noopener';
  a.dataset.reveal = '';

  const caption = tidyCaption(item.caption);
  a.setAttribute('aria-label', caption || 'Instagram post');
  a.dataset.cursor = 'VIEW';

  const img = document.createElement('img');
  img.className = 'post__img';
  img.src = item.thumb || item.thumbnail_url || item.media_url || '';
  img.alt = caption || '';
  img.loading = i < 3 ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.width = 640;
  img.height = 640;
  // A dead thumbnail should not leave a torn tile behind.
  img.addEventListener('error', () => a.remove(), { once: true });

  const veil = document.createElement('div');
  veil.className = 'post__veil';

  const meta = document.createElement('div');
  meta.className = 'post__meta';
  const when = document.createElement('span');
  when.textContent = dateLabel(item.timestamp);
  const go = document.createElement('span');
  go.textContent = 'INSTAGRAM ↗';
  meta.append(when, go);

  const cap = document.createElement('p');
  cap.className = 'post__cap';
  cap.textContent = caption;

  veil.append(meta, cap);
  a.append(img, veil);

  const type = String(item.media_type || item.type || '').toUpperCase();
  if (type === 'VIDEO' || type === 'CAROUSEL_ALBUM') {
    const badge = document.createElement('span');
    badge.className = 'post__badge';
    badge.innerHTML = type === 'VIDEO' ? ICON_VIDEO : ICON_ALBUM;
    a.append(badge);
  }

  return a;
}

/** Subtle pointer-tracked tilt; skipped for touch and reduced motion. */
function attachTilt(grid) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  grid.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.post');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform =
      `perspective(760px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) translateZ(6px)`;
  });

  grid.addEventListener('pointerout', (e) => {
    const card = e.target.closest('.post');
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  });
}

function renderEmpty(grid) {
  const box = document.createElement('div');
  box.className = 'feed__empty';

  const logo = document.createElement('img');
  logo.src = 'assets/logo-256.png';
  logo.alt = '';
  logo.width = 74;
  logo.height = 74;

  const msg = document.createElement('p');
  msg.dataset.i18n = 'feed.empty';
  msg.textContent = t('feed.empty');

  const link = document.createElement('a');
  link.className = 'btn btn--ghost';
  link.href = PROFILE;
  link.target = '_blank';
  link.rel = 'noopener';
  link.dataset.i18n = 'feed.go';
  link.textContent = t('feed.go');

  box.append(logo, msg, link);
  grid.replaceChildren(box);
}

export async function initFeed(gate = Promise.resolve()) {
  const grid = document.getElementById('feedGrid');
  if (!grid) return;

  let data = null;
  try {
    const res = await fetch(FEED_URL, { cache: 'no-cache' });
    if (res.ok) data = await res.json();
  } catch (e) {
    // Offline, file:// origin, or no snapshot committed yet — handled below.
  }

  const items = Array.isArray(data?.items) ? data.items.filter((i) => i && (i.thumb || i.thumbnail_url || i.media_url)) : [];

  grid.setAttribute('aria-busy', 'false');

  if (!items.length) {
    renderEmpty(grid);
    return;
  }

  const frag = document.createDocumentFragment();
  items.slice(0, MAX).forEach((item, i) => frag.append(buildPost(item, i)));
  grid.replaceChildren(frag);
  attachTilt(grid);

  // Join the shared scroll-reveal system once the preloader is out of the way.
  gate.then(() => registerReveal(grid.querySelectorAll('.post')));

  // Reflect the real post count on the "see all" button when we have one.
  const total = Number(data?.profile?.posts);
  if (Number.isFinite(total) && total > 0) {
    const all = document.querySelector('.feed__all span');
    if (all) {
      const pretty = total.toLocaleString('en-US');
      const paint = () => {
        all.textContent = document.documentElement.dataset.lang === 'en'
          ? `See all ${pretty} posts`
          : `看全部 ${pretty} 篇紀錄`;
      };
      all.removeAttribute('data-i18n');
      paint();
      document.addEventListener('rg:lang', paint);
    }
  }
}

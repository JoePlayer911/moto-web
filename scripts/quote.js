/* ==========================================================================
   quote.js — four-question buy-back estimator

   The numbers below are a transparent, tunable model, not a price feed. Tune
   MODEL to match what the shop actually pays; every figure the visitor sees is
   derived from it, and the UI labels the output as an estimate throughout.
   ========================================================================== */

import { t, lang } from './i18n.js';

const MODEL = {
  // notional new-bike reference used as the depreciation starting point (NT$)
  base: { light: 46000, scooter: 85000, big: 118000, sport: 132000 },
  // value retained per year
  decay: 0.875,
  // dealer buy-back share of open-market value
  buyback: 0.78,
  // km a bike is assumed to cover per year; deviation moves the price
  kmPerYear: 6000,
  kmSensitivity: 200000,
  kmClamp: [0.82, 1.1],
  cond: { a: 1.06, b: 1.0, c: 0.84, d: 0.94 },
  spread: 0.13,
  floor: 3000,
  round: 500
};

const STEPS = 4;            // question count; index 4 is the result panel
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
const roundTo = (n, m) => Math.round(n / m) * m;

function estimate({ type, year, km, cond }) {
  const age = Math.max(0, new Date().getFullYear() - year);
  const market = (MODEL.base[type] ?? MODEL.base.scooter) * Math.pow(MODEL.decay, age);

  const expectedKm = age * MODEL.kmPerYear;
  const kmFactor = clamp(
    1 - (km - expectedKm) / MODEL.kmSensitivity,
    MODEL.kmClamp[0],
    MODEL.kmClamp[1]
  );

  const mid = market * MODEL.buyback * kmFactor * (MODEL.cond[cond] ?? 1);

  return {
    lo: Math.max(MODEL.floor, roundTo(mid * (1 - MODEL.spread), MODEL.round)),
    hi: Math.max(MODEL.floor + MODEL.round, roundTo(mid * (1 + MODEL.spread), MODEL.round))
  };
}

/* --------------------------------------------------------------- copying --- */

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through to the legacy path */ }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

/* ------------------------------------------------------------------ init --- */

export function initQuote() {
  const form = document.getElementById('quote');
  if (!form) return;

  const stage = document.getElementById('quoteStage');
  const panels = [...stage.querySelectorAll('[data-step]')];
  const dots = document.getElementById('quoteDots');
  const stepLabel = document.getElementById('quoteStepLabel');
  const prev = document.getElementById('quotePrev');
  const next = document.getElementById('quoteNext');
  const nav = form.querySelector('.quote__nav');
  const reset = document.getElementById('quoteReset');

  const yearIn = document.getElementById('year');
  const kmIn = document.getElementById('km');
  const yearOut = document.getElementById('yearOut');
  const kmOut = document.getElementById('kmOut');

  const loEl = document.getElementById('lo');
  const hiEl = document.getElementById('hi');
  const sumEl = document.getElementById('resultSum');
  const copiedEl = document.getElementById('copied');
  const toLine = document.getElementById('toLine');

  let step = 0;

  // The year slider should never offer a future model year.
  yearIn.max = String(new Date().getFullYear());
  if (Number(yearIn.value) > Number(yearIn.max)) yearIn.value = yearIn.max;

  for (let i = 0; i < STEPS; i++) dots.append(document.createElement('i'));

  /* ---- readouts -------------------------------------------------------- */
  const fmtKm = () => `${Number(kmIn.value).toLocaleString('en-US')} km`;

  function paintSliders() {
    yearOut.textContent = yearIn.value;
    kmOut.textContent = fmtKm();
  }

  yearIn.addEventListener('input', paintSliders);
  kmIn.addEventListener('input', paintSliders);
  paintSliders();

  /* ---- navigation ------------------------------------------------------ */
  function show(n) {
    step = clamp(n, 0, STEPS);
    panels.forEach((p) => { p.hidden = Number(p.dataset.step) !== step; });

    [...dots.children].forEach((d, i) => d.classList.toggle('is-on', i <= Math.min(step, STEPS - 1)));

    prev.disabled = step === 0;
    // On the result panel there is nothing left to step through, so the whole
    // nav strip goes rather than leaving an empty bordered bar behind.
    nav.hidden = step === STEPS;
    next.textContent = step === STEPS - 1 ? t('val.see') : t('val.next');
    stepLabel.textContent = step === STEPS
      ? t('val.done')
      : `${String(step + 1).padStart(2, '0')} / ${String(STEPS).padStart(2, '0')}`;

    if (step === STEPS) render();
  }

  function readAnswers() {
    const data = new FormData(form);
    return {
      type: String(data.get('type') || 'scooter'),
      year: Number(data.get('year') || yearIn.value),
      km: Number(data.get('km') || kmIn.value),
      cond: String(data.get('cond') || 'a')
    };
  }

  /* ---- result ---------------------------------------------------------- */
  function countTo(el, target) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = target.toLocaleString('en-US');
      return;
    }
    const t0 = performance.now();
    const dur = 750;
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function summaryLine() {
    const a = readAnswers();
    const typeKey = { scooter: 'val.q1a', big: 'val.q1b', light: 'val.q1c', sport: 'val.q1d' }[a.type];
    const condKey = { a: 'val.q4a', b: 'val.q4b', c: 'val.q4c', d: 'val.q4d' }[a.cond];
    return t('val.sum', {
      type: t(typeKey),
      year: a.year,
      km: a.km.toLocaleString('en-US'),
      cond: t(condKey)
    });
  }

  function render() {
    const a = readAnswers();
    const { lo, hi } = estimate(a);
    countTo(loEl, lo);
    countTo(hiEl, hi);
    sumEl.textContent = summaryLine();
    copiedEl.textContent = '';
  }

  /* ---- LINE handoff ---------------------------------------------------- */
  // Deep links cannot pre-fill a LINE message, so we put a tidy summary on the
  // clipboard and let the visitor paste it into the chat that opens.
  toLine.addEventListener('click', async () => {
    const { lo, hi } = estimate(readAnswers());
    const header = lang() === 'zh' ? '想估價，車況如下：' : 'Valuation request:';
    const rangeLabel = lang() === 'zh' ? '網站估算' : 'Site estimate';
    const text =
      `${header}\n${summaryLine()}\n${rangeLabel}: NT$${lo.toLocaleString('en-US')} – NT$${hi.toLocaleString('en-US')}`;

    const ok = await copyText(text);
    copiedEl.textContent = t(ok ? 'val.copied' : 'val.copyfail');
  });

  /* ---- wiring ---------------------------------------------------------- */
  next.addEventListener('click', () => show(step + 1));
  prev.addEventListener('click', () => show(step - 1));
  reset.addEventListener('click', () => {
    form.reset();
    paintSliders();
    copiedEl.textContent = '';
    show(0);
  });

  form.addEventListener('submit', (e) => e.preventDefault());

  // Picking a radio advances automatically — fewer taps to the answer.
  form.addEventListener('change', (e) => {
    if (e.target.type === 'radio' && step < STEPS - 1) {
      setTimeout(() => show(step + 1), 190);
    }
  });

  document.addEventListener('rg:lang', () => {
    paintSliders();
    show(step);
  });

  show(0);
}

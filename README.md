# 輪便所二手機車 · Ray's Garage

A hand-built landing page for a Taichung scooter shop. No framework, no build
step, no dependencies — plain HTML, CSS and ES modules. Drop the folder on any
static host and it runs.

```
open index.html          # works straight off the filesystem, except the IG feed
npm run serve            # http://localhost:4173  (use this — fetch() needs http)
```

---

## What's in here

```
index.html              the whole page
styles/
  base.css              design tokens, both themes, typography, reset
  layout.css            shell, 12-col grid, nav, hero, sections, footer
  components.css        buttons, cursor, loader, ticker, rail, quote, feed
  motion.css            reveal states, keyframes, reduced-motion fallbacks
scripts/
  main.js               boot + nav, menu, loader, scroll-spy, copy, dock
  i18n.js               zh-TW / en dictionary and DOM binder
  theme.js              dark/light with a View-Transitions iris sweep
  cursor.js             trailing ring cursor + label pill
  reveal.js             split-text, scroll reveals, odometer counters
  hero.js               canvas road grid, badge parallax, hero film
  rail.js               scroll-reactive marquee + pinned horizontal rail
  quote.js              four-question valuation estimator
  instagram.js          renders the cached feed
data/instagram.json     the feed snapshot (see below)
tools/                  asset generation, the IG grabber, dev server
assets/                 logo, icons, OG card — all derived from the source logo
```

---

## Instagram feed

**Read this before touching the feed section.**

Instagram cannot be scraped from a server any more. Unauthenticated requests to
the public endpoints return `429`, the profile HTML is an empty JavaScript shell
with no post data in it, and the Basic Display API was retired. The Graph API
still works but has to be installed on the account that owns the profile — which
you said you don't control.

So the site never calls Instagram at runtime. It reads a committed snapshot at
`data/instagram.json`, which means the feed works on GitHub Pages, loads fast,
and never shows broken tiles. Refreshing it is a manual 30-second job.

### Refreshing the feed (the way that works)

1. Open <https://www.instagram.com/rays_garage2022/> in your browser, logged in
   to any Instagram account.
2. Open DevTools (<kbd>F12</kbd>) → **Console**. Chrome asks you to type
   `allow pasting` the first time.
3. Paste the whole of [`tools/ig-grab.js`](tools/ig-grab.js) and press Enter.
4. It downloads `instagram.json`. Move it to `data/instagram.json`, commit, push.

It runs in your own logged-in browser, so Instagram sees an ordinary page view
and doesn't block it. It grabs the 9 most recent posts with their captions, and
re-encodes each thumbnail **into the JSON itself** — Instagram's CDN links are
signed and expire within days, so embedding the image is what keeps the feed
alive long-term.

Optional tidy-up, to lift the embedded images out into real files:

```bash
npm run ig:split         # writes assets/ig/*.jpg and shrinks the JSON
```

### If you ever do get API access

Generate a long-lived Instagram Graph API token, then:

```bash
IG_ACCESS_TOKEN=xxxxx npm run ig
```

That path is fully automated and can be put on a schedule.

### Until the feed is populated

The section renders a designed empty state — logo, one line of copy, and a
button to the profile. It never looks broken, so you can ship before you get
around to step 1.

---

## Editing content

| What | Where |
|---|---|
| Any visible text, both languages | `scripts/i18n.js` — one dictionary, `zh` and `en` side by side |
| Phone, LINE, Instagram links | search `0989837953`, `lin.ee/xeStmEc`, `rays_garage2022` in `index.html` |
| Branch addresses & map links | the `.places` list in `index.html` |
| Valuation pricing | the `MODEL` object at the top of `scripts/quote.js` |
| Brand colours, type scale, spacing | the `:root` blocks in `styles/base.css` |
| Logo / icons / social card | `python tools/make-assets.py` regenerates everything from the source logo |
| Hero footage | replace `assets/hero-ride.mp4` + `assets/hero-ride.jpg`; grading lives in `.hero__video` in `styles/layout.css` |

The dictionary is the single source of truth for copy. The Chinese strings in
`index.html` are only the no-JavaScript fallback — if you change a line, change
it in `scripts/i18n.js` too, or the page will flip back to the old wording as
soon as it loads.

### Valuation numbers

`scripts/quote.js` computes a range from a small, readable model: a notional
new-bike price per category, yearly depreciation, a mileage adjustment against
an expected 6,000 km/year, and a condition multiplier. Every figure a visitor
sees comes out of `MODEL` — tune those constants to match what the shop actually
pays. The UI labels the output as an estimate throughout and never presents it
as an offer.

---

## Deploying to GitHub Pages

`.github/workflows/pages.yml` is already set up. Push to `main`, then in the
repo go to **Settings → Pages → Source → GitHub Actions**. There is nothing to
build; the workflow uploads the folder as-is.

Every path in the site is relative, so it works from a project subpath
(`user.github.io/repo/`) as well as a custom domain.

Two things to update once you know the final URL:

- `index.html` — add `<link rel="canonical" href="https://your-domain/">`
- `index.html` — the `og:image` is a relative path; some scrapers want an
  absolute URL, so change it to `https://your-domain/assets/og.jpg`

---

## Accessibility & fundamentals

- `prefers-reduced-motion` is honoured everywhere: the canvas freezes on one
  frame, the marquee and pinned rail stop, the rail becomes a normal snap
  carousel, and every reveal resolves instantly instead of being skipped.
- Every animation is gated on `html.js`, so with JavaScript disabled the page is
  plain, complete and readable rather than a screen of invisible text.
- Semantic landmarks, a skip link, visible focus rings, `aria-pressed` /
  `aria-expanded` on the toggles, Escape to close the menu, and a custom cursor
  that only exists for fine pointers.
- Theme and language resolve before first paint, so there is no flash.
- `AutoDealer` JSON-LD including all three branches, Open Graph, a web manifest,
  and maskable icons.


---

## Hero footage

`assets/hero-ride.mp4` is an 8-second silent loop (1024x576, ~980 KB) trimmed
and re-encoded from a [Mixkit](https://mixkit.co/free-stock-video/) clip. The
Mixkit Free License permits use in commercial projects without attribution;
the credit here is courtesy, not obligation.

It is colour-graded **in CSS**, not baked into the file — `filter` plus
`mix-blend-mode` on `.hero__video` pushes it into the brand's amber-on-black
range and swaps to a `multiply` treatment on the light theme. Swapping in
different footage therefore needs no re-grading.

**A note on sourcing.** YouTube clips titled "no copyright" are almost always
uploaded under the *Standard YouTube License*, which grants no right to
download or re-host them — the phrase is the uploader's claim in a title, not
a licence, and re-upload channels frequently do not hold the rights they are
waiving. Embedding the official player is permitted; extracting the file is
not. Prefer a source whose licence is explicit: Mixkit, Coverr, Pexels and
Pixabay all publish theirs.

The markup carries no `autoplay` and `preload="none"`, so nothing downloads
until `scripts/hero.js` decides it is worth the bytes. It bails out — leaving
the poster frame, which carries the same grade — on phones, on Save-Data, on
2G, and under `prefers-reduced-motion`. Playback also pauses when the hero
scrolls out of view or the tab is hidden.

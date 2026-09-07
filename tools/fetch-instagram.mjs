#!/usr/bin/env node
/* ==========================================================================
   fetch-instagram.mjs — maintain data/instagram.json

   Three modes, in order of preference:

   1. Graph API      (needs IG_ACCESS_TOKEN; the sanctioned, automatable path)
        IG_ACCESS_TOKEN=xxx node tools/fetch-instagram.mjs
   2. --split        (post-process a file produced by tools/ig-grab.js:
                      lifts embedded data URIs out into assets/ig/*.jpg so the
                      JSON stays small and the images cache properly)
        node tools/fetch-instagram.mjs --split
   3. best effort    (no token: tries Instagram's public endpoint, which is
                      normally rate-limited to death — falls back with advice)
        node tools/fetch-instagram.mjs

   Whatever the source, thumbnails always end up stored locally. Instagram's
   CDN URLs are signed and expire, so linking them directly would leave the
   site with broken tiles within days.
   ========================================================================== */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = path.join(ROOT, 'data', 'instagram.json');
const IMG_DIR = path.join(ROOT, 'assets', 'ig');
const USERNAME = process.env.IG_USERNAME || 'rays_garage2022';
const COUNT = Number(process.env.IG_COUNT || 9);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const log = (...a) => console.log('[ig]', ...a);
const die = (msg) => { console.error('[ig] ' + msg); process.exitCode = 1; };

/* ------------------------------------------------------------ utilities --- */

async function saveImage(bytes, seed, ext = 'jpg') {
  await mkdir(IMG_DIR, { recursive: true });
  const name = `${createHash('sha1').update(seed).digest('hex').slice(0, 12)}.${ext}`;
  await writeFile(path.join(IMG_DIR, name), bytes);
  return `assets/ig/${name}`;
}

async function downloadImage(url, seed) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`image ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = (res.headers.get('content-type') || '').includes('png') ? 'png' : 'jpg';
  return saveImage(buf, seed, ext);
}

async function writeFeed(payload) {
  await mkdir(path.dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  log(`wrote ${path.relative(ROOT, OUT_JSON)} — ${payload.items.length} posts`);
}

/* ------------------------------------------------------- 1. Graph API ----- */

async function viaGraphApi(token) {
  log('using the Instagram Graph API');

  let userId = process.env.IG_USER_ID;
  if (!userId) {
    const me = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${token}`);
    if (!me.ok) throw new Error(`/me failed: ${me.status} ${await me.text()}`);
    const j = await me.json();
    userId = j.id;
    log(`resolved user ${j.username} (${userId})`);
  }

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `https://graph.instagram.com/${userId}/media?fields=${fields}&limit=${COUNT}&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`/media failed: ${res.status} ${await res.text()}`);

  const raw = (await res.json()).data ?? [];
  const items = [];

  for (const m of raw.slice(0, COUNT)) {
    const src = m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url;
    if (!src) continue;
    try {
      items.push({
        id: m.id,
        permalink: m.permalink,
        caption: m.caption ?? '',
        media_type: m.media_type,
        timestamp: m.timestamp,
        thumb: await downloadImage(src, m.id)
      });
      log(`  cached ${items.length}/${Math.min(COUNT, raw.length)}`);
    } catch (e) {
      console.warn(`[ig] skipped ${m.id}: ${e.message}`);
    }
  }

  await writeFeed({
    profile: { username: USERNAME },
    fetchedAt: new Date().toISOString(),
    source: 'graph-api',
    items
  });
}

/* ---------------------------------------------------------- 2. --split ---- */

async function splitDataUris() {
  let feed;
  try {
    feed = JSON.parse(await readFile(OUT_JSON, 'utf8'));
  } catch (e) {
    return die(`cannot read ${path.relative(ROOT, OUT_JSON)} — run tools/ig-grab.js first.`);
  }

  let moved = 0;
  for (const item of feed.items ?? []) {
    const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/i.exec(item.thumb ?? '');
    if (!m) continue;
    const ext = m[1].toLowerCase().startsWith('p') ? 'png' : 'jpg';
    item.thumb = await saveImage(Buffer.from(m[2], 'base64'), item.id ?? item.permalink, ext);
    moved++;
  }

  if (!moved) {
    log('nothing to split — every thumbnail is already a file.');
    return;
  }

  feed.source = `${feed.source ?? 'unknown'} +split`;
  await writeFeed(feed);
  log(`extracted ${moved} thumbnails into assets/ig/`);
}

/* ------------------------------------------------------ 3. best effort ---- */

async function viaPublicEndpoint() {
  log('no IG_ACCESS_TOKEN set — trying the public endpoint (usually blocked)');

  const res = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`,
    { headers: { 'User-Agent': UA, 'x-ig-app-id': '936619743392459' } }
  );

  if (!res.ok) {
    console.error(`[ig] blocked by Instagram (HTTP ${res.status}).`);
    console.error('[ig] This is expected from a server or CI runner.');
    console.error('[ig] Use the browser grabber instead:');
    console.error('[ig]   1. open https://www.instagram.com/' + USERNAME + '/ while logged in');
    console.error('[ig]   2. paste tools/ig-grab.js into the DevTools console');
    console.error('[ig]   3. save the download as data/instagram.json');
    console.error('[ig]   4. node tools/fetch-instagram.mjs --split   (optional tidy-up)');
    process.exitCode = 1;
    return;
  }

  const user = (await res.json())?.data?.user;
  const edges = user?.edge_owner_to_timeline_media?.edges ?? [];
  const TYPE = { GraphImage: 'IMAGE', GraphVideo: 'VIDEO', GraphSidecar: 'CAROUSEL_ALBUM' };
  const items = [];

  for (const { node } of edges.slice(0, COUNT)) {
    try {
      items.push({
        id: node.id,
        permalink: `https://www.instagram.com/p/${node.shortcode}/`,
        caption: node.edge_media_to_caption?.edges?.[0]?.node?.text ?? '',
        media_type: TYPE[node.__typename] ?? 'IMAGE',
        timestamp: new Date(node.taken_at_timestamp * 1000).toISOString(),
        thumb: await downloadImage(node.thumbnail_src || node.display_url, node.id)
      });
    } catch (e) {
      console.warn(`[ig] skipped ${node.shortcode}: ${e.message}`);
    }
  }

  await writeFeed({
    profile: {
      username: user.username,
      posts: user.edge_owner_to_timeline_media?.count ?? null,
      followers: user.edge_followed_by?.count ?? null
    },
    fetchedAt: new Date().toISOString(),
    source: 'public-endpoint',
    items
  });
}

/* -------------------------------------------------------------- dispatch --- */

const token = process.env.IG_ACCESS_TOKEN;

try {
  if (process.argv.includes('--split')) await splitDataUris();
  else if (token) await viaGraphApi(token);
  else await viaPublicEndpoint();
} catch (e) {
  die(e.message);
}

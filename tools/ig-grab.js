/* ==========================================================================
   ig-grab.js — pull the latest posts straight out of your own browser

   WHY THIS EXISTS
   Instagram no longer lets a server read a public profile: unauthenticated
   requests get 429'd, the profile HTML is an empty JS shell, and the Basic
   Display API is gone. The Graph API works but needs to be installed on the
   account that owns the profile.

   This script sidesteps all of that. It runs in YOUR logged-in browser, so
   Instagram treats it as a normal page view. It grabs the newest posts,
   re-encodes each thumbnail into the JSON itself (Instagram's CDN links are
   signed and expire within days — embedding the image is what makes the
   result work forever on GitHub Pages), and downloads a ready-to-commit file.

   HOW TO USE
   1. Open https://www.instagram.com/rays_garage2022/ while logged in.
   2. Open DevTools (F12) -> Console. Chrome may ask you to type
      "allow pasting" the first time.
   3. Paste this entire file, press Enter, wait a few seconds.
   4. It downloads instagram.json. Move it to  data/instagram.json  and commit.

   Re-run it whenever you want the site's feed refreshed.
   ========================================================================== */

(async () => {
  const USERNAME = 'rays_garage2022';
  const COUNT = 9;        // tiles shown on the site
  const SIZE = 640;       // thumbnail edge, px
  const QUALITY = 0.74;   // JPEG quality
  const APP_ID = '936619743392459';

  const log = (...a) => console.log('%c[ig-grab]', 'color:#f2a22b;font-weight:700', ...a);

  if (!location.hostname.endsWith('instagram.com')) {
    console.error('[ig-grab] Run this on instagram.com while logged in.');
    return;
  }

  // ---- 1. profile + recent media -----------------------------------------
  log('fetching profile…');
  const res = await fetch(
    `/api/v1/users/web_profile_info/?username=${USERNAME}`,
    { headers: { 'x-ig-app-id': APP_ID }, credentials: 'include' }
  );

  if (!res.ok) {
    console.error(`[ig-grab] profile request failed (${res.status}). Are you logged in?`);
    return;
  }

  const user = (await res.json())?.data?.user;
  if (!user) {
    console.error('[ig-grab] unexpected response shape — Instagram may have changed its API.');
    return;
  }

  const edges = user.edge_owner_to_timeline_media?.edges ?? [];
  log(`found ${edges.length} recent posts, ${user.edge_followed_by?.count} followers`);

  // ---- 2. thumbnail -> self-contained data URI ---------------------------
  async function toDataURI(url) {
    // Fetching as a blob (rather than painting an <img>) keeps the canvas
    // untainted, so toDataURL/convertToBlob is allowed.
    const r = await fetch(url, { credentials: 'omit' });
    if (!r.ok) throw new Error(`thumb ${r.status}`);
    const bmp = await createImageBitmap(await r.blob());

    const side = Math.min(bmp.width, bmp.height);          // square centre-crop
    const sx = (bmp.width - side) / 2;
    const sy = (bmp.height - side) / 2;

    const canvas = new OffscreenCanvas(SIZE, SIZE);
    canvas.getContext('2d').drawImage(bmp, sx, sy, side, side, 0, 0, SIZE, SIZE);
    bmp.close();

    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: QUALITY });
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  const TYPE = { GraphImage: 'IMAGE', GraphVideo: 'VIDEO', GraphSidecar: 'CAROUSEL_ALBUM' };
  const items = [];

  for (const { node } of edges.slice(0, COUNT)) {
    const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text ?? '';
    const src = node.thumbnail_src || node.display_url;

    let thumb = null;
    try {
      thumb = await toDataURI(src);
    } catch (e) {
      console.warn(`[ig-grab] thumbnail failed for ${node.shortcode}:`, e.message);
      continue;
    }

    items.push({
      id: node.id,
      permalink: `https://www.instagram.com/p/${node.shortcode}/`,
      caption,
      media_type: TYPE[node.__typename] ?? (node.is_video ? 'VIDEO' : 'IMAGE'),
      timestamp: new Date(node.taken_at_timestamp * 1000).toISOString(),
      thumb
    });

    log(`  ${items.length}/${Math.min(COUNT, edges.length)} — ${node.shortcode}`);
  }

  if (!items.length) {
    console.error('[ig-grab] no thumbnails could be captured.');
    return;
  }

  // ---- 3. hand back a committable file -----------------------------------
  const payload = {
    profile: {
      username: user.username,
      fullName: user.full_name,
      posts: user.edge_owner_to_timeline_media?.count ?? null,
      followers: user.edge_followed_by?.count ?? null
    },
    fetchedAt: new Date().toISOString(),
    source: 'ig-grab (browser)',
    items
  };

  const json = JSON.stringify(payload, null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'instagram.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  log(`done — ${items.length} posts, ${(json.length / 1024).toFixed(0)} KB.`);
  log('Move the downloaded instagram.json into  data/instagram.json  and commit.');
})();

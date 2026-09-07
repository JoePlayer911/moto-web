/* ==========================================================================
   i18n.js — two-locale dictionary + DOM binder
   Markup opts in with  data-i18n="key"  (textContent) or
   data-i18n-attr="attr:key,attr:key"    (attributes).
   ========================================================================== */

export const DICT = {
  zh: {
    'a11y.skip': '跳到主要內容',
    'loader.label': '正在啟動',

    'brand.name': '輪便所',

    'nav.about': '關於',
    'nav.services': '服務',
    'nav.process': '流程',
    'nav.valuation': '估價',
    'nav.feed': '實況',
    'nav.branches': '門市',

    'cta.line': '加 LINE 估價',
    'cta.quote': '免費線上估價',

    'hero.eyebrow': '台中 · 北屯 / 太平 · 三間門市',
    'hero.l1': '買車',
    'hero.l2': '賣車',
    'hero.l3': '都在輪便所',
    'hero.lede': '買賣機車大小事就交給我們。持續紀錄與客戶從 0 到 1 的每一段過程。',

    'stats.posts': '紀錄貼文',
    'stats.followers': '追蹤人數',
    'stats.branches': '門市據點',
    'stats.since': '開業年份',

    'tick.1': '現金收購',
    'tick.2': '二手機車',
    'tick.3': '新車販售',
    'tick.4': '免費估價',
    'tick.5': '誠實交車',

    'sec.about': '關於我們 / ABOUT',
    'sec.services': '我們提供 / SERVICES',
    'sec.process': '交易流程 / PROCESS',
    'sec.valuation': '線上估價 / VALUATION',
    'sec.feed': '門市實況 / INSTAGRAM',
    'sec.branches': '門市據點 / BRANCHES',

    'about.title': '從 0 到 1，我們都在。',
    'about.p1': '輪便所不只是把車賣掉。從你第一次傳訊息問價，到牽車上路的那一天，每一步我們都陪你走完、也拍下來。',
    'about.p2': '四千多篇貼文，是四千多次真實的交車紀錄。沒有修過的車況，沒有講不清楚的價格。',
    'about.s1': '車況公開透明，缺點先講在前面',
    'about.s2': '現金收購，當天估價、當天結清',
    'about.s3': '過戶手續代辦，不用你跑監理站',
    'about.s4': '台中三間門市，就近看車不用等',

    'svc.1.t': '現金收購',
    'svc.1.d': '不管騎多久、有沒有摔過，先拍照傳給我們。價格當場開，現金當場付。',
    'svc.2.t': '二手機車',
    'svc.2.d': '每台進場都檢查過。里程、事故、換過什麼零件，全部先跟你講清楚。',
    'svc.3.t': '新車販售',
    'svc.3.d': '各大廠牌新車都能配。舊車折抵、分期方案，一次幫你算清楚。',
    'svc.4.t': '線上估價',
    'svc.4.d': '不用出門。填四個問題，先看到大概行情，再決定要不要來店裡。',

    'step.1.t': '傳訊息',
    'step.1.d': 'LINE 或 IG 私訊，拍幾張車況照片給我們，或直接說你想找什麼車。',
    'step.2.t': '開價格',
    'step.2.d': '當天回覆估價區間。收購價、車價、分期方案都講清楚，沒有隱藏費用。',
    'step.3.t': '來看車',
    'step.3.d': '到門市實際發動、試騎、看車況。覺得不對，不買也沒關係。',
    'step.4.t': '交車',
    'step.4.d': '過戶、保險、牌照都能代辦。整備完成拍照存檔，然後你就可以騎走了。',
    'step.5.t': '開始上路',
    'step.5.d': '交車那天我們會拍一張。這就是那四千多篇貼文的由來。',

    'val.title': '先估個大概。',
    'val.note': '這是依車種、年份、里程與車況推算的參考區間，不是最終報價。實際價格要看到車才算得準——但這能讓你心裡先有個底。',
    'val.trust1': '免費',
    'val.trust2': '不用留電話',
    'val.trust3': '不推銷',
    'val.q1': '你的車是哪一種？',
    'val.q1a': '速可達 125',
    'val.q1b': '150 以上 / 大羊',
    'val.q1c': '輕型 50 / 100',
    'val.q1d': '檔車 / 仿賽',
    'val.q2': '出廠年份？',
    'val.q3': '大概跑了多少公里？',
    'val.q4': '車況如何？',
    'val.q4a': '很好，正常保養、沒事故',
    'val.q4b': '普通，有些小刮傷',
    'val.q4c': '待修，有問題要處理',
    'val.q4d': '不太確定',
    'val.result': '參考收購區間',
    'val.done': '完成',
    'val.send': '複製並傳到 LINE',
    'val.again': '重新估一次',
    'val.prev': '上一步',
    'val.next': '下一步',
    'val.see': '看估價結果',
    'val.copied': '已複製車況摘要，貼到 LINE 就好',
    'val.copyfail': '複製失敗，請手動記下上面的內容',
    'val.sum': '{type} · {year} 年 · {km} 公里 · {cond}',

    'feed.all': '看全部 4,760 篇紀錄',
    'feed.empty': '最新貼文還沒同步進來。點下面直接到 Instagram 看我們的交車紀錄。',
    'feed.go': '前往 Instagram',
    'feed.video': '影片',
    'feed.album': '多張',

    'br.1.t': '軍福店',
    'br.2.t': '東山店',
    'br.3.t': '太平店',
    'br.tag': '本店',
    'br.map': '導航',
    'br.copy': '複製地址',
    'br.copied': '已複製',

    'contact.big': '想買車？想賣車？',
    'contact.sub': '傳個訊息就好，我們回得很快。',
    'ch.line': '官方 LINE',
    'ch.ig': 'Instagram',
    'ch.tel': '直接來電',

    'dock.line': '加 LINE',
    'dock.ig': 'Instagram',
    'foot.top': '回到頂端 ↑'
  },

  en: {
    'a11y.skip': 'Skip to main content',
    'loader.label': 'Warming up',

    'brand.name': "RAY'S",

    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.process': 'Process',
    'nav.valuation': 'Valuation',
    'nav.feed': 'Feed',
    'nav.branches': 'Branches',

    'cta.line': 'Chat on LINE',
    'cta.quote': 'Free online valuation',

    'hero.eyebrow': 'Taichung · Beitun / Taiping · 3 shops',
    'hero.l1': 'BUY IT.',
    'hero.l2': 'SELL IT.',
    'hero.l3': 'RIDE IT.',
    'hero.lede': 'Buying or selling a scooter in Taichung — we handle all of it, and we document every step from zero to one.',

    'stats.posts': 'Posts logged',
    'stats.followers': 'Followers',
    'stats.branches': 'Shops',
    'stats.since': 'Est.',

    'tick.1': 'CASH BUY-BACK',
    'tick.2': 'USED SCOOTERS',
    'tick.3': 'NEW SCOOTERS',
    'tick.4': 'FREE VALUATION',
    'tick.5': 'HONEST HANDOVER',

    'sec.about': 'ABOUT US',
    'sec.services': 'WHAT WE DO',
    'sec.process': 'HOW IT WORKS',
    'sec.valuation': 'ONLINE VALUATION',
    'sec.feed': 'FROM THE SHOP / INSTAGRAM',
    'sec.branches': 'FIND US',

    'about.title': 'Zero to one, start to finish.',
    'about.p1': "We don't just hand over keys. From your first message asking about price to the day you ride away, we walk it with you — and we photograph it.",
    'about.p2': 'Over four thousand posts. That is four thousand real handovers, with unedited condition shots and prices we can explain out loud.',
    'about.s1': 'Condition shown in full — faults told to you first',
    'about.s2': 'Cash buy-back, valued and settled the same day',
    'about.s3': 'Transfer paperwork handled — no queueing at the DMV',
    'about.s4': 'Three Taichung shops, so there is one near you',

    'svc.1.t': 'Cash buy-back',
    'svc.1.d': "However long you've ridden it, however it looks — send photos first. We quote on the spot and pay cash on the spot.",
    'svc.2.t': 'Used scooters',
    'svc.2.d': 'Every bike is inspected before it goes on the floor. Mileage, accident history, replaced parts — you hear all of it up front.',
    'svc.3.t': 'New scooters',
    'svc.3.d': 'We can order any major brand. Trade-in value and instalment plans worked out for you in one sitting.',
    'svc.4.t': 'Online valuation',
    'svc.4.d': "No need to come in. Answer four questions, see the ballpark, then decide whether it's worth the trip.",

    'step.1.t': 'Message us',
    'step.1.d': 'LINE or Instagram DM. Send a few photos of your bike, or just tell us what you are looking for.',
    'step.2.t': 'Get a price',
    'step.2.d': 'A range comes back the same day. Buy-back price, sale price, instalments — stated plainly, no hidden fees.',
    'step.3.t': 'Come see it',
    'step.3.d': 'Start it, ride it, read the condition report. If it does not feel right, walking away is completely fine.',
    'step.4.t': 'Handover',
    'step.4.d': 'Transfer, insurance and plates can all be handled here. We prep it, photograph it, and then it is yours.',
    'step.5.t': 'Ride out',
    'step.5.d': 'We take one photo on handover day. That is where all four thousand posts came from.',

    'val.title': 'Get a ballpark first.',
    'val.note': 'This range is estimated from type, year, mileage and condition — it is not a final offer. A real price needs eyes on the bike, but this tells you roughly where you stand.',
    'val.trust1': 'Free',
    'val.trust2': 'No phone number needed',
    'val.trust3': 'No sales pitch',
    'val.q1': 'What kind of bike is it?',
    'val.q1a': 'Scooter 125',
    'val.q1b': '150cc and up / maxi',
    'val.q1c': 'Light 50 / 100',
    'val.q1d': 'Manual / sport',
    'val.q2': 'What year is it?',
    'val.q3': 'Roughly how many kilometres?',
    'val.q4': 'What condition is it in?',
    'val.q4a': 'Great — serviced, no accidents',
    'val.q4b': 'Average — a few scratches',
    'val.q4c': 'Needs work — something to fix',
    'val.q4d': 'Not sure',
    'val.result': 'Estimated buy-back range',
    'val.done': 'Done',
    'val.send': 'Copy & open LINE',
    'val.again': 'Start over',
    'val.prev': 'Back',
    'val.next': 'Next',
    'val.see': 'See estimate',
    'val.copied': 'Summary copied — just paste it into LINE',
    'val.copyfail': 'Copy failed — please note the details above manually',
    'val.sum': '{type} · {year} · {km} km · {cond}',

    'feed.all': 'See all 4,760 posts',
    'feed.empty': 'The latest posts have not synced yet. Head straight to Instagram to see our handovers.',
    'feed.go': 'Open Instagram',
    'feed.video': 'Video',
    'feed.album': 'Album',

    'br.1.t': 'Junfu shop',
    'br.2.t': 'Dongshan shop',
    'br.3.t': 'Taiping shop',
    'br.tag': 'Main',
    'br.map': 'Directions',
    'br.copy': 'Copy address',
    'br.copied': 'Copied',

    'contact.big': 'Buying, or selling?',
    'contact.sub': 'Just send a message — we reply fast.',
    'ch.line': 'Official LINE',
    'ch.ig': 'Instagram',
    'ch.tel': 'Call us',

    'dock.line': 'LINE',
    'dock.ig': 'Instagram',
    'foot.top': 'Back to top ↑'
  }
};

const root = document.documentElement;

/** Current locale code: 'zh' | 'en' */
export function lang() {
  return root.dataset.lang === 'en' ? 'en' : 'zh';
}

/**
 * Translate a key, with optional {placeholder} substitution.
 * Falls back to the zh string, then to the key itself.
 */
export function t(key, vars) {
  const l = lang();
  let s = DICT[l][key] ?? DICT.zh[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

/** Paint every [data-i18n] / [data-i18n-attr] node in `scope`. */
export function apply(scope = document) {
  scope.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = t(el.dataset.i18n);
    if (el.textContent !== v) el.textContent = v;
  });

  scope.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}

/** Switch locale, persist it, and notify listeners. */
export function setLang(next) {
  const l = next === 'en' ? 'en' : 'zh';
  root.dataset.lang = l;
  root.lang = l === 'zh' ? 'zh-Hant-TW' : 'en';
  try { localStorage.setItem('rg-lang', l); } catch (e) { /* private mode */ }
  apply();
  document.dispatchEvent(new CustomEvent('rg:lang', { detail: { lang: l } }));
}

export function toggleLang() {
  setLang(lang() === 'zh' ? 'en' : 'zh');
}

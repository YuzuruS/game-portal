/* かわいいSVGアート集（絵文字の代替）。すべて手描きのインラインSVG。 */
window.ART = (() => {
  let seq = 0;
  const nid = (p) => `${p}${++seq}`;

  // ---------------- 共通パーツ ----------------
  const face = (cx, cy, color = '#5b4636', blush = '#ff9db0') => `
    <ellipse cx="${cx - 6}" cy="${cy}" rx="1.9" ry="2.5" fill="${color}"/>
    <ellipse cx="${cx + 6}" cy="${cy}" rx="1.9" ry="2.5" fill="${color}"/>
    <path d="M${cx - 3.6} ${cy + 4.4}q3.6 3.6 7.2 0" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="${cx - 10.5}" cy="${cy + 3.4}" rx="3" ry="2" fill="${blush}" opacity=".5"/>
    <ellipse cx="${cx + 10.5}" cy="${cy + 3.4}" rx="3" ry="2" fill="${blush}" opacity=".5"/>`;

  const gloss = (id) => `
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".9"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>`;

  // ---------------- 硬貨 ----------------
  const COINS = {
    1:   { light: '#ffffff', mid: '#e6ecf1', dark: '#b3bfc9', ink: '#78848f', hole: false, motif: 'sprout', scale: 0.88 },
    5:   { light: '#f9eeb6', mid: '#e3c76d', dark: '#b08f30', ink: '#6f5410', hole: true,  motif: 'rice',    scale: 0.94 },
    10:  { light: '#f3c49c', mid: '#d68f59', dark: '#a25f2c', ink: '#5f3617', hole: false, motif: 'leaf',    scale: 0.97 },
    50:  { light: '#ffffff', mid: '#dde4eb', dark: '#a9b5c0', ink: '#5d6975', hole: true,  motif: 'kiku',    scale: 0.97 },
    100: { light: '#ffffff', mid: '#d9e1e8', dark: '#a3afba', ink: '#556069', hole: false, motif: 'sakura',  scale: 1.0 },
    500: { light: '#fbf0bd', mid: '#e0c063', dark: '#a98a2c', ink: '#6a5010', hole: false, motif: 'kiri',    scale: 1.0 },
  };

  function motifPath(kind, ink) {
    const o = 'opacity=".5"';
    switch (kind) {
      case 'sprout':
        return `<g fill="${ink}" ${o}><path d="M32 12c-3.4.4-5.4 2.4-5 5.6 3.2.4 5.2-1.6 5-5.6z"/><path d="M32 12c3.4.4 5.4 2.4 5 5.6-3.2.4-5.2-1.6-5-5.6z"/><rect x="31.2" y="15" width="1.6" height="6" rx=".8"/></g>`;
      case 'rice':
        return `<g stroke="${ink}" stroke-width="1.3" stroke-linecap="round" ${o}><path d="M32 12v8"/><path d="M32 14.5l-3.4-2.2M32 14.5l3.4-2.2M32 18l-3.4-2.2M32 18l3.4-2.2"/></g>`;
      case 'leaf':
        return `<g fill="${ink}" ${o}><path d="M32 11c5 2.6 6.4 7 3.4 10.6-4.6-.6-6.4-4.2-3.4-10.6z"/><path d="M32 11c-5 2.6-6.4 7-3.4 10.6 4.6-.6 6.4-4.2 3.4-10.6z"/></g>`;
      case 'kiku':
        return `<g fill="${ink}" ${o}>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="32" cy="12.5" rx="1.5" ry="3.4" transform="rotate(${a} 32 16)"/>`).join('')}<circle cx="32" cy="16" r="1.7"/></g>`;
      case 'sakura':
        return `<g fill="${ink}" ${o}>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="32" cy="12.4" rx="2.1" ry="3.4" transform="rotate(${a} 32 16)"/>`).join('')}<circle cx="32" cy="16" r="1.5" fill="${ink}"/></g>`;
      default: // kiri
        return `<g fill="${ink}" ${o}><ellipse cx="27" cy="15" rx="3" ry="4.6" transform="rotate(-22 27 15)"/><ellipse cx="37" cy="15" rx="3" ry="4.6" transform="rotate(22 37 15)"/><ellipse cx="32" cy="12.6" rx="3" ry="4.6"/></g>`;
    }
  }

  function coin(value) {
    const c = COINS[value];
    const g = nid('cg'), s = nid('cs'), m = nid('cm');
    const r = 30 * c.scale;
    const holeMask = c.hole
      ? `<mask id="${m}"><rect width="64" height="64" fill="#fff"/><circle cx="32" cy="32" r="${6.4 * c.scale}" fill="#000"/></mask>`
      : '';
    const numY = c.hole ? 46 : 37.5;
    const numSize = c.hole ? 14 : (String(value).length >= 3 ? 19 : 24);
    return `<svg class="coin-svg" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="${g}" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stop-color="${c.light}"/>
          <stop offset="52%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.dark}"/>
        </radialGradient>
        ${gloss(s)}
        ${holeMask}
      </defs>
      <g ${c.hole ? `mask="url(#${m})"` : ''}>
        <circle cx="32" cy="32" r="${r}" fill="url(#${g})"/>
        <circle cx="32" cy="32" r="${r - 0.9}" fill="none" stroke="${c.dark}" stroke-opacity=".5" stroke-width="2.4" stroke-dasharray="1.6 3.1"/>
        <circle cx="32" cy="32" r="${r - 3.4}" fill="none" stroke="${c.light}" stroke-opacity=".75" stroke-width="1.4"/>
        <circle cx="32" cy="32" r="${r - 5.2}" fill="none" stroke="${c.dark}" stroke-opacity=".28" stroke-width="1"/>
        ${motifPath(c.motif, c.ink)}
        <text x="32" y="${numY}" text-anchor="middle" dominant-baseline="central"
              font-family="Mochiy Pop One, sans-serif" font-size="${numSize}" fill="${c.ink}">${value}</text>
        <ellipse cx="22" cy="17" rx="12" ry="6.4" fill="url(#${s})" opacity=".85" transform="rotate(-26 22 17)"/>
      </g>
      ${c.hole ? `<circle cx="32" cy="32" r="${6.4 * c.scale + 0.7}" fill="none" stroke="${c.dark}" stroke-opacity=".45" stroke-width="1.2"/>` : ''}
    </svg>`;
  }

  // ---------------- 商品 ----------------
  const ITEMS = {
    apple(u) {
      return `<defs><radialGradient id="${u}a" cx="36%" cy="28%" r="75%"><stop offset="0" stop-color="#ff8d8d"/><stop offset="60%" stop-color="#f2565b"/><stop offset="1" stop-color="#d2323f"/></radialGradient></defs>
        <path d="M32 20c-5-6-14-6-19 0-6 7-4 20 2 28 3 4 7 7 10 7 2 0 4-1 7-1s5 1 7 1c3 0 7-3 10-7 6-8 8-21 2-28-5-6-14-6-19 0z" fill="url(#${u}a)"/>
        <path d="M31 12c0 4 1 7 1 8" stroke="#8b5a2b" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M33 14c4-6 11-6 13-3 1 3-4 8-9 8-3 0-4-2-4-5z" fill="#63c96b"/>
        <ellipse cx="22" cy="28" rx="5" ry="8" fill="#fff" opacity=".28" transform="rotate(-22 22 28)"/>
        ${face(32, 36)}`;
    },
    banana(u) {
      return `<defs><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#f2b705"/></linearGradient></defs>
        <path d="M13 26c-2 14 8 26 23 26 10 0 17-5 20-12 1-3-2-5-4-3-5 5-12 7-19 5-8-2-13-9-13-17 0-3-4-3-7 1z" fill="url(#${u}b)"/>
        <path d="M13 26c3 1 5 3 6 6" stroke="#c9901c" stroke-width="2.4" stroke-linecap="round" fill="none"/>
        <path d="M54 39c1 2 1 4 0 6" stroke="#8b5a2b" stroke-width="3.4" stroke-linecap="round" fill="none"/>
        <path d="M22 44c8 6 19 6 26 0" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round"/>
        ${face(33, 37)}`;
    },
    onigiri(u) {
      return `<defs><linearGradient id="${u}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#eee3d0"/></linearGradient></defs>
        <path d="M32 9c3 0 5 2 7 5l14 28c3 6-1 12-7 12H18c-6 0-10-6-7-12l14-28c2-3 4-5 7-5z" fill="url(#${u}o)" stroke="#e0d2b8" stroke-width="1.2"/>
        <path d="M21 38h22c1 0 2 1 2 2v12c0 1-1 2-2 2H21c-1 0-2-1-2-2V40c0-1 1-2 2-2z" fill="#3c4a3f"/>
        <circle cx="26" cy="24" r="1.1" fill="#cbbb9c"/><circle cx="37" cy="27" r="1.1" fill="#cbbb9c"/>
        ${face(32, 30)}`;
    },
    candy(u) {
      return `<defs><radialGradient id="${u}c" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffd0e4"/><stop offset="1" stop-color="#ff70a6"/></radialGradient></defs>
        <path d="M12 22l9 8-9 8c-1 1-2 0-2-1V23c0-1 1-2 2-1z" fill="#ff9ec4"/>
        <path d="M52 22l-9 8 9 8c1 1 2 0 2-1V23c0-1-1-2-2-1z" fill="#ff9ec4"/>
        <circle cx="32" cy="32" r="15" fill="url(#${u}c)"/>
        <path d="M32 20a12 12 0 1 1-8.5 3.5" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>
        <path d="M32 26a6 6 0 1 1-4 1.7" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="26" cy="26" r="3" fill="#fff" opacity=".5"/>`;
    },
    juice(u) {
      return `<defs><linearGradient id="${u}j" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7fd4e8"/><stop offset=".55" stop-color="#4fb8d8"/><stop offset="1" stop-color="#3a9dc0"/></linearGradient></defs>
        <path d="M27 13l6 5 6-5" fill="none" stroke="#f2607d" stroke-width="3.6" stroke-linecap="round"/>
        <rect x="35" y="6" width="4.6" height="14" rx="2.3" fill="#f2607d" transform="rotate(16 37 13)"/>
        <rect x="16" y="18" width="32" height="38" rx="5" fill="url(#${u}j)"/>
        <path d="M16 23h32v4H16z" fill="#fff" opacity=".22"/>
        <circle cx="32" cy="38" r="9" fill="#fff" opacity=".92"/>
        <path d="M32 29a9 9 0 0 1 9 9h-9z" fill="#ffb03a"/><path d="M32 47a9 9 0 0 1-9-9h9z" fill="#ff8f3a"/>
        <circle cx="32" cy="38" r="9" fill="none" stroke="#e8933a" stroke-width="1.4"/>
        <rect x="20" y="22" width="3.4" height="9" rx="1.7" fill="#fff" opacity=".45"/>`;
    },
    note(u) {
      return `<rect x="14" y="10" width="36" height="44" rx="4" fill="#4f86d6"/>
        <rect x="19" y="10" width="31" height="44" rx="4" fill="#fffdf8"/>
        <g stroke="#cfe0f5" stroke-width="2" stroke-linecap="round">
          <path d="M25 24h19M25 31h19M25 38h19M25 45h12"/>
        </g>
        <rect x="26" y="14" width="17" height="6" rx="3" fill="#ffd166"/>
        <g fill="none" stroke="#b9c6d4" stroke-width="2.2" stroke-linecap="round">
          <path d="M16 16h6M16 25h6M16 34h6M16 43h6"/>
        </g>`;
    },
    pencil(u) {
      return `<g transform="rotate(38 32 32)">
        <rect x="26" y="10" width="12" height="30" fill="#ffc94d"/>
        <rect x="26" y="10" width="4" height="30" fill="#ffe08a"/>
        <rect x="34" y="10" width="4" height="30" fill="#e9a72c"/>
        <path d="M26 40h12l-6 12z" fill="#f6dcb6"/>
        <path d="M30 48l2 4 2-4z" fill="#4c4340"/>
        <rect x="26" y="5" width="12" height="6" fill="#bfc9d1"/>
        <rect x="26" y="7" width="12" height="1.6" fill="#94a1ab"/>
        <path d="M26 5V1c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v4z" fill="#ff8fa8"/>
      </g>`;
    },
    eraser(u) {
      return `<rect x="12" y="24" width="40" height="20" rx="4" fill="#fff8fa" stroke="#e8d8de" stroke-width="1.2"/>
        <rect x="12" y="24" width="40" height="7" rx="4" fill="#ffffff"/>
        <rect x="20" y="24" width="24" height="20" rx="2" fill="#5aa9e6"/>
        <g stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"><path d="M25 31h14M25 36h10"/></g>
        <rect x="20" y="24" width="24" height="20" rx="2" fill="none" stroke="#3d8bc9" stroke-width="1.2"/>`;
    },
    bread(u) {
      return `<defs><linearGradient id="${u}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c98a"/><stop offset="1" stop-color="#d99a54"/></linearGradient></defs>
        <path d="M14 30c0-10 8-16 18-16s18 6 18 16v14c0 4-3 6-6 6H20c-3 0-6-2-6-6z" fill="url(#${u}p)"/>
        <path d="M18 32c0-8 6-13 14-13s14 5 14 13" fill="none" stroke="#fff3df" stroke-width="3" stroke-linecap="round" opacity=".7"/>
        <rect x="18" y="38" width="28" height="12" rx="3" fill="#fff3df"/>
        ${face(32, 31)}`;
    },
    cake(u) {
      return `<path d="M14 34h36v14c0 3-2 5-5 5H19c-3 0-5-2-5-5z" fill="#f7d8a8"/>
        <rect x="14" y="30" width="36" height="7" rx="2" fill="#fff8ee"/>
        <path d="M14 30c0-6 8-9 18-9s18 3 18 9z" fill="#ffb3c8"/>
        <path d="M14 42h36" stroke="#e8bd85" stroke-width="2" opacity=".7"/>
        <g><path d="M32 12c4 2 6 5 5 8-1 3-6 4-9 2-3-2-3-7 4-10z" fill="#f2565b"/>
        <path d="M32 12c-1-3 1-4 3-4" stroke="#63c96b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <circle cx="30" cy="17" r=".9" fill="#fff" opacity=".85"/><circle cx="34" cy="19" r=".9" fill="#fff" opacity=".85"/></g>
        <g fill="#fff" opacity=".9"><circle cx="20" cy="27" r="2.6"/><circle cx="44" cy="27" r="2.6"/></g>`;
    },
    balloon(u) {
      return `<defs><radialGradient id="${u}l" cx="34%" cy="26%" r="76%"><stop offset="0" stop-color="#ffb3d1"/><stop offset="1" stop-color="#ef4f86"/></radialGradient></defs>
        <path d="M32 8c10 0 17 8 17 17 0 11-9 19-17 23-8-4-17-12-17-23 0-9 7-17 17-17z" fill="url(#${u}l)"/>
        <path d="M29 48h6l-3 5z" fill="#d43f72"/>
        <path d="M32 53c4 4-4 6 0 11" fill="none" stroke="#b6c2cc" stroke-width="1.8" stroke-linecap="round"/>
        <ellipse cx="24" cy="20" rx="4.5" ry="7" fill="#fff" opacity=".42" transform="rotate(-24 24 20)"/>`;
    },
    bear(u) {
      return `<g fill="#c9946a">
          <circle cx="16" cy="19" r="8"/><circle cx="48" cy="19" r="8"/>
        </g>
        <circle cx="16" cy="19" r="4.2" fill="#f0b9a0"/><circle cx="48" cy="19" r="4.2" fill="#f0b9a0"/>
        <path d="M32 44c12 0 18-5 18-14S43 12 32 12 14 21 14 30s6 14 18 14z" fill="#d9a479"/>
        <path d="M22 46c-4 2-6 5-6 8h32c0-3-2-6-6-8z" fill="#c9946a"/>
        <ellipse cx="32" cy="34" rx="9" ry="7" fill="#f4e0cd"/>
        <path d="M32 31c2 0 3 1 3 2.4S33 36 32 36s-3-1.2-3-2.6S30 31 32 31z" fill="#5b4636"/>
        <path d="M32 36v2.4M32 38.4q-2.6 2-4.4 0M32 38.4q2.6 2 4.4 0" fill="none" stroke="#5b4636" stroke-width="1.5" stroke-linecap="round"/>
        <ellipse cx="25" cy="27" rx="2" ry="2.6" fill="#5b4636"/><ellipse cx="39" cy="27" rx="2" ry="2.6" fill="#5b4636"/>
        <ellipse cx="20" cy="33" rx="3" ry="2" fill="#ff9db0" opacity=".55"/><ellipse cx="44" cy="33" rx="3" ry="2" fill="#ff9db0" opacity=".55"/>`;
    },
    ball(u) {
      return `<circle cx="32" cy="32" r="22" fill="#fffdf8"/>
        <path d="M32 10a22 22 0 0 1 19 11c-6 3-13 4-19 4z" fill="#ff7b9c"/>
        <path d="M51 21a22 22 0 0 1 0 22c-6-3-11-8-13-14z" fill="#ffd166"/>
        <path d="M51 43a22 22 0 0 1-19 11V43z" fill="#5ccfb0"/>
        <path d="M32 54a22 22 0 0 1-19-11c6-3 13-4 19-4z" fill="#5aa9e6"/>
        <path d="M13 43a22 22 0 0 1 0-22c6 3 11 8 13 14z" fill="#b48ae0"/>
        <path d="M13 21a22 22 0 0 1 19-11v15z" fill="#ffa45c"/>
        <circle cx="32" cy="32" r="5.5" fill="#fffdf8"/>
        <circle cx="32" cy="32" r="22" fill="none" stroke="#e5d9c8" stroke-width="1.6"/>
        <ellipse cx="23" cy="21" rx="5" ry="3.4" fill="#fff" opacity=".5" transform="rotate(-28 23 21)"/>`;
    },
    icecream(u) {
      return `<path d="M22 34h20l-8 22c-1 2-3 2-4 0z" fill="#e6b980"/>
        <g stroke="#c9945a" stroke-width="1.2" opacity=".8">
          <path d="M25 40l12-3M27 46l9-2M29 51l6-1"/>
        </g>
        <circle cx="26" cy="27" r="10" fill="#ffd1e0"/>
        <circle cx="39" cy="27" r="10" fill="#fff4dd"/>
        <circle cx="32" cy="19" r="10" fill="#b9e3c6"/>
        <circle cx="32" cy="10" r="3.4" fill="#f2565b"/>
        <path d="M32 7c1-3 3-3 4-2" stroke="#63c96b" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <ellipse cx="27" cy="16" rx="3.4" ry="2.4" fill="#fff" opacity=".5" transform="rotate(-25 27 16)"/>`;
    },
    choco(u) {
      return `<defs><linearGradient id="${u}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5a35"/><stop offset="1" stop-color="#5d3820"/></linearGradient></defs>
        <rect x="14" y="16" width="36" height="34" rx="4" fill="url(#${u}h)"/>
        <g stroke="#3f2616" stroke-width="2" opacity=".55"><path d="M26 16v34M38 16v34M14 27h36M14 38h36"/></g>
        <g fill="#fff" opacity=".16"><rect x="16" y="18" width="8" height="7" rx="2"/><rect x="28" y="18" width="8" height="7" rx="2"/></g>
        <path d="M44 12l10 4-4 8-8-6z" fill="#e7ecf1"/>
        <path d="M44 12l10 4-5 2-6-4z" fill="#cfd8e0"/>`;
    },
  };

  const ITEM_LIST = [
    { key: 'apple', name: 'りんご' }, { key: 'banana', name: 'バナナ' }, { key: 'onigiri', name: 'おにぎり' },
    { key: 'candy', name: 'あめ' }, { key: 'juice', name: 'ジュース' }, { key: 'note', name: 'ノート' },
    { key: 'pencil', name: 'えんぴつ' }, { key: 'eraser', name: 'けしゴム' }, { key: 'bread', name: 'パン' },
    { key: 'cake', name: 'ケーキ' }, { key: 'balloon', name: 'ふうせん' }, { key: 'bear', name: 'ぬいぐるみ' },
    { key: 'ball', name: 'ボール' }, { key: 'icecream', name: 'アイス' }, { key: 'choco', name: 'チョコ' },
  ];

  function item(key) {
    const u = nid('i');
    return `<svg class="item-svg" viewBox="0 0 64 64" aria-hidden="true">${ITEMS[key](u)}</svg>`;
  }

  // ---------------- マスコット（ねこの店員さん） ----------------
  const FUR = '#f6c88a', FUR_D = '#e8ac66', INK = '#5b4636', PINK = '#ff9db0';

  function catFace(mood) {
    const blush = `<ellipse cx="44" cy="58" rx="5.4" ry="3.6" fill="${PINK}" opacity=".55"/>
                   <ellipse cx="76" cy="58" rx="5.4" ry="3.6" fill="${PINK}" opacity=".55"/>`;
    const nose = `<path d="M60 52c2.2 0 3.4 1.2 3.4 2.6S61.6 57 60 57s-3.4-1-3.4-2.4S57.8 52 60 52z" fill="${PINK}"/>`;
    const whisk = `<g stroke="${FUR_D}" stroke-width="1.6" stroke-linecap="round" opacity=".9">
        <path d="M34 50l-11-3M34 55l-12 1M80 50l11-3M80 55l12 1"/></g>`;
    const eyes = {
      idle: `<g class="cat-blink">
          <ellipse cx="48" cy="46" rx="4.4" ry="5.4" fill="${INK}"/><ellipse cx="72" cy="46" rx="4.4" ry="5.4" fill="${INK}"/>
          <circle cx="49.6" cy="44" r="1.7" fill="#fff"/><circle cx="73.6" cy="44" r="1.7" fill="#fff"/></g>`,
      happy: `<g fill="#ffd166" stroke="#f0a91f" stroke-width="1.2" stroke-linejoin="round">
          <path d="M48 38l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L39.4 44.4l6-.8z"/>
          <path d="M72 38l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z"/></g>`,
      good: `<g fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round">
          <path d="M42.5 48q5.5-8 11 0"/><path d="M66.5 48q5.5-8 11 0"/></g>`,
      close: `<g fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round">
          <path d="M43 44q5 3 10 0"/><path d="M67 44q5 3 10 0"/></g>
          <g fill="#7fd4e8"><path d="M88 36c3 4 4.4 6.2 4.4 8a4.4 4.4 0 0 1-8.8 0c0-1.8 1.4-4 4.4-8z"/></g>`,
      sad: `<g fill="${INK}"><ellipse cx="48" cy="48" rx="4" ry="4.6"/><ellipse cx="72" cy="48" rx="4" ry="4.6"/></g>
          <g fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"><path d="M42 39l9 3M78 39l-9 3"/></g>`,
    };
    const mouths = {
      idle: `<path d="M60 57q-4.4 4.4-7.6 0M60 57q4.4 4.4 7.6 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`,
      happy: `<path d="M48 60q12 14 24 0z" fill="#e2657f"/><path d="M52.5 64q7.5 5 15 0z" fill="#fff" opacity=".85"/>`,
      good: `<path d="M52 60q8 8 16 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
      close: `<path d="M50 62q4-4 7 0t7 0t7 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
      sad: `<path d="M52 64q8-7 16 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    };
    return `${whisk}${nose}${blush}${eyes[mood] || eyes.idle}${mouths[mood] || mouths.idle}`;
  }

  function catHead(mood = 'idle', cls = '') {
    return `<g class="cat-head ${cls}">
      <g class="cat-ear-l"><path d="M34 28c-2-10 0-16 3-16 4 0 9 5 12 11z" fill="${FUR}"/>
        <path d="M37 27c-1.4-6.6-.4-10 1-10 2 0 5 3 7 7z" fill="${PINK}" opacity=".85"/></g>
      <g class="cat-ear-r"><path d="M86 28c2-10 0-16-3-16-4 0-9 5-12 11z" fill="${FUR}"/>
        <path d="M83 27c1.4-6.6.4-10-1-10-2 0-5 3-7 7z" fill="${PINK}" opacity=".85"/></g>
      <ellipse cx="60" cy="48" rx="30" ry="27" fill="${FUR}"/>
      <ellipse cx="60" cy="48" rx="30" ry="27" fill="none" stroke="${FUR_D}" stroke-width="1.4" opacity=".7"/>
      <path d="M30 40c4-14 16-22 30-22s26 8 30 22c-6-6-17-10-30-10s-24 4-30 10z" fill="#ffdcae" opacity=".55"/>
      <g class="cat-face">${catFace(mood)}</g>
    </g>`;
  }

  function cat(mood = 'idle') {
    return `<svg class="cat-svg" viewBox="0 0 120 132" aria-hidden="true">
      <g class="cat-tail"><path d="M92 108c14 2 20-6 18-14-2-7-10-8-12-2-1 4 2 7 5 5" fill="none" stroke="${FUR}" stroke-width="9" stroke-linecap="round"/>
        <path d="M92 108c14 2 20-6 18-14" fill="none" stroke="${FUR_D}" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>
      <g class="cat-body">
        <path d="M60 62c-18 0-28 12-28 30v26c0 8 6 12 14 12h28c8 0 14-4 14-12V92c0-18-10-30-28-30z" fill="${FUR}"/>
        <path d="M42 84c0-4 4-6 18-6s18 2 18 6v34c0 6-4 8-10 8H52c-6 0-10-2-10-8z" fill="#fffdf8"/>
        <path d="M50 80l10 8 10-8" fill="none" stroke="#ffb3c8" stroke-width="3" stroke-linecap="round"/>
        <rect x="50" y="100" width="20" height="14" rx="3" fill="#ffe9f0" stroke="#ffc2d6" stroke-width="1.4"/>
        <g class="cat-arm-l"><ellipse cx="32" cy="98" rx="9" ry="7.5" fill="${FUR}" transform="rotate(-18 32 98)"/></g>
        <g class="cat-arm-r"><ellipse cx="88" cy="98" rx="9" ry="7.5" fill="${FUR}" transform="rotate(18 88 98)"/></g>
      </g>
      ${catHead(mood)}
      <g class="cat-bandana"><path d="M31 33c8-8 18-12 29-12s21 4 29 12c-3 3-6 5-9 6-6-5-13-8-20-8s-14 3-20 8c-3-1-6-3-9-6z" fill="#ff7b9c"/>
        <g fill="#fff" opacity=".9"><circle cx="44" cy="28" r="2"/><circle cx="60" cy="25.5" r="2"/><circle cx="76" cy="28" r="2"/></g></g>
    </svg>`;
  }

  function faceBadge(mood) {
    return `<svg class="cat-svg cat-svg--badge" viewBox="6 4 108 84" aria-hidden="true">${catHead(mood)}</svg>`;
  }

  // ---------------- 装飾 ----------------
  function star() {
    const u = nid('st');
    return `<svg class="star-svg" viewBox="0 0 64 64" aria-hidden="true">
      <defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe9a3"/><stop offset=".5" stop-color="#ffc93c"/><stop offset="1" stop-color="#f2a30f"/></linearGradient></defs>
      <path d="M32 6l6.5 17.1L56.7 24 42.5 35.4l4.8 17.6L32 43 16.7 53 21.5 35.4 7.3 24l18.2-.9z"
        fill="url(#${u})" stroke="#e08c00" stroke-width="2" stroke-linejoin="round"/>
      <path d="M27 18l3-7 3 7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
    </svg>`;
  }

  function trophy() {
    const u = nid('tp');
    return `<svg class="trophy-svg" viewBox="0 0 120 120" aria-hidden="true">
      <defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffe9a3"/><stop offset=".55" stop-color="#ffc93c"/><stop offset="1" stop-color="#e2960c"/></linearGradient></defs>
      <path d="M34 20h52v22c0 16-11 26-26 26S34 58 34 42z" fill="url(#${u})"/>
      <path d="M34 26H24c-6 0-8 6-4 12 4 7 10 10 16 10" fill="none" stroke="#f0b21c" stroke-width="6" stroke-linecap="round"/>
      <path d="M86 26h10c6 0 8 6 4 12-4 7-10 10-16 10" fill="none" stroke="#f0b21c" stroke-width="6" stroke-linecap="round"/>
      <rect x="52" y="66" width="16" height="16" fill="#f0b21c"/>
      <path d="M38 84h44c4 0 6 3 6 7v5H32v-5c0-4 2-7 6-7z" fill="#e2960c"/>
      <path d="M60 30l4.6 9.7 10.4.6-8.2 6.6 2.8 10.1L60 51.3 50.4 57l2.8-10.1-8.2-6.6 10.4-.6z" fill="#fff8e0" opacity=".95"/>
      <ellipse cx="46" cy="32" rx="5" ry="9" fill="#fff" opacity=".35" transform="rotate(-18 46 32)"/>
    </svg>`;
  }

  function sparkle(color = '#ffd166') {
    return `<svg class="spark-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0c1 7 4 10 12 12-8 2-11 5-12 12-1-7-4-10-12-12C8 10 11 7 12 0z" fill="${color}"/></svg>`;
  }

  function setMood(root, mood) {
    const g = root.querySelector('.cat-face');
    if (g) g.innerHTML = catFace(mood);
  }

  return { coin, item, ITEM_LIST, cat, catHead, faceBadge, star, trophy, sparkle, setMood };
})();

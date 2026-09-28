(() => {
  'use strict';

  const { gsap, Flip } = window;
  gsap.registerPlugin(window.MotionPathPlugin, Flip);
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = (s) => (REDUCE ? 0.01 : s); // アニメーション時間（低減設定を尊重）

  // ---------- モードとレベル ----------
  const QUESTIONS_PER_LEVEL = 5;

  const MODES = [
    {
      key: 'free',
      name: 'じゆうに はらう',
      desc: 'コインは つかいほうだい。ぴったりの きんがくを つくろう',
      note: 'コインは なんまいでも つかえます。ぴったり はらえたら パーフェクト！',
      levels: [
        // レベル0：ねだん いじょう はらえれば OK（ぴったりでなくても、まいすうが おおくても よい）
        { name: 'はらえれば OK', detail: '10〜300えん・おおめに はらっても だいじょうぶ', coins: [10, 50, 100], priceMin: 10, priceMax: 300, priceStep: 10, anyPay: true },
        { name: '10・50・100えん', detail: '10〜200えん（10えんずつ）', coins: [10, 50, 100], priceMin: 10, priceMax: 200, priceStep: 10 },
        { name: '500えんも なかま', detail: '50〜500えん（10えんずつ）', coins: [10, 50, 100, 500], priceMin: 50, priceMax: 500, priceStep: 10 },
        { name: '5えんも なかま', detail: '50〜500えん（5えんずつ）', coins: [5, 10, 50, 100, 500], priceMin: 50, priceMax: 500, priceStep: 5 },
        { name: '1えんも なかま', detail: '100〜500えん（1えんずつ）', coins: [1, 5, 10, 50, 100, 500], priceMin: 100, priceMax: 500, priceStep: 1 },
        { name: 'そうしあげ', detail: '300〜990えん（1えんずつ）', coins: [1, 5, 10, 50, 100, 500], priceMin: 300, priceMax: 990, priceStep: 1 },
      ],
    },
    {
      key: 'wallet',
      name: 'おさいふで はらう',
      desc: 'てもちの コインは かぎられている。おつりが すくなくなるように！',
      note: 'てもちの コインだけで はらいます。おつりが いちばん すくなくなる だしかたを さがそう',
      levels: [
        { name: 'おさいふ ならし', detail: '50〜300えん', coins: [10, 50, 100], priceMin: 50, priceMax: 300, priceStep: 10,
          hand: { 10: [3, 5], 50: [2, 3], 100: [3, 4] } },
        { name: '5えんも なかま', detail: '50〜400えん', coins: [5, 10, 50, 100, 500], priceMin: 50, priceMax: 400, priceStep: 5,
          hand: { 5: [2, 3], 10: [3, 4], 50: [2, 3], 100: [3, 4], 500: [1, 1] } },
        { name: 'ぜんぶの コイン', detail: '100〜500えん', coins: [1, 5, 10, 50, 100, 500], priceMin: 100, priceMax: 500, priceStep: 1,
          hand: { 1: [2, 4], 5: [1, 3], 10: [2, 4], 50: [1, 3], 100: [2, 4], 500: [1, 2] } },
        { name: 'こぜにが たりない！', detail: '200〜800えん', coins: [1, 5, 10, 50, 100, 500], priceMin: 200, priceMax: 800, priceStep: 1,
          hand: { 1: [1, 2], 5: [1, 1], 10: [1, 2], 50: [1, 2], 100: [2, 4], 500: [1, 2] }, noExact: true },
        { name: 'そうしあげ', detail: '300〜990えん', coins: [1, 5, 10, 50, 100, 500], priceMin: 300, priceMax: 990, priceStep: 1,
          hand: { 1: [0, 2], 5: [0, 1], 10: [1, 2], 50: [1, 1], 100: [2, 4], 500: [1, 2] }, noExact: true },
      ],
    },
  ];
  MODES.forEach((mode) => mode.levels.forEach((lv, i) => {
    lv.index = i; lv.modeKey = mode.key; lv.unlimited = !lv.hand;
    // レベル0があるモードは 0 から、ないモードは 1 から数える
    lv.no = mode.levels[0].anyPay ? i : i + 1;
  }));

  const getMode = (key) => MODES.find((m) => m.key === key);
  const currentMode = () => getMode(state.modeKey);
  const currentLevel = () => currentMode().levels[state.levelIndex];

  // ---------- 進捗（星の数）の保存 ----------
  const PROGRESS_KEY = 'otsuri-progress-v2';
  const OLD_PROGRESS_KEY = 'otsuri-progress-v1';

  // v1 はレベル0がなかったので、じゆうモードの記録を1つ後ろにずらして引き継ぐ
  function readSavedProgress() {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
    const old = JSON.parse(localStorage.getItem(OLD_PROGRESS_KEY) || '{}');
    if (Array.isArray(old.free)) old.free = [0, ...old.free];
    return old;
  }

  function loadProgress() {
    const fresh = {};
    MODES.forEach((m) => { fresh[m.key] = m.levels.map(() => 0); });
    try {
      const saved = readSavedProgress();
      MODES.forEach((m) => {
        if (!Array.isArray(saved[m.key])) return;
        m.levels.forEach((_, i) => {
          const v = Number(saved[m.key][i]);
          if (Number.isFinite(v) && v >= 0 && v <= 3) fresh[m.key][i] = v;
        });
      });
    } catch (e) { /* 壊れていたら初期値で続行 */ }
    return fresh;
  }

  const progress = loadProgress();

  function saveProgress() {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch (e) { /* 保存できなくても続行 */ }
  }

  // レベル0は練習なので、クリアしなくても次のレベルは遊べる
  const isUnlocked = (modeKey, idx) => idx === 0
    || progress[modeKey][idx - 1] > 0
    || getMode(modeKey).levels[idx - 1].anyPay === true;

  const PARTY_COLORS = ['#ff6fa5', '#ffd166', '#5ec8e0', '#6fcf8a', '#b18cf5', '#ffffff'];

  // ---------- お金の計算 ----------
  function greedyCoinCount(amount) {
    const denoms = [500, 100, 50, 10, 5, 1];
    let rem = amount, count = 0;
    for (const d of denoms) { const n = Math.floor(rem / d); count += n; rem -= n * d; }
    return count;
  }

  // 手持ちで作れる支払い額の集合（max円まで）
  function reachableSums(hand, max) {
    let reachable = new Set([0]);
    const entries = Object.entries(hand).map(([k, v]) => [Number(k), v]).sort((a, b) => b[0] - a[0]);
    for (const [coin, count] of entries) {
      if (count <= 0) continue;
      const maxK = count === Infinity ? Math.floor(max / coin) : count;
      const next = new Set(reachable);
      for (const amt of reachable) {
        for (let k = 1; k <= maxK; k++) {
          const na = amt + k * coin;
          if (na > max) break;
          next.add(na);
        }
      }
      reachable = next;
    }
    return reachable;
  }

  const canPay = (target, hand) => reachableSums(hand, target).has(target);

  function minChangeCoins(price, hand, unlimited) {
    if (unlimited) return 0;
    const maxCoin = Math.max(...Object.keys(hand).map(Number));
    const sums = reachableSums(hand, price + maxCoin);
    let best = Infinity;
    for (let T = price; T <= price + maxCoin; T++) {
      if (!sums.has(T)) continue;
      const cc = greedyCoinCount(T - price);
      if (cc < best) best = cc;
      if (best === 0) break;
    }
    return best === Infinity ? 0 : best;
  }

  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // ---------- 状態 ----------
  const state = {
    modeKey: 'free', levelIndex: 0, questionIndex: 0, score: 0, combo: 0, bestCount: 0,
    price: 0, product: ART.ITEM_LIST[0], originalHand: {}, busy: false,
    retrying: false, // 「おしい」のあと同じ問題にやり直している
    minTrayH: 0, minWalletH: 0,
  };
  let pendingRetry = false;
  let coinIntro = null; // 出題時にコインがならぶアニメーション

  const $ = (id) => document.getElementById(id);
  const els = {
    questionValue: $('questionValue'), scoreValue: $('scoreValue'),
    modeList: $('modeList'), levelList: $('levelList'), levelsTitle: $('levelsTitle'),
    levelsNote: $('levelsNote'), gameLevelName: $('gameLevelName'), finalStars: $('finalStars'),
    finalModeName: $('finalModeName'), modeBackBtn: $('modeBackBtn'), levelsBackBtn: $('levelsBackBtn'),
    gameBackBtn: $('gameBackBtn'), clearToLevelsBtn: $('clearToLevelsBtn'),
    finalToLevelsBtn: $('finalToLevelsBtn'), finalToModesBtn: $('finalToModesBtn'),
    comboValue: $('comboValue'), comboItem: $('comboItem'), gameMascot: $('gameMascot'),
    productArt: $('productArt'), productName: $('productName'), priceValue: $('priceValue'),
    totalValue: $('totalValue'), totalDisplay: $('totalDisplay'), wallet: $('selectedCoins'),
    coinTray: $('coinTray'), payBtn: $('payBtn'), feedbackOverlay: $('feedbackOverlay'),
    feedbackCard: $('feedbackCard'), feedbackFace: $('feedbackFace'), feedbackText: $('feedbackText'),
    feedbackSub: $('feedbackSub'), nextBtn: $('nextBtn'), startBtn: $('startBtn'),
    nextLevelBtn: $('nextLevelBtn'), clearedLevel: $('clearedLevel'),
    clearScore: $('clearScore'), clearStars: $('clearStars'), clearMascot: $('clearMascot'),
    finalScore: $('finalScore'), finalTrophy: $('finalTrophy'), titleMascot: $('titleMascot'),
    retryBtn: $('retryBtn'), feedbackButtons: $('feedbackButtons'),
    speechBubble: $('speechBubble'), shopScene: document.querySelector('.shop-scene'),
    fxLayer: $('fxLayer'), skyLayer: $('skyLayer'), app: $('app'),
    hudScore: $('hudScore'), paymentPanel: document.querySelector('.payment-panel'),
    gameHeader: document.querySelector('.game-header'),
    feverOverlay: $('feverOverlay'), feverTitle: $('feverTitle'), feverMascot: $('feverMascot'),
    feverBadge: $('feverBadge'), feverBonus: $('feverBonus'), feverNextBtn: $('feverNextBtn'),
  };

  const burst = window.confetti.create($('confettiCanvas'), { resize: true, useWorker: true });

  // ---------- 効果音 ----------
  const sfx = (name, arg) => { if (window.SFX) window.SFX.play(name, arg); };
  const muteBtn = $('muteBtn');

  function renderMuteBtn() {
    const muted = window.SFX ? window.SFX.isMuted() : true;
    muteBtn.innerHTML = ART.speaker(!muted);
    muteBtn.classList.toggle('is-muted', muted);
    muteBtn.setAttribute('aria-pressed', String(muted));
  }

  if (window.SFX) {
    renderMuteBtn();
    muteBtn.addEventListener('click', () => {
      const muted = window.SFX.setMuted(!window.SFX.isMuted());
      renderMuteBtn();
      if (!muted) sfx('select');
    });
    // 最初の操作で音を鳴らせるようにする（ブラウザの自動再生制限のため）
    const unlockAudio = () => window.SFX.unlock();
    document.addEventListener('pointerdown', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
  }

  // ---------- 汎用アニメーション ----------
  function rectOf(el) { return el.getBoundingClientRect(); }
  function centerOf(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  function tickNumber(el, to, dur = 0.45) {
    // 前のカウントアップが残っていると、あとから古い数字で上書きされるので止める
    if (el.__tick) el.__tick.kill();
    el.__tick = null;
    const obj = { v: Number(el.textContent.replace(/[^0-9-]/g, '')) || 0 };
    if (obj.v === to) return;
    el.__tick = gsap.to(obj, {
      v: to, duration: D(dur), ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.v); },
    });
  }

  // アニメーションなしで数字を置く（動いているカウントアップも止める）
  function setNumber(el, v) {
    if (el.__tick) { el.__tick.kill(); el.__tick = null; }
    el.textContent = v;
  }

  function popEl(el, scale = 1.16) {
    gsap.fromTo(el, { scale: 1 }, { scale, duration: D(0.12), yoyo: true, repeat: 1, ease: 'power2.out' });
  }

  function spinInner(coinEl, turns = 1.5) {
    const svg = coinEl.querySelector('svg');
    if (!svg || REDUCE) return;
    gsap.fromTo(svg, { rotationY: 0 }, { rotationY: 360 * turns, duration: 0.6, ease: 'power1.inOut', clearProps: 'rotationY' });
    gsap.fromTo(svg, { y: 0 }, { y: -26, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.out', clearProps: 'y' });
  }

  function sparkleAt(x, y, count = 6, color = '#ffd166') {
    if (REDUCE) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'fx-item';
      s.innerHTML = ART.sparkle(color);
      s.firstChild.style.width = `${randInt(10, 20)}px`;
      els.fxLayer.appendChild(s);
      gsap.set(s, { x, y, scale: 0, rotation: randInt(0, 180) });
      gsap.to(s, {
        x: x + randInt(-52, 52), y: y + randInt(-56, 24), scale: gsap.utils.random(0.7, 1.3),
        rotation: `+=${randInt(60, 220)}`, duration: 0.55, ease: 'power2.out',
        onComplete: () => gsap.to(s, { scale: 0, opacity: 0, duration: 0.25, onComplete: () => s.remove() }),
      });
    }
  }

  function shake(el, strength = 8) {
    if (REDUCE) return;
    gsap.fromTo(el, { x: -strength }, { x: 0, duration: 0.6, ease: 'elastic.out(1.1, 0.25)', clearProps: 'x' });
  }

  // ---------- マスコット ----------
  const catTimelines = [];
  function setMood(container, mood) {
    const root = container.querySelector('.cat-svg');
    if (root) ART.setMood(root, mood);
  }

  function animateCat(container, { idle = true } = {}) {
    const svg = container.querySelector('.cat-svg');
    if (!svg || REDUCE) return;
    const head = svg.querySelector('.cat-head');
    const body = svg.querySelector('.cat-body');
    const tail = svg.querySelector('.cat-tail');
    const earL = svg.querySelector('.cat-ear-l');
    const earR = svg.querySelector('.cat-ear-r');
    if (!idle) return;
    if (head) {
      catTimelines.push(gsap.to(head, {
        y: -4, rotation: 1.6, transformOrigin: '60px 76px',
        duration: 1.3, yoyo: true, repeat: -1, ease: 'sine.inOut',
      }));
    }
    if (body) {
      catTimelines.push(gsap.to(body, {
        scaleY: 1.03, scaleX: 0.99, transformOrigin: '60px 132px',
        duration: 1.3, yoyo: true, repeat: -1, ease: 'sine.inOut',
      }));
    }
    if (tail) {
      catTimelines.push(gsap.to(tail, {
        rotation: 14, transformOrigin: '90px 110px',
        duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut',
      }));
    }
    [earL, earR].forEach((ear, i) => {
      if (!ear) return;
      catTimelines.push(gsap.to(ear, {
        rotation: i ? -7 : 7, transformOrigin: i ? '80px 30px' : '40px 30px',
        duration: 0.22, repeat: -1, yoyo: true, repeatDelay: 2.6 + i * 0.4, ease: 'power1.inOut',
      }));
    });
    const blink = svg.querySelector('.cat-blink');
    if (blink) {
      catTimelines.push(gsap.to(blink, {
        scaleY: 0.08, transformOrigin: '60px 46px',
        duration: 0.09, repeat: -1, yoyo: true, repeatDelay: 2.8, ease: 'power1.inOut',
      }));
    }
  }

  function clearCatTimelines() {
    catTimelines.forEach((t) => t.kill());
    catTimelines.length = 0;
  }

  function catReact(container, mood) {
    setMood(container, mood);
    const svg = container.querySelector('.cat-svg');
    if (!svg || REDUCE) return;
    const head = svg.querySelector('.cat-head');
    if (mood === 'happy') {
      gsap.fromTo(svg, { y: 0 }, { y: -18, duration: 0.28, yoyo: true, repeat: 3, ease: 'power2.out' });
      gsap.fromTo(svg, { rotation: 0 }, { rotation: 8, duration: 0.18, yoyo: true, repeat: 5, ease: 'sine.inOut', transformOrigin: '60px 120px', clearProps: 'rotation' });
    } else if (mood === 'good') {
      gsap.fromTo(svg, { y: 0 }, { y: -12, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.out' });
    } else if (mood === 'close' || mood === 'sad') {
      gsap.fromTo(head || svg, { rotation: -6 }, { rotation: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.25)', transformOrigin: '60px 76px', clearProps: 'rotation' });
    }
  }

  // ---------- 背景 ----------
  function buildSky() {
    if (REDUCE) return;
    const pieces = [1, 100, 5, 500, 10, 50];
    for (let i = 0; i < 11; i++) {
      const d = document.createElement('div');
      d.className = 'sky-dot';
      const isCoin = i % 3 !== 2;
      d.innerHTML = isCoin ? ART.coin(pieces[i % pieces.length]) : ART.sparkle(PARTY_COLORS[i % PARTY_COLORS.length]);
      const size = isCoin ? randInt(26, 52) : randInt(14, 26);
      d.firstChild.style.width = `${size}px`;
      d.firstChild.style.height = `${size}px`;
      d.style.left = `${randInt(-4, 96)}vw`;
      d.style.top = `${randInt(0, 92)}vh`;
      d.style.opacity = String(gsap.utils.random(0.18, 0.42));
      els.skyLayer.appendChild(d);
      gsap.to(d, {
        y: randInt(-60, 60), x: randInt(-30, 30), rotation: randInt(-40, 40),
        duration: gsap.utils.random(6, 12), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: Math.random() * 3,
      });
    }
  }

  // ---------- 画面遷移 ----------
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const next = $(id);
    next.classList.add('active');
    if (id !== 'screen-game') document.body.classList.remove('is-rainbow');
    gsap.fromTo(next, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: D(0.38), ease: 'power2.out' });
  }

  // ---------- 出題 ----------
  function randPrice(min, max, step) {
    if (max < min) return min;
    if (step > 1) {
      const lo = Math.ceil(min / step);
      const hi = Math.floor(max / step);
      return (hi < lo ? lo : randInt(lo, hi)) * step;
    }
    return randInt(min, max);
  }

  function buildHand(level) {
    const hand = {};
    level.coins.forEach((v) => {
      hand[v] = level.unlimited ? Infinity : randInt(level.hand[v][0], level.hand[v][1]);
    });
    return hand;
  }

  const handTotal = (hand) => Object.entries(hand).reduce((sum, [v, n]) => sum + Number(v) * n, 0);

  function generateQuestion() {
    const level = currentLevel();
    state.retrying = false;
    state.product = ART.ITEM_LIST[randInt(0, ART.ITEM_LIST.length - 1)];

    if (level.unlimited) {
      state.originalHand = buildHand(level);
      state.price = randPrice(level.priceMin, level.priceMax, level.priceStep);
      return;
    }

    // 手持ちで必ず払えて、レベルによっては「ぴったり払えない」状況を作る
    for (let attempt = 0; attempt < 150; attempt++) {
      const hand = buildHand(level);
      const maxPrice = Math.min(level.priceMax, handTotal(hand) - 20);
      if (maxPrice < level.priceMin) continue;
      const price = randPrice(level.priceMin, maxPrice, level.priceStep);
      if (level.noExact && canPay(price, hand)) continue;
      state.originalHand = hand;
      state.price = price;
      return;
    }
    const hand = buildHand(level);
    state.originalHand = hand;
    state.price = Math.max(level.priceMin, Math.min(level.priceMax, handTotal(hand) - 50));
  }

  function renderQuestion(animate = true) {
    const level = currentLevel();
    gsap.killTweensOf(els.productArt);
    gsap.set(els.productArt, { clearProps: 'all' });
    els.productArt.innerHTML = ART.item(state.product.key);
    els.productName.textContent = state.product.name;
    els.gameLevelName.textContent = `${currentMode().name}・レベル${level.no}`;
    els.questionValue.textContent = `${state.questionIndex + 1}/${QUESTIONS_PER_LEVEL}`;
    els.wallet.innerHTML = '';
    els.wallet.style.height = '';
    els.wallet.style.minHeight = '';
    els.coinTray.style.minHeight = '';
    renderCoinTray(level);
    reserveHeights();
    updateTotals(false);
    updateHud(false);
    setMood(els.gameMascot, 'idle');

    if (animate && !REDUCE) {
      sfx('question');
      setNumber(els.priceValue, 0);
      const tl = gsap.timeline();
      tl.fromTo(els.speechBubble, { scale: 0.6, opacity: 0, transformOrigin: 'left center' },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.8)' })
        .fromTo(els.productArt, { scale: 0, rotation: -50 },
          { scale: 1, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.55)' }, '-=0.25')
        .add(() => tickNumber(els.priceValue, state.price, 0.5), '-=0.35')
        .add(() => {
          gsap.to(els.productArt, { y: -5, rotation: 3, duration: 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        });
      // コインの登場はタイムラインに入れず単独で持っておき、途中でタップされたら終わらせる
      coinIntro = gsap.fromTo(els.coinTray.querySelectorAll('.coin-btn'),
        { scale: 0, y: 26, rotation: -40 },
        { scale: 1, y: 0, rotation: 0, duration: 0.55, delay: 0.55, ease: 'back.out(2.2)', stagger: { each: 0.035, from: 'center' } });
    } else {
      setNumber(els.priceValue, state.price);
    }
  }

  // ---------- コインUI ----------
  function makeCoinEl(value, kind) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `${kind} coin-${value}`;
    el.dataset.value = value;
    el.innerHTML = ART.coin(value);
    return el;
  }

  // 問題が変わってもボタンの位置が上に跳ねないよう、さいふとトレイの高さは
  // そのレベル中に必要だった最大の高さを保つ（縮めない）。
  function reserveHeights() {
    const trayH = els.coinTray.getBoundingClientRect().height;
    if (trayH > state.minTrayH) state.minTrayH = trayH;
    if (state.minTrayH > 0) els.coinTray.style.minHeight = `${state.minTrayH}px`;
    growWalletReserve();
  }

  function growWalletReserve() {
    const walletH = els.wallet.getBoundingClientRect().height;
    if (walletH > state.minWalletH) state.minWalletH = walletH;
    if (state.minWalletH > 0) els.wallet.style.minHeight = `${state.minWalletH}px`;
  }

  // コインを取り出した跡に置く空きスロット（トレイの並びをずらさないため）
  function createSlot(value) {
    const slot = document.createElement('span');
    slot.className = `coin-slot coin-slot--${value}`;
    return slot;
  }

  function renderCoinTray(level) {
    els.coinTray.innerHTML = '';
    level.coins.forEach((value) => {
      if (level.unlimited) {
        const source = makeCoinEl(value, 'coin-btn');
        source.__activate = () => selectUnlimited(source, value);
        els.coinTray.appendChild(source);
      } else {
        const group = document.createElement('span');
        group.className = 'coin-group';
        group.dataset.denom = value;
        els.coinTray.appendChild(group);
        for (let i = 0; i < state.originalHand[value]; i++) {
          const el = makeCoinEl(value, 'coin-btn');
          el.__activate = () => selectLimited(el, value);
          group.appendChild(el);
        }
      }
    });
  }

  function allCoinEls() {
    return [...document.querySelectorAll('.coin-btn, .coin-chip')];
  }

  function flipCoins(mutate, mover) {
    if (REDUCE) { mutate(); return; }
    const flipState = Flip.getState(allCoinEls());
    mutate();
    // absolute: true にするとアニメ中だけコインが浮いてしまい、
    // さいふやトレイの高さがつぶれてボタンが上下にずれるので使わない。
    Flip.from(flipState, {
      duration: 0.55, ease: 'back.out(1.1)', scale: true,
      onEnter: (e) => gsap.fromTo(e, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' }),
    });
    if (mover) spinInner(mover);
  }

  // 枚数制限あり：コインそのものが財布へ移動
  function selectLimited(el, value) {
    if (state.busy || el.dataset.flying === '1') return;
    el.dataset.flying = '1';
    sfx('coinUp');
    const slot = createSlot(value);
    el.__slot = slot;
    flipCoins(() => {
      // 跡のスロットは位置を記録した後に入れる。先に入れると記録の瞬間だけ
      // 後ろのコインが1つ右にずれ、そこから戻る「左詰め」の動きが出てしまう。
      el.parentNode.insertBefore(slot, el);
      el.className = `coin-chip coin-${value}`;
      els.wallet.appendChild(el);
      el.__activate = () => deselectLimited(el, value);
    }, el);
    gsap.delayedCall(0.6, () => { el.dataset.flying = '0'; });
    updateTotals();
  }

  function deselectLimited(el, value) {
    if (state.busy || el.dataset.flying === '1') return;
    el.dataset.flying = '1';
    sfx('coinDown');
    const slot = el.__slot;
    el.__slot = null;
    flipCoins(() => {
      el.className = `coin-btn coin-${value}`;
      if (slot && slot.isConnected) slot.parentNode.replaceChild(el, slot);
      else els.coinTray.querySelector(`.coin-group[data-denom="${value}"]`).appendChild(el);
      el.__activate = () => selectLimited(el, value);
    }, el);
    gsap.delayedCall(0.6, () => { el.dataset.flying = '0'; });
    updateTotals();
  }

  // 枚数無制限：トレイのコインは残り、複製が財布へ飛ぶ
  function selectUnlimited(sourceEl, value) {
    if (state.busy) return;
    sfx('coinUp');
    const startRect = rectOf(sourceEl);

    // さいふの最後に足すだけなので、ほかのコインは動かさない。
    // （飛んでいる途中のコインに Flip をかけると、途中の位置で止まってしまう）
    const chip = makeCoinEl(value, 'coin-chip');
    chip.__activate = () => deselectUnlimited(chip, sourceEl, value);
    els.wallet.appendChild(chip);

    if (!REDUCE) {
      chip.dataset.flying = '1'; // とうちゃくするまでは もどせない
      gsap.fromTo(sourceEl, { scale: 1 }, { scale: 0.82, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out' });
      const endRect = rectOf(chip);
      const dx = centerOf(startRect).x - centerOf(endRect).x;
      const dy = centerOf(startRect).y - centerOf(endRect).y;
      gsap.set(chip, { x: dx, y: dy, scale: startRect.width / endRect.width });
      gsap.to(chip, {
        duration: 0.55, ease: 'power2.inOut', scale: 1,
        motionPath: { path: [{ x: dx, y: dy }, { x: dx * 0.45, y: dy * 0.4 - 60 }, { x: 0, y: 0 }], curviness: 1.3 },
        onComplete: () => {
          gsap.set(chip, { clearProps: 'transform' });
          chip.dataset.flying = '0';
          const c = centerOf(rectOf(chip));
          sparkleAt(c.x, c.y, 3, '#ffe9a3');
        },
      });
      spinInner(chip);
    }
    updateTotals();
  }

  function deselectUnlimited(chip, sourceEl, value) {
    if (state.busy || chip.dataset.flying === '1') return;
    chip.dataset.flying = '1';
    sfx('coinDown');

    if (REDUCE) { chip.remove(); updateTotals(); return; }

    const from = rectOf(chip);
    const to = rectOf(sourceEl);
    // 飛んでいる途中のコインは自分のアニメーションで着地するので、詰める対象から外す
    const siblings = Flip.getState([...els.wallet.children].filter((c) => c !== chip && c.dataset.flying !== '1'));
    detach(chip, from);
    Flip.from(siblings, { duration: 0.4, ease: 'power3.out' });

    const dx = centerOf(to).x - centerOf(from).x;
    const dy = centerOf(to).y - centerOf(from).y;
    gsap.to(chip, {
      duration: 0.45, ease: 'power2.in', scale: to.width / from.width, opacity: 0.2,
      motionPath: { path: [{ x: 0, y: 0 }, { x: dx * 0.5, y: dy * 0.4 - 40 }, { x: dx, y: dy }], curviness: 1.3 },
      onComplete: () => chip.remove(),
    });
    spinInner(chip, 1);
    updateTotals();
  }

  // 要素をfxレイヤーへ固定配置で切り離す（レイアウトから外す）
  function detach(el, rect) {
    const r = rect || rectOf(el);
    el.style.position = 'fixed';
    el.style.left = `${r.left}px`;
    el.style.top = `${r.top}px`;
    el.style.width = `${r.width}px`;
    el.style.height = `${r.height}px`;
    el.style.margin = '0';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '55';
    els.fxLayer.appendChild(el);
  }

  function getSelectedTotal() {
    return [...els.wallet.children].reduce((sum, el) => sum + Number(el.dataset.value), 0);
  }

  function updateTotals(animate = true) {
    growWalletReserve();
    const total = getSelectedTotal();
    if (animate && !REDUCE) {
      tickNumber(els.totalValue, total, 0.35);
      popEl(els.totalDisplay, 1.05);
    } else {
      setNumber(els.totalValue, total);
    }
    els.payBtn.disabled = total <= 0;
  }

  function updateHud(animate = true) {
    if (animate && !REDUCE) {
      tickNumber(els.scoreValue, state.score, 0.6);
      tickNumber(els.comboValue, state.combo, 0.3);
    } else {
      setNumber(els.scoreValue, state.score);
      setNumber(els.comboValue, state.combo);
    }
  }

  // ---------- 判定 ----------
  function evaluateAnswer(total) {
    const level = currentLevel();
    if (total < state.price) return { status: 'insufficient', short: state.price - total };
    const change = total - state.price;
    const changeCoins = greedyCoinCount(change);
    if (changeCoins === 0) return { status: 'perfect', change, changeCoins };
    if (level.anyPay) return { status: 'paid', change, changeCoins };
    const minCoins = minChangeCoins(state.price, state.originalHand, level.unlimited);
    if (changeCoins === minCoins) return { status: 'good', change, changeCoins, minCoins };
    return { status: 'close', change, changeCoins, minCoins };
  }

  function payCoinsToShop() {
    const chips = [...els.wallet.children];
    if (!chips.length || REDUCE) { chips.forEach((c) => c.remove()); return Promise.resolve(); }

    // 1枚ずつ外すと残りのコインが詰めて動いてしまうので、
    // 先に全部の位置を測ってから、まとめて切り離す。
    sfx('pay');
    const rects = chips.map((chip) => rectOf(chip));
    // 支払い中にさいふが縮んで下のボタンが動かないよう高さを固定する
    els.wallet.style.height = `${rectOf(els.wallet).height}px`;
    const target = centerOf(rectOf(els.gameMascot));
    chips.forEach((chip, i) => detach(chip, rects[i]));

    return new Promise((resolve) => {
      chips.forEach((chip, i) => {
        const from = rects[i];
        const dx = target.x - centerOf(from).x;
        const dy = target.y - centerOf(from).y - 10;
        gsap.to(chip, {
          duration: 0.5, delay: i * 0.05, ease: 'power2.in', scale: 0.4, opacity: 0.85,
          motionPath: { path: [{ x: 0, y: 0 }, { x: dx * 0.5, y: dy * 0.4 - 70 }, { x: dx, y: dy }], curviness: 1.4 },
          onComplete: () => {
            sparkleAt(target.x, target.y, 3, '#ffe9a3');
            chip.remove();
            if (i === chips.length - 1) resolve();
          },
        });
        spinInner(chip, 2);
      });
      gsap.delayedCall(0.6 + chips.length * 0.05, resolve);
    });
  }

  function coinRain(count = 14) {
    if (REDUCE) return;
    const denoms = [1, 5, 10, 50, 100, 500];
    for (let i = 0; i < count; i++) {
      const d = document.createElement('div');
      d.className = 'fx-item';
      d.innerHTML = ART.coin(denoms[randInt(0, 5)]);
      const size = randInt(26, 46);
      d.firstChild.style.width = `${size}px`;
      d.firstChild.style.height = `${size}px`;
      els.fxLayer.appendChild(d);
      const x = randInt(20, window.innerWidth - 40);
      gsap.set(d, { x, y: -60, rotation: randInt(-40, 40) });
      gsap.to(d, {
        y: window.innerHeight + 80, rotation: `+=${randInt(180, 520)}`,
        duration: gsap.utils.random(1.4, 2.4), delay: Math.random() * 0.5, ease: 'power1.in',
        onComplete: () => d.remove(),
      });
    }
  }

  function celebrate(level, tier = 0) {
    if (REDUCE) return;
    const opts = { colors: PARTY_COLORS, disableForReducedMotion: true };
    const k = 1 + tier * 0.6; // コンボが上がるほど紙吹雪が増える
    if (level === 'perfect' || level === 'good') {
      const base = level === 'perfect' ? 110 : 55;
      burst({ ...opts, particleCount: Math.round(base * k), spread: 95 + tier * 20, startVelocity: 46 + tier * 6, origin: { x: 0.5, y: 0.6 } });
      if (level === 'perfect' || tier >= 1) {
        gsap.delayedCall(0.18, () => burst({ ...opts, particleCount: Math.round(60 * k), angle: 60, spread: 70, origin: { x: 0, y: 0.75 } }));
        gsap.delayedCall(0.32, () => burst({ ...opts, particleCount: Math.round(60 * k), angle: 120, spread: 70, origin: { x: 1, y: 0.75 } }));
      }
      if (tier >= 2) {
        gsap.delayedCall(0.5, () => burst({ ...opts, particleCount: 80, spread: 360, startVelocity: 32, shapes: ['star'], scalar: 1.4, origin: { x: 0.5, y: 0.4 } }));
      }
      if (tier >= 3) {
        gsap.delayedCall(0.7, () => burst({ ...opts, particleCount: 150, angle: 270, spread: 140, startVelocity: 20, gravity: 0.6, origin: { x: 0.5, y: -0.1 } }));
      }
      if (level === 'perfect' || tier >= 1) coinRain(tier >= 3 ? 45 : 16 + tier * 8);
    } else if (level === 'clear') {
      burst({ ...opts, particleCount: 130, spread: 110, startVelocity: 50, origin: { x: 0.5, y: 0.65 } });
      gsap.delayedCall(0.4, () => burst({ ...opts, particleCount: 90, spread: 120, origin: { x: 0.5, y: 0.5 } }));
      coinRain(20);
    }
  }

  // ---------- コンボ演出 ----------
  // 1レベル5もんの中で 2・3・4コンボと段階が上がり、演出がどんどん派手になる
  const comboTier = (combo) => (combo >= 4 ? 3 : combo >= 3 ? 2 : combo >= 2 ? 1 : 0);
  const TIER_WORDS = ['', 'いいね！', 'すごい！！', 'てんさい！！！'];

  function renderComboTier() {
    const tier = comboTier(state.combo);
    [1, 2, 3].forEach((t) => els.comboItem.classList.toggle(`combo-tier-${t}`, tier === t));
    document.body.classList.toggle('is-rainbow', tier >= 3);
  }

  function showBanner(main, sub, tier) {
    if (REDUCE) return;
    const b = document.createElement('div');
    b.className = `fx-banner tier-${tier}`;
    b.innerHTML = `${main}${sub ? `<small>${sub}</small>` : ''}`;
    document.body.appendChild(b);
    gsap.timeline({ onComplete: () => b.remove() })
      .fromTo(b, { xPercent: -50, yPercent: -50, scale: 3, rotation: -14, opacity: 0 },
        { scale: 1, rotation: -5, opacity: 1, duration: 0.35, ease: 'back.out(2.5)' })
      .to(b, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .to(b, { y: -70, opacity: 0, duration: 0.4, ease: 'power2.in' }, '+=0.35');
  }

  function screenFlash() {
    if (REDUCE) return;
    const f = document.createElement('div');
    f.className = 'fx-flash';
    document.body.appendChild(f);
    gsap.fromTo(f, { opacity: 0.75 }, { opacity: 0, duration: 0.4, ease: 'power2.out', onComplete: () => f.remove() });
  }

  function speedLines(dur = 1) {
    if (REDUCE) return;
    const l = document.createElement('div');
    l.className = 'fx-speedlines';
    document.body.appendChild(l);
    gsap.to(l, { rotation: 25, duration: dur, ease: 'none' });
    gsap.timeline({ onComplete: () => l.remove() })
      .fromTo(l, { opacity: 0, scale: 1.3 }, { opacity: 0.85, scale: 1, duration: 0.15 })
      .to(l, { opacity: 0, duration: 0.4 }, dur - 0.4);
  }

  // #app に transform をかけると中の position:fixed がずれるので、画面の部品を個別に揺らす
  function screenShake(power = 10, dur = 0.45) {
    if (REDUCE) return;
    const targets = [els.gameHeader, els.shopScene, els.paymentPanel, els.feedbackOverlay];
    const tl = gsap.timeline({ onComplete: () => gsap.set(targets, { clearProps: 'x,y' }) });
    const n = Math.round(dur / 0.045);
    for (let i = 0; i < n; i++) {
      const p = power * (1 - i / n);
      tl.to(targets, { x: gsap.utils.random(-p, p), y: gsap.utils.random(-p, p), duration: 0.045, ease: 'none' });
    }
  }

  // 一瞬だけ時間をゆっくりにして、すぐ元に戻す
  function slowMo(hold = 380) {
    if (REDUCE) return;
    const g = gsap.globalTimeline;
    g.timeScale(0.3);
    const start = performance.now() + hold;
    const step = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / 450));
      g.timeScale(0.3 + 0.7 * t);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- スコアにコインが飛んでいく ----------
  let dopaRun = 0;

  function flyDopa(fromScore, gain, bonus) {
    const run = ++dopaRun;
    const start = centerOf(rectOf(els.feedbackFace));
    const end = centerOf(rectOf(els.hudScore));
    els.hudScore.classList.add('hud-lift');

    const label = document.createElement('div');
    label.className = 'fx-gain';
    label.innerHTML = `+${gain}${bonus ? `<small> コンボ+${bonus}</small>` : ''}`;
    document.body.appendChild(label);
    const lw = label.offsetWidth;
    gsap.timeline({ onComplete: () => label.remove() })
      .fromTo(label, { x: start.x - lw / 2, y: start.y - 20, scale: 0.3, opacity: 0 },
        { y: start.y - 70, scale: 1.2, opacity: 1, duration: 0.35, ease: 'back.out(2.5)' })
      .to(label, { x: end.x - lw / 2, y: end.y - 14, scale: 0.6, opacity: 0, duration: 0.55, ease: 'power2.in' }, '+=0.25');

    const count = Math.min(5 + state.combo * 2, 20);
    const denoms = [10, 50, 100, 500];
    for (let i = 0; i < count; i++) {
      const d = document.createElement('div');
      d.className = 'fx-item';
      d.innerHTML = ART.coin(denoms[randInt(0, 3)]);
      d.firstChild.style.width = '30px';
      d.firstChild.style.height = '30px';
      els.fxLayer.appendChild(d);
      const sx = start.x - 15 + randInt(-30, 30);
      const sy = start.y - 15 + randInt(-20, 20);
      gsap.set(d, { x: sx, y: sy, scale: 0 });
      gsap.timeline({ delay: 0.25 + i * 0.045, onComplete: () => {
        d.remove();
        if (run !== dopaRun) return;
        sfx('dopa', i);
        els.scoreValue.textContent = Math.round(fromScore + (gain * (i + 1)) / count);
        gsap.fromTo(els.hudScore, { scale: 1.18 }, { scale: 1, duration: 0.18, ease: 'power2.out' });
        if (i === count - 1) sparkleAt(end.x, end.y, 8);
      } })
        .to(d, { scale: 1.1, y: sy - randInt(30, 70), x: sx + randInt(-40, 40), duration: 0.22, ease: 'power2.out' })
        .to(d, { x: end.x - 15, y: end.y - 15, scale: 0.5, rotation: randInt(180, 540), duration: 0.42, ease: 'power2.in' });
    }
  }

  function finishDopa() {
    dopaRun++;
    els.hudScore.classList.remove('hud-lift');
    setNumber(els.scoreValue, state.score);
  }

  // ---------- フィードバック ----------
  const FEEDBACK = {
    perfect: { mood: 'happy', title: 'パーフェクト！', sub: 'ぴったり はらえたね！' },
    good: { mood: 'good', title: 'グッド！', sub: '' },
    paid: { mood: 'happy', title: 'はらえたね！', sub: '' },
    close: { mood: 'close', title: 'おしい、もうすこし！', sub: '' },
    insufficient: { mood: 'sad', title: 'たりないよ！', sub: '' },
  };

  function showFeedback(result) {
    const conf = FEEDBACK[result.status];
    let tier = 0;
    let tierUp = false;
    catReact(els.gameMascot, conf.mood);

    els.feedbackFace.innerHTML = ART.faceBadge(conf.mood);
    els.feedbackText.textContent = conf.title;
    // 「おしい」のときだけ、つぎへ すすむか もういちど やるかを えらべる
    const canRetry = result.status === 'close';
    els.retryBtn.hidden = !canRetry;
    els.feedbackButtons.classList.toggle('is-two', canRetry);
    if (result.status === 'insufficient') {
      els.feedbackSub.textContent = `あと ${result.short}えん たりません`;
      sfx('miss');
      els.nextBtn.textContent = 'もういちど';
      pendingRetry = true;
    } else {
      pendingRetry = false;
      els.nextBtn.textContent = 'つぎへ';
      const prevScore = state.score;
      const prevTier = comboTier(state.combo);
      let gain = state.retrying ? 0 : 30;
      let bonus = 0;
      const ok = result.status === 'perfect' || result.status === 'good' || result.status === 'paid';
      if (ok) {
        // ほしの かずは さいしょの こたえで きめる（やりなおしは てんすうだけ）
        state.combo += 1;
        if (!state.retrying) state.bestCount += 1;
        gain = result.status === 'good' ? 80 : 100;
        bonus = Math.min(state.combo - 1, 5) * 20; // コンボが続くほど点数もインフレ
        gain += bonus;
        sfx(result.status === 'good' ? 'good' : 'perfect', state.combo);
      }
      if (result.status === 'perfect') {
        els.feedbackSub.textContent = conf.sub;
      } else if (result.status === 'paid') {
        els.feedbackSub.textContent = `おつりは ${result.change}えん だよ`;
      } else if (result.status === 'good') {
        els.feedbackSub.textContent = `おつりは ${result.change}えん（${result.changeCoins}まい）\nこれいじょう すくなく できないよ！`;
      } else {
        els.feedbackSub.textContent = `おつりが ${result.changeCoins}まいに なったよ\nさいしょうは ${result.minCoins}まい！`;
        sfx('close');
        state.combo = 0;
      }
      state.score += gain;
      tier = comboTier(state.combo);
      tierUp = tier > prevTier;
      renderComboTier();
      if (REDUCE) updateHud(false);
      else {
        tickNumber(els.comboValue, state.combo, 0.3);
        if (result.status !== 'close') popEl(els.comboItem, 1.25 + tier * 0.1);
        if (gain > 0) gsap.delayedCall(0.5, () => flyDopa(prevScore, gain, bonus));
        else setNumber(els.scoreValue, state.score);
      }
    }

    els.feedbackOverlay.classList.add('show');
    if (!REDUCE) {
      const tl = gsap.timeline();
      tl.fromTo(els.feedbackOverlay, { opacity: 0 }, { opacity: 1, duration: 0.2 })
        .fromTo(els.feedbackCard, { scale: 0.4, y: 50 }, { scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.1')
        .fromTo(els.feedbackFace, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.65, ease: 'elastic.out(1, 0.5)' }, '-=0.4')
        .fromTo(els.feedbackText, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.4')
        .fromTo(els.feedbackSub, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 }, '-=0.15')
        .fromTo([els.retryBtn, els.nextBtn].filter((b) => !b.hidden), { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)', stagger: 0.06 }, '-=0.1');

      if (result.status === 'perfect' || result.status === 'good' || result.status === 'paid') {
        celebrate(result.status === 'good' ? 'good' : 'perfect', tier);
        if (tier >= 1) showBanner(`${state.combo}れんぞく！`, TIER_WORDS[tier], tier);
        if (tierUp) sfx('comboUp', tier);
        if (tier >= 2) { screenFlash(); screenShake(6 + tier * 3); speedLines(1.1); sfx('flash'); }
        if (tier >= 3) slowMo();
      } else {
        shake(els.feedbackCard, 10);
      }
    }
  }

  async function submitPayment() {
    if (state.busy) return;
    const total = getSelectedTotal();
    if (total <= 0) return;
    const result = evaluateAnswer(total);
    state.busy = true;
    els.payBtn.disabled = true;

    try {
      if (result.status === 'insufficient') {
        shake(els.totalDisplay, 12);
        showFeedback(result);
        return;
      }
      await payCoinsToShop();
      updateTotals(false);
      showFeedback(result);
    } finally {
      state.busy = false;
    }
  }

  function closeFeedback(after) {
    const close = () => {
      finishDopa();
      els.feedbackOverlay.classList.remove('show');
      after();
    };
    if (REDUCE) { close(); return; }
    gsap.to(els.feedbackCard, {
      scale: 0.7, y: 30, opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => { gsap.set(els.feedbackCard, { clearProps: 'all' }); close(); },
    });
  }

  function onNextClick() {
    closeFeedback(() => {
      if (pendingRetry) { pendingRetry = false; updateTotals(false); return; }
      advanceQuestion();
    });
  }

  // おなじ ねだん・おなじ てもちで もういちど
  function onRetryClick() {
    closeFeedback(() => {
      state.retrying = true;
      renderQuestion();
    });
  }

  function advanceQuestion() {
    state.questionIndex += 1;
    if (state.questionIndex >= QUESTIONS_PER_LEVEL) {
      finishLevel();
    } else {
      generateQuestion();
      renderQuestion();
    }
  }

  // ---------- クリア画面 ----------
  function renderStars(container, stars) {
    container.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const slot = document.createElement('span');
      slot.className = `star ${i < stars ? '' : 'star--empty'}`;
      slot.innerHTML = ART.star();
      container.appendChild(slot);
    }
    if (REDUCE) return;
    const starEls = [...container.children];
    starEls.forEach((el, i) => {
      gsap.fromTo(el, { scale: 0, rotation: -120 }, {
        scale: 1, rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)', delay: 0.35 + i * 0.22,
        onStart: () => {
          if (!el.classList.contains('star--empty')) {
            const c = centerOf(rectOf(el));
            sfx('star', i);
            gsap.delayedCall(0.12, () => sparkleAt(c.x, c.y, 6));
          }
        },
      });
    });
    gsap.to(starEls.filter((el) => !el.classList.contains('star--empty')), {
      y: -6, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.15, delay: 1.3,
    });
  }

  function finishLevel() {
    const mode = currentMode();
    const stars = state.bestCount >= 5 ? 3 : state.bestCount >= 3 ? 2 : 1;
    if (stars > progress[mode.key][state.levelIndex]) {
      progress[mode.key][state.levelIndex] = stars;
      saveProgress();
    }
    const next = () => {
      if (state.levelIndex >= mode.levels.length - 1) showModeClear(stars);
      else showLevelClear(stars);
    };
    if (state.bestCount >= QUESTIONS_PER_LEVEL) showFever(next);
    else next();
  }

  // ---------- フィーバー（ぜんもん せいかい） ----------
  const FEVER_BONUS = 500;
  const FEVER_BADGE = { free: 'おつりマスター！', wallet: 'おさいふ めいじん！' };
  let feverDone = null;
  const feverTweens = [];
  let feverBgmTimer = null;

  function showFever(done) {
    feverDone = done;
    state.score += FEVER_BONUS;
    clearCatTimelines();
    els.feverMascot.innerHTML = ART.cat('happy');
    els.feverBadge.textContent = FEVER_BADGE[state.modeKey] || FEVER_BADGE.free;
    els.feverBonus.textContent = `+${FEVER_BONUS}`;
    els.feverOverlay.classList.add('show');
    document.body.classList.add('is-fever');
    sfx('fever');
    if (window.SFX) feverBgmTimer = setTimeout(() => window.SFX.startFever(), 900);
    if (REDUCE) return;

    const opts = { colors: PARTY_COLORS, disableForReducedMotion: true };
    gsap.timeline()
      .fromTo(els.feverOverlay, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      .fromTo(els.feverTitle, { scale: 4, rotation: -20, opacity: 0 }, { scale: 1, rotation: -4, opacity: 1, duration: 0.5, ease: 'back.out(2.2)' })
      .add(() => { screenFlash(); burst({ ...opts, particleCount: 200, spread: 160, startVelocity: 55, origin: { x: 0.5, y: 0.5 } }); })
      .fromTo(els.feverMascot, { scale: 0, y: 60 }, { scale: 1, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' }, '-=0.1')
      .fromTo('.fever-rank', { opacity: 0 }, { opacity: 1, duration: 0.2 })
      .fromTo(els.feverBadge, { scale: 0, rotation: 30 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.45)' })
      .fromTo('.fever-bonus', { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, '-=0.2')
      .fromTo(els.feverNextBtn, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.4)' });

    // ネコがおどる・タイトルがはねる・紙吹雪とコインが降り続ける
    feverTweens.push(
      gsap.to(els.feverTitle, { scale: 1.08, duration: 0.18, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 0.8 }),
      gsap.to(els.feverMascot, { rotation: 12, duration: 0.18, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1, transformOrigin: '50% 90%' }),
      gsap.to(els.feverMascot, { y: -16, duration: 0.18, yoyo: true, repeat: -1, ease: 'power1.out', delay: 1 }),
      gsap.to(els.feverBadge, { y: -5, duration: 0.36, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.6 }),
      gsap.to({}, { duration: 0.7, repeat: -1, delay: 1, onRepeat: () => {
        const side = Math.random() < 0.5;
        burst({ ...opts, particleCount: 70, angle: side ? 60 : 120, spread: 65, startVelocity: 50, origin: { x: side ? 0 : 1, y: 0.8 } });
      } }),
      gsap.to({}, { duration: 1.3, repeat: -1, delay: 0.6, onRepeat: () => coinRain(14) }),
    );
  }

  function closeFever() {
    if (!feverDone) return;
    clearTimeout(feverBgmTimer);
    if (window.SFX) window.SFX.stopFever();
    feverTweens.forEach((t) => t.kill());
    feverTweens.length = 0;
    gsap.set([els.feverTitle, els.feverMascot, els.feverBadge], { clearProps: 'all' });
    els.feverOverlay.classList.remove('show');
    document.body.classList.remove('is-fever');
    const done = feverDone;
    feverDone = null;
    done();
  }

  function showLevelClear(stars) {
    clearCatTimelines();
    els.clearMascot.innerHTML = ART.cat('happy');
    animateCat(els.clearMascot);
    els.clearedLevel.textContent = currentLevel().no;
    els.clearScore.textContent = '0';
    renderStars(els.clearStars, stars);
    showScreen('screen-levelclear');
    sfx('levelClear');
    celebrate('clear');
    tickNumber(els.clearScore, state.score, 1.1);
    if (!REDUCE) {
      gsap.fromTo(els.clearMascot, { scale: 0.5, y: 30 }, { scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.8)' });
    }
  }

  function showModeClear(stars) {
    els.finalTrophy.innerHTML = ART.trophy();
    els.finalModeName.textContent = currentMode().name;
    els.finalScore.textContent = '0';
    renderStars(els.finalStars, stars);
    showScreen('screen-finalclear');
    sfx('modeClear');
    celebrate('clear');
    tickNumber(els.finalScore, state.score, 1.2);
    if (!REDUCE) {
      gsap.fromTo(els.finalTrophy, { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' });
      gsap.to(els.finalTrophy, { y: -10, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 0.9 });
    }
  }

  // ---------- モード選択 ----------
  function openModes() {
    els.modeList.innerHTML = '';
    MODES.forEach((mode) => {
      const earned = progress[mode.key].reduce((a, b) => a + b, 0);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `mode-card mode-card--${mode.key}`;
      const art = mode.key === 'free'
        ? `<span class="mini-coin mini-coin--a">${ART.coin(100)}</span>
           <span class="mini-coin mini-coin--b">${ART.coin(50)}</span>
           <span class="mini-coin mini-coin--c">${ART.coin(10)}</span>`
        : `${ART.purse()}`;
      card.innerHTML = `
        <span class="mode-card-art mode-card-art--${mode.key}">${art}</span>
        <span class="mode-card-body">
          <span class="mode-card-name">${mode.name}</span>
          <span class="mode-card-desc">${mode.desc}</span>
          <span class="mode-card-progress">${ART.star()}${earned} / ${mode.levels.length * 3}</span>
        </span>`;
      card.onclick = () => { sfx('select'); openLevels(mode.key); };
      els.modeList.appendChild(card);
    });
    showScreen('screen-mode');
    if (!REDUCE) {
      gsap.fromTo(els.modeList.children, { y: 30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.55, stagger: 0.1, ease: 'back.out(1.7)' });
    }
  }

  // ---------- レベル選択 ----------
  function openLevels(modeKey) {
    const mode = getMode(modeKey);
    state.modeKey = modeKey;
    els.levelsTitle.textContent = mode.name;
    els.levelsNote.textContent = mode.note;
    els.levelList.innerHTML = '';

    mode.levels.forEach((level, i) => {
      const unlocked = isUnlocked(modeKey, i);
      const stars = progress[modeKey][i];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `level-card ${unlocked ? '' : 'level-card--locked'}`;
      card.disabled = !unlocked;
      const starMarks = [0, 1, 2]
        .map((n) => `<span class="${n < stars ? '' : 'star--empty'}">${ART.star()}</span>`).join('');
      card.innerHTML = `
        <span class="level-no">${level.no}</span>
        <span class="level-body">
          <span class="level-name">${level.name}</span>
          <span class="level-detail">${level.detail}</span>
        </span>
        ${unlocked ? `<span class="level-stars">${starMarks}</span>` : `<span class="level-lock">${ART.lock()}</span>`}`;
      if (unlocked) card.onclick = () => { sfx('select'); startLevel(modeKey, i); };
      els.levelList.appendChild(card);
    });

    showScreen('screen-levels');
    if (!REDUCE) {
      gsap.fromTo(els.levelList.children, { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' });
    }
  }

  // ---------- ゲーム開始 ----------
  function startLevel(modeKey, levelIndex) {
    state.modeKey = modeKey;
    state.levelIndex = levelIndex;
    state.questionIndex = 0;
    state.score = 0;
    state.combo = 0;
    state.bestCount = 0;
    state.minTrayH = 0;
    state.minWalletH = 0;
    renderComboTier();
    generateQuestion();

    clearCatTimelines();
    els.gameMascot.innerHTML = ART.cat('idle');
    animateCat(els.gameMascot);
    showScreen('screen-game');
    renderQuestion();
    if (!REDUCE) {
      gsap.fromTo('.game-header .hud-item', { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'back.out(2)' });
      gsap.fromTo(els.gameMascot, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
    }
  }

  function initTitle() {
    els.titleMascot.innerHTML = ART.cat('idle');
    animateCat(els.titleMascot);
    if (REDUCE) return;
    const tl = gsap.timeline();
    tl.fromTo(els.titleMascot, { scale: 0, y: 40, rotation: -20 },
      { scale: 1, y: 0, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.6)' })
      .fromTo('.title-line', { scale: 0.3, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(2.2)' }, '-=0.5')
      .fromTo('.game-subtitle', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2')
      .fromTo('#startBtn', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.4)' }, '-=0.15')
      .fromTo('.btn-link', { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.1');

    gsap.to(els.titleMascot, { y: -12, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1 });
    gsap.to('.title-line--1', { rotation: -2.5, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.title-line--2', { rotation: 2.5, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('#startBtn', { scale: 1.05, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2 });
  }

  // ---------- イベント ----------
  els.startBtn.addEventListener('click', () => { sfx('select'); openModes(); });
  els.modeBackBtn.addEventListener('click', () => { sfx('back'); showScreen('screen-title'); });
  els.levelsBackBtn.addEventListener('click', () => { sfx('back'); openModes(); });
  els.gameBackBtn.addEventListener('click', () => { sfx('back'); openLevels(state.modeKey); });
  els.clearToLevelsBtn.addEventListener('click', () => { sfx('select'); openLevels(state.modeKey); });
  els.finalToLevelsBtn.addEventListener('click', () => { sfx('select'); openLevels(state.modeKey); });
  els.finalToModesBtn.addEventListener('click', () => { sfx('select'); openModes(); });
  els.nextLevelBtn.addEventListener('click', () => { sfx('select'); startLevel(state.modeKey, state.levelIndex + 1); });
  els.payBtn.addEventListener('click', submitPayment);
  els.nextBtn.addEventListener('click', () => { sfx('tap'); onNextClick(); });
  els.retryBtn.addEventListener('click', () => { sfx('tap'); onRetryClick(); });
  els.feverNextBtn.addEventListener('click', () => { sfx('select'); closeFever(); });

  // --- コインのタップ処理 ---
  // clickイベントだけに頼ると、スマホでスクロール判定に吸われたときに
  // 押した見た目だけ出て反応しないことがあるため、pointerup で確定させる。
  let pressedCoin = null;
  let pressPoint = null;

  const coinFrom = (target) => (target && target.closest ? target.closest('.coin-btn, .coin-chip') : null);
  // 押し込み感は内側のSVGに適用する（外側はFlipが位置を動かすため）
  const pressCoin = (el) => {
    if (el && !REDUCE) gsap.to(el.querySelector('svg'), { scale: 0.85, duration: 0.09, ease: 'power2.out' });
  };
  const releaseCoin = (el) => {
    if (el && !REDUCE) gsap.to(el.querySelector('svg'), { scale: 1, duration: 0.22, ease: 'back.out(3)' });
  };
  const activateCoin = (el) => {
    if (!el || typeof el.__activate !== 'function') return;
    // 登場アニメーションの途中で動かすと、途中の大きさ・傾きのまま固まってしまうので先に終わらせる
    if (coinIntro && coinIntro.progress() < 1) coinIntro.progress(1);
    el.__activate();
  };

  document.addEventListener('pointerdown', (e) => {
    const coin = coinFrom(e.target);
    if (!coin) return;
    pressedCoin = coin;
    pressPoint = { x: e.clientX, y: e.clientY };
    pressCoin(coin);
  });

  document.addEventListener('pointerup', (e) => {
    const coin = pressedCoin;
    pressedCoin = null;
    releaseCoin(coin);
    if (!coin) return;
    const moved = Math.hypot(e.clientX - pressPoint.x, e.clientY - pressPoint.y);
    if (moved < 20 && coinFrom(e.target) === coin) activateCoin(coin);
  });

  document.addEventListener('pointercancel', () => {
    releaseCoin(pressedCoin);
    pressedCoin = null;
  });

  // キーボード操作（Enter/Space）はclickだけが飛んでくるので拾う
  document.addEventListener('click', (e) => {
    if (e.detail !== 0) return;
    activateCoin(coinFrom(e.target));
  });

  buildSky();
  initTitle();
})();

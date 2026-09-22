(() => {
  'use strict';

  const { gsap, Flip } = window;
  gsap.registerPlugin(window.MotionPathPlugin, Flip);
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = (s) => (REDUCE ? 0.01 : s); // アニメーション時間（低減設定を尊重）

  // ---------- レベル設定 ----------
  const LEVELS = [
    { coins: [10, 50, 100], priceMin: 10, priceMax: 200, priceStep: 10, unlimited: true, questionsPerLevel: 5 },
    { coins: [1, 5, 10, 50, 100], priceMin: 10, priceMax: 200, priceStep: 1, unlimited: true, questionsPerLevel: 5 },
    { coins: [1, 5, 10, 50, 100, 500], priceMin: 100, priceMax: 500, priceStep: 1, unlimited: true, questionsPerLevel: 5 },
    {
      coins: [1, 5, 10, 50, 100, 500], priceMin: 100, priceMax: 500, priceStep: 1, unlimited: false,
      handRange: { 1: [2, 4], 5: [1, 3], 10: [2, 4], 50: [1, 3], 100: [2, 4], 500: [1, 3] },
      questionsPerLevel: 5,
    },
  ];

  const PARTY_COLORS = ['#ff6fa5', '#ffd166', '#5ec8e0', '#6fcf8a', '#b18cf5', '#ffffff'];

  // ---------- お金の計算 ----------
  function greedyCoinCount(amount) {
    const denoms = [500, 100, 50, 10, 5, 1];
    let rem = amount, count = 0;
    for (const d of denoms) { const n = Math.floor(rem / d); count += n; rem -= n * d; }
    return count;
  }

  function canPay(target, hand) {
    let reachable = new Set([0]);
    const entries = Object.entries(hand).map(([k, v]) => [Number(k), v]).sort((a, b) => b[0] - a[0]);
    for (const [coin, count] of entries) {
      if (count <= 0) continue;
      const maxK = count === Infinity ? Math.floor(target / coin) : count;
      const next = new Set(reachable);
      for (const amt of reachable) {
        for (let k = 1; k <= maxK; k++) {
          const na = amt + k * coin;
          if (na > target) break;
          next.add(na);
        }
      }
      reachable = next;
    }
    return reachable.has(target);
  }

  function minChangeCoins(price, hand, unlimited) {
    if (unlimited) return 0;
    const maxCoin = Math.max(...Object.keys(hand).map(Number));
    let best = Infinity;
    for (let T = price; T <= price + maxCoin; T++) {
      if (canPay(T, hand)) {
        const cc = greedyCoinCount(T - price);
        if (cc < best) best = cc;
        if (best === 0) break;
      }
    }
    return best === Infinity ? 0 : best;
  }

  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // ---------- 状態 ----------
  const state = {
    level: 1, questionIndex: 0, score: 0, combo: 0, perfectCount: 0,
    price: 0, product: ART.ITEM_LIST[0], originalHand: {}, busy: false,
  };
  let pendingRetry = false;

  const $ = (id) => document.getElementById(id);
  const els = {
    levelValue: $('levelValue'), questionValue: $('questionValue'), scoreValue: $('scoreValue'),
    comboValue: $('comboValue'), comboItem: $('comboItem'), gameMascot: $('gameMascot'),
    productArt: $('productArt'), productName: $('productName'), priceValue: $('priceValue'),
    totalValue: $('totalValue'), totalDisplay: $('totalDisplay'), wallet: $('selectedCoins'),
    coinTray: $('coinTray'), payBtn: $('payBtn'), feedbackOverlay: $('feedbackOverlay'),
    feedbackCard: $('feedbackCard'), feedbackFace: $('feedbackFace'), feedbackText: $('feedbackText'),
    feedbackSub: $('feedbackSub'), nextBtn: $('nextBtn'), startBtn: $('startBtn'),
    restartBtn: $('restartBtn'), nextLevelBtn: $('nextLevelBtn'), clearedLevel: $('clearedLevel'),
    clearScore: $('clearScore'), clearStars: $('clearStars'), clearMascot: $('clearMascot'),
    finalScore: $('finalScore'), finalTrophy: $('finalTrophy'), titleMascot: $('titleMascot'),
    speechBubble: $('speechBubble'), shopScene: document.querySelector('.shop-scene'),
    fxLayer: $('fxLayer'), skyLayer: $('skyLayer'), app: $('app'),
  };

  const burst = window.confetti.create($('confettiCanvas'), { resize: true, useWorker: true });

  // ---------- 汎用アニメーション ----------
  function rectOf(el) { return el.getBoundingClientRect(); }
  function centerOf(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  function tickNumber(el, to, dur = 0.45) {
    const obj = { v: Number(el.textContent.replace(/[^0-9-]/g, '')) || 0 };
    if (obj.v === to) return;
    gsap.to(obj, {
      v: to, duration: D(dur), ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.v); },
    });
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
    gsap.fromTo(next, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: D(0.38), ease: 'power2.out' });
  }

  // ---------- 出題 ----------
  function randPriceForLevel(level) {
    if (level.priceStep > 1) {
      const steps = Math.floor((level.priceMax - level.priceMin) / level.priceStep);
      return level.priceMin + randInt(0, steps) * level.priceStep;
    }
    return randInt(level.priceMin, level.priceMax);
  }

  function generateQuestion() {
    const level = LEVELS[state.level - 1];
    state.price = randPriceForLevel(level);
    state.product = ART.ITEM_LIST[randInt(0, ART.ITEM_LIST.length - 1)];
    const hand = {};
    level.coins.forEach((v) => {
      hand[v] = level.unlimited ? Infinity : randInt(level.handRange[v][0], level.handRange[v][1]);
    });
    state.originalHand = hand;
  }

  function renderQuestion(animate = true) {
    const level = LEVELS[state.level - 1];
    gsap.killTweensOf(els.productArt);
    gsap.set(els.productArt, { clearProps: 'all' });
    els.productArt.innerHTML = ART.item(state.product.key);
    els.productName.textContent = state.product.name;
    els.levelValue.textContent = state.level;
    els.questionValue.textContent = `${state.questionIndex + 1}/${level.questionsPerLevel}`;
    els.wallet.innerHTML = '';
    renderCoinTray(level);
    updateTotals(false);
    updateHud(false);
    setMood(els.gameMascot, 'idle');

    if (animate && !REDUCE) {
      els.priceValue.textContent = '0';
      const tl = gsap.timeline();
      tl.fromTo(els.speechBubble, { scale: 0.6, opacity: 0, transformOrigin: 'left center' },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.8)' })
        .fromTo(els.productArt, { scale: 0, rotation: -50 },
          { scale: 1, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.55)' }, '-=0.25')
        .add(() => tickNumber(els.priceValue, state.price, 0.5), '-=0.35')
        .fromTo(els.coinTray.querySelectorAll('.coin-btn'),
          { scale: 0, y: 26, rotation: -40 },
          { scale: 1, y: 0, rotation: 0, duration: 0.55, ease: 'back.out(2.2)', stagger: { each: 0.035, from: 'center' } }, '-=0.3')
        .add(() => {
          gsap.to(els.productArt, { y: -5, rotation: 3, duration: 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        });
    } else {
      els.priceValue.textContent = state.price;
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
    Flip.from(flipState, {
      duration: 0.55, ease: 'back.out(1.1)', absolute: true, scale: true,
      onEnter: (e) => gsap.fromTo(e, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' }),
    });
    if (mover) spinInner(mover);
  }

  // 枚数制限あり：コインそのものが財布へ移動
  function selectLimited(el, value) {
    if (state.busy || el.dataset.flying === '1') return;
    el.dataset.flying = '1';
    flipCoins(() => {
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
    flipCoins(() => {
      el.className = `coin-btn coin-${value}`;
      els.coinTray.querySelector(`.coin-group[data-denom="${value}"]`).appendChild(el);
      el.__activate = () => selectLimited(el, value);
    }, el);
    gsap.delayedCall(0.6, () => { el.dataset.flying = '0'; });
    updateTotals();
  }

  // 枚数無制限：トレイのコインは残り、複製が財布へ飛ぶ
  function selectUnlimited(sourceEl, value) {
    if (state.busy) return;
    const startRect = rectOf(sourceEl);
    const siblings = REDUCE ? null : Flip.getState([...els.wallet.children]);

    const chip = makeCoinEl(value, 'coin-chip');
    chip.__activate = () => deselectUnlimited(chip, sourceEl, value);
    els.wallet.appendChild(chip);

    if (siblings) Flip.from(siblings, { duration: 0.4, ease: 'power3.out' });

    if (!REDUCE) {
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

    if (REDUCE) { chip.remove(); updateTotals(); return; }

    const from = rectOf(chip);
    const to = rectOf(sourceEl);
    const siblings = Flip.getState([...els.wallet.children].filter((c) => c !== chip));
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
    const total = getSelectedTotal();
    if (animate && !REDUCE) {
      tickNumber(els.totalValue, total, 0.35);
      popEl(els.totalDisplay, 1.05);
    } else {
      els.totalValue.textContent = total;
    }
    els.payBtn.disabled = total <= 0;
  }

  function updateHud(animate = true) {
    if (animate && !REDUCE) {
      tickNumber(els.scoreValue, state.score, 0.6);
      tickNumber(els.comboValue, state.combo, 0.3);
    } else {
      els.scoreValue.textContent = state.score;
      els.comboValue.textContent = state.combo;
    }
  }

  // ---------- 判定 ----------
  function evaluateAnswer(total) {
    const level = LEVELS[state.level - 1];
    if (total < state.price) return { status: 'insufficient', short: state.price - total };
    const change = total - state.price;
    const changeCoins = greedyCoinCount(change);
    if (changeCoins === 0) return { status: 'perfect', change, changeCoins };
    const minCoins = minChangeCoins(state.price, state.originalHand, level.unlimited);
    if (changeCoins === minCoins) return { status: 'good', change, changeCoins, minCoins };
    return { status: 'close', change, changeCoins, minCoins };
  }

  function payCoinsToShop() {
    const chips = [...els.wallet.children];
    if (!chips.length || REDUCE) { chips.forEach((c) => c.remove()); return Promise.resolve(); }
    const target = centerOf(rectOf(els.gameMascot));
    return new Promise((resolve) => {
      chips.forEach((chip, i) => {
        const from = rectOf(chip);
        detach(chip, from);
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

  function celebrate(level) {
    if (REDUCE) return;
    const opts = { colors: PARTY_COLORS, disableForReducedMotion: true };
    if (level === 'perfect') {
      burst({ ...opts, particleCount: 110, spread: 95, startVelocity: 46, origin: { x: 0.5, y: 0.6 } });
      gsap.delayedCall(0.18, () => burst({ ...opts, particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.75 } }));
      gsap.delayedCall(0.32, () => burst({ ...opts, particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.75 } }));
      coinRain(16);
    } else if (level === 'good') {
      burst({ ...opts, particleCount: 55, spread: 70, startVelocity: 36, origin: { x: 0.5, y: 0.62 } });
    } else if (level === 'clear') {
      burst({ ...opts, particleCount: 130, spread: 110, startVelocity: 50, origin: { x: 0.5, y: 0.65 } });
      gsap.delayedCall(0.4, () => burst({ ...opts, particleCount: 90, spread: 120, origin: { x: 0.5, y: 0.5 } }));
      coinRain(20);
    }
  }

  // ---------- フィードバック ----------
  const FEEDBACK = {
    perfect: { mood: 'happy', title: 'パーフェクト！', sub: 'ぴったり はらえたね！' },
    good: { mood: 'good', title: 'グッド！', sub: '' },
    close: { mood: 'close', title: 'おしい、もうすこし！', sub: '' },
    insufficient: { mood: 'sad', title: 'たりないよ！', sub: '' },
  };

  function showFeedback(result) {
    const conf = FEEDBACK[result.status];
    catReact(els.gameMascot, conf.mood);

    els.feedbackFace.innerHTML = ART.faceBadge(conf.mood);
    els.feedbackText.textContent = conf.title;
    if (result.status === 'insufficient') {
      els.feedbackSub.textContent = `あと ${result.short}えん たりません`;
      els.nextBtn.textContent = 'もういちど';
      pendingRetry = true;
    } else {
      pendingRetry = false;
      els.nextBtn.textContent = 'つぎへ';
      if (result.status === 'perfect') {
        els.feedbackSub.textContent = conf.sub;
        state.score += 100; state.combo += 1; state.perfectCount += 1;
      } else if (result.status === 'good') {
        els.feedbackSub.textContent = `おつりは ${result.change}えん（${result.changeCoins}まい）だよ`;
        state.score += 60; state.combo = 0;
      } else {
        els.feedbackSub.textContent = `おつりが ${result.changeCoins}まいに なったよ\nさいしょうは ${result.minCoins}まい！`;
        state.score += 30; state.combo = 0;
      }
      updateHud();
      if (result.status === 'perfect') { popEl(els.comboItem, 1.25); popEl($('hudScore'), 1.15); }
    }

    els.feedbackOverlay.classList.add('show');
    if (!REDUCE) {
      const tl = gsap.timeline();
      tl.fromTo(els.feedbackOverlay, { opacity: 0 }, { opacity: 1, duration: 0.2 })
        .fromTo(els.feedbackCard, { scale: 0.4, y: 50 }, { scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.1')
        .fromTo(els.feedbackFace, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.65, ease: 'elastic.out(1, 0.5)' }, '-=0.4')
        .fromTo(els.feedbackText, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.4')
        .fromTo(els.feedbackSub, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 }, '-=0.15')
        .fromTo(els.nextBtn, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }, '-=0.1');

      if (result.status === 'perfect') celebrate('perfect');
      else if (result.status === 'good') celebrate('good');
      else shake(els.feedbackCard, 10);
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

  function onNextClick() {
    const close = () => {
      els.feedbackOverlay.classList.remove('show');
      if (pendingRetry) { pendingRetry = false; updateTotals(false); return; }
      advanceQuestion();
    };
    if (REDUCE) { close(); return; }
    gsap.to(els.feedbackCard, {
      scale: 0.7, y: 30, opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => { gsap.set(els.feedbackCard, { clearProps: 'all' }); close(); },
    });
  }

  function advanceQuestion() {
    const level = LEVELS[state.level - 1];
    state.questionIndex += 1;
    if (state.questionIndex >= level.questionsPerLevel) {
      showLevelClear();
    } else {
      generateQuestion();
      renderQuestion();
    }
  }

  // ---------- クリア画面 ----------
  function showLevelClear() {
    const stars = state.perfectCount >= 5 ? 3 : state.perfectCount >= 3 ? 2 : 1;

    if (state.level >= LEVELS.length) {
      els.finalTrophy.innerHTML = ART.trophy();
      els.finalScore.textContent = '0';
      showScreen('screen-finalclear');
      celebrate('clear');
      if (!REDUCE) {
        gsap.fromTo(els.finalTrophy, { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' });
        gsap.to(els.finalTrophy, { y: -10, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 0.9 });
      }
      tickNumber(els.finalScore, state.score, 1.2);
      return;
    }

    clearCatTimelines();
    els.clearMascot.innerHTML = ART.cat('happy');
    animateCat(els.clearMascot);
    els.clearedLevel.textContent = state.level;
    els.clearScore.textContent = '0';
    els.clearStars.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const slot = document.createElement('span');
      slot.className = `star ${i < stars ? '' : 'star--empty'}`;
      slot.innerHTML = ART.star();
      els.clearStars.appendChild(slot);
    }
    showScreen('screen-levelclear');
    celebrate('clear');
    tickNumber(els.clearScore, state.score, 1.1);

    if (!REDUCE) {
      gsap.fromTo(els.clearMascot, { scale: 0.5, y: 30 }, { scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.8)' });
      const starEls = [...els.clearStars.children];
      starEls.forEach((s, i) => {
        gsap.fromTo(s, { scale: 0, rotation: -120 }, {
          scale: 1, rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)', delay: 0.35 + i * 0.22,
          onStart: () => {
            if (!s.classList.contains('star--empty')) {
              const c = centerOf(rectOf(s));
              gsap.delayedCall(0.12, () => sparkleAt(c.x, c.y, 6));
            }
          },
        });
      });
      gsap.to(starEls.filter((s) => !s.classList.contains('star--empty')), {
        y: -6, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.15, delay: 1.3,
      });
    }
  }

  // ---------- 起動 ----------
  function startGameScreen() {
    clearCatTimelines();
    els.gameMascot.innerHTML = ART.cat('idle');
    animateCat(els.gameMascot);
    renderQuestion();
    showScreen('screen-game');
    if (!REDUCE) {
      gsap.fromTo('.game-header .hud-item', { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'back.out(2)' });
      gsap.fromTo(els.gameMascot, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
    }
  }

  function resetGameState() {
    state.level = 1; state.questionIndex = 0; state.score = 0; state.combo = 0; state.perfectCount = 0;
    generateQuestion();
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
  els.startBtn.addEventListener('click', () => { resetGameState(); startGameScreen(); });
  els.restartBtn.addEventListener('click', () => { resetGameState(); startGameScreen(); });
  els.nextLevelBtn.addEventListener('click', () => {
    state.level += 1; state.questionIndex = 0; state.perfectCount = 0;
    generateQuestion(); startGameScreen();
  });
  els.payBtn.addEventListener('click', submitPayment);
  els.nextBtn.addEventListener('click', onNextClick);

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
    if (el && typeof el.__activate === 'function') el.__activate();
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

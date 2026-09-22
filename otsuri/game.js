(() => {
  'use strict';

  // ---------- Level config ----------
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

  const PRODUCTS = [
    { emoji: '🍎', name: 'りんご' }, { emoji: '🍌', name: 'バナナ' }, { emoji: '🍙', name: 'おにぎり' },
    { emoji: '🍭', name: 'あめ' }, { emoji: '🧃', name: 'ジュース' }, { emoji: '📓', name: 'ノート' },
    { emoji: '✏️', name: 'えんぴつ' }, { emoji: '🧽', name: 'けしゴム' }, { emoji: '🍞', name: 'パン' },
    { emoji: '🍰', name: 'ケーキ' }, { emoji: '🎈', name: 'ふうせん' }, { emoji: '🧸', name: 'ぬいぐるみ' },
    { emoji: '⚽', name: 'ボール' }, { emoji: '🍦', name: 'アイス' }, { emoji: '🍫', name: 'チョコ' },
  ];

  // ---------- Money helpers ----------
  function greedyCoinCount(amount) {
    const denoms = [500, 100, 50, 10, 5, 1];
    let rem = amount, count = 0;
    for (const d of denoms) {
      const n = Math.floor(rem / d);
      count += n;
      rem -= n * d;
    }
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

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ---------- State ----------
  const state = {
    level: 1,
    questionIndex: 0,
    score: 0,
    combo: 0,
    perfectCount: 0,
    price: 0,
    product: PRODUCTS[0],
    originalHand: {},
  };
  let pendingRetry = false;

  // ---------- DOM refs ----------
  const $ = (id) => document.getElementById(id);
  const els = {
    levelValue: $('levelValue'),
    questionValue: $('questionValue'),
    scoreValue: $('scoreValue'),
    comboValue: $('comboValue'),
    comboItem: $('comboItem'),
    gameMascot: $('gameMascot'),
    productEmoji: $('productEmoji'),
    productName: $('productName'),
    priceValue: $('priceValue'),
    totalValue: $('totalValue'),
    selectedCoins: $('selectedCoins'),
    coinTray: $('coinTray'),
    payBtn: $('payBtn'),
    feedbackOverlay: $('feedbackOverlay'),
    feedbackFace: $('feedbackFace'),
    feedbackText: $('feedbackText'),
    feedbackSub: $('feedbackSub'),
    nextBtn: $('nextBtn'),
    confettiLayer: $('confettiLayer'),
    startBtn: $('startBtn'),
    restartBtn: $('restartBtn'),
    nextLevelBtn: $('nextLevelBtn'),
    clearedLevel: $('clearedLevel'),
    clearScore: $('clearScore'),
    clearStars: $('clearStars'),
    finalScore: $('finalScore'),
  };

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  // ---------- Question generation ----------
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
    state.product = PRODUCTS[randInt(0, PRODUCTS.length - 1)];

    const hand = {};
    level.coins.forEach((v) => {
      if (level.unlimited) {
        hand[v] = Infinity;
      } else {
        const [lo, hi] = level.handRange[v];
        hand[v] = randInt(lo, hi);
      }
    });
    state.originalHand = hand;
  }

  function renderQuestion() {
    const level = LEVELS[state.level - 1];
    els.productEmoji.textContent = state.product.emoji;
    els.productName.textContent = state.product.name;
    els.priceValue.textContent = state.price;
    els.levelValue.textContent = state.level;
    els.questionValue.textContent = `${state.questionIndex + 1}/${level.questionsPerLevel}`;
    els.gameMascot.classList.remove('mood-happy', 'mood-good', 'mood-close', 'mood-sad');
    updateHud();
    els.selectedCoins.innerHTML = '';
    renderCoinTray(level);
    updateTotals();
  }

  // ---------- FLIP animation helper ----------
  // Runs `mutate` (a DOM change, e.g. reparenting + restyling `el`), then
  // smoothly animates `el` from its pre-mutation position/size to the new one.
  function flipMove(el, mutate) {
    const first = el.getBoundingClientRect();
    mutate();
    const last = el.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = first.width / last.width;
    const sy = first.height / last.height;
    el.style.transition = 'none';
    el.style.transformOrigin = 'top left';
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.38s cubic-bezier(.34,1.56,.64,1)';
        el.style.transform = 'none';
      });
    });
    el.addEventListener('transitionend', () => {
      el.style.transition = '';
      el.style.transform = '';
      el.style.transformOrigin = '';
    }, { once: true });
  }

  function animateNewChipFrom(chip, startRect) {
    const endRect = chip.getBoundingClientRect();
    const dx = startRect.left - endRect.left;
    const dy = startRect.top - endRect.top;
    const sx = startRect.width / endRect.width;
    const sy = startRect.height / endRect.height;
    chip.style.transition = 'none';
    chip.style.transformOrigin = 'top left';
    chip.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chip.style.transition = 'transform 0.38s cubic-bezier(.34,1.56,.64,1)';
        chip.style.transform = 'none';
      });
    });
  }

  function animateChipToRectThenRemove(chip, targetRect) {
    chip.style.transition = 'transform 0.3s ease-in';
    chip.style.transformOrigin = 'top left';
    const startRect = chip.getBoundingClientRect();
    const dx = targetRect.left - startRect.left;
    const dy = targetRect.top - startRect.top;
    const sx = targetRect.width / startRect.width;
    const sy = targetRect.height / startRect.height;
    chip.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    chip.addEventListener('transitionend', () => chip.remove(), { once: true });
  }

  // ---------- Coin UI ----------
  function createCoinFace(value, withHole) {
    const frag = document.createDocumentFragment();
    if (withHole && (value === 5 || value === 50)) {
      const hole = document.createElement('span');
      hole.className = 'coin-hole';
      frag.appendChild(hole);
    }
    const label = document.createElement('span');
    label.className = 'coin-value';
    label.textContent = value;
    frag.appendChild(label);
    return frag;
  }

  function renderCoinTray(level) {
    els.coinTray.innerHTML = '';

    level.coins.forEach((value) => {
      if (level.unlimited) {
        const source = document.createElement('button');
        source.type = 'button';
        source.className = `coin-btn coin-${value}`;
        source.appendChild(createCoinFace(value, true));
        source.addEventListener('click', () => selectUnlimitedCoin(source, value));
        els.coinTray.appendChild(source);
      } else {
        const group = document.createElement('span');
        group.className = 'coin-group';
        group.dataset.denom = value;
        els.coinTray.appendChild(group);
        const count = state.originalHand[value];
        for (let i = 0; i < count; i++) {
          group.appendChild(createLimitedCoin(value));
        }
      }
    });
  }

  function createLimitedCoin(value) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `coin-btn coin-${value}`;
    el.appendChild(createCoinFace(value, true));
    el.dataset.value = value;
    el.onclick = () => selectLimitedCoin(el, value);
    return el;
  }

  function selectLimitedCoin(el, value) {
    if (el.dataset.flipping === 'true') return;
    el.dataset.flipping = 'true';
    flipMove(el, () => {
      el.className = `coin-chip coin-${value}`;
      els.selectedCoins.appendChild(el);
      el.onclick = () => deselectLimitedCoin(el, value);
    });
    setTimeout(() => { el.dataset.flipping = 'false'; }, 400);
    updateTotals();
  }

  function deselectLimitedCoin(el, value) {
    if (el.dataset.flipping === 'true') return;
    el.dataset.flipping = 'true';
    flipMove(el, () => {
      el.className = `coin-btn coin-${value}`;
      const group = els.coinTray.querySelector(`.coin-group[data-denom="${value}"]`);
      group.appendChild(el);
      el.onclick = () => selectLimitedCoin(el, value);
    });
    setTimeout(() => { el.dataset.flipping = 'false'; }, 400);
    updateTotals();
  }

  function selectUnlimitedCoin(sourceBtn, value) {
    const startRect = sourceBtn.getBoundingClientRect();
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `coin-chip coin-${value}`;
    chip.dataset.value = value;
    chip.textContent = value;
    chip.addEventListener('click', () => deselectUnlimitedCoin(chip, sourceBtn));
    els.selectedCoins.appendChild(chip);
    animateNewChipFrom(chip, startRect);
    updateTotals();
  }

  function deselectUnlimitedCoin(chip, sourceBtn) {
    if (chip.dataset.removing === 'true') return;
    chip.dataset.removing = 'true';
    const targetRect = sourceBtn.getBoundingClientRect();
    animateChipToRectThenRemove(chip, targetRect);
    updateTotals();
  }

  function getSelectedTotal() {
    return Array.from(els.selectedCoins.children)
      .filter((el) => el.dataset.removing !== 'true')
      .reduce((sum, el) => sum + Number(el.dataset.value), 0);
  }

  function updateTotals() {
    const total = getSelectedTotal();
    els.totalValue.textContent = total;
    els.payBtn.disabled = total <= 0;
  }

  // ---------- Evaluation ----------
  function evaluateAnswer() {
    const level = LEVELS[state.level - 1];
    const total = getSelectedTotal();
    if (total < state.price) {
      return { status: 'insufficient', short: state.price - total };
    }
    const change = total - state.price;
    const changeCoins = greedyCoinCount(change);
    if (changeCoins === 0) return { status: 'perfect', change, changeCoins };
    const minCoins = minChangeCoins(state.price, state.originalHand, level.unlimited);
    if (changeCoins === minCoins) return { status: 'good', change, changeCoins, minCoins };
    return { status: 'close', change, changeCoins, minCoins };
  }

  function updateHud() {
    els.scoreValue.textContent = state.score;
    els.comboValue.textContent = state.combo;
  }

  function bumpCombo() {
    els.comboItem.classList.remove('combo-active');
    void els.comboItem.offsetWidth;
    els.comboItem.classList.add('combo-active');
  }

  function launchConfetti(count = 28) {
    const colors = ['#ff6fa5', '#ffd166', '#4dd0e1', '#6fcf7f', '#b18cf5'];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      const duration = 1 + Math.random() * 1.2;
      piece.style.animationDuration = `${duration}s`;
      piece.style.animationDelay = `${Math.random() * 0.3}s`;
      els.confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), (duration + 0.4) * 1000);
    }
  }

  function flyCoins() {
    const scoreRect = els.scoreValue.getBoundingClientRect();
    const panelRect = els.totalValue.getBoundingClientRect();
    for (let i = 0; i < 3; i++) {
      const coin = document.createElement('div');
      coin.className = 'coin-fly';
      coin.textContent = '🪙';
      coin.style.left = `${panelRect.left}px`;
      coin.style.top = `${panelRect.top}px`;
      coin.style.setProperty('--fly-x', `${scoreRect.left - panelRect.left}px`);
      coin.style.setProperty('--fly-y', `${scoreRect.top - panelRect.top}px`);
      coin.style.animationDelay = `${i * 0.08}s`;
      document.body.appendChild(coin);
      setTimeout(() => coin.remove(), 900 + i * 80);
    }
  }

  // ---------- Feedback ----------
  function showFeedback(result) {
    els.gameMascot.classList.remove('mood-happy', 'mood-good', 'mood-close', 'mood-sad');

    if (result.status === 'insufficient') {
      els.feedbackFace.textContent = '😟';
      els.feedbackText.textContent = 'たりないよ！';
      els.feedbackSub.textContent = `あと ${result.short}えん たりません`;
      els.gameMascot.classList.add('mood-sad');
      els.nextBtn.textContent = 'もういちど';
      pendingRetry = true;
      els.feedbackOverlay.classList.add('show');
      return;
    }

    pendingRetry = false;
    els.nextBtn.textContent = 'つぎへ ▶';

    if (result.status === 'perfect') {
      els.feedbackFace.textContent = '🤩';
      els.feedbackText.textContent = 'パーフェクト！';
      els.feedbackSub.textContent = 'ぴったり はらえたね！';
      els.gameMascot.classList.add('mood-happy');
      state.score += 100;
      state.combo += 1;
      state.perfectCount += 1;
      launchConfetti(30);
      flyCoins();
      bumpCombo();
    } else if (result.status === 'good') {
      els.feedbackFace.textContent = '😊';
      els.feedbackText.textContent = 'グッド！';
      els.feedbackSub.textContent = `おつりは ${result.change}えん（${result.changeCoins}まい）だよ`;
      els.gameMascot.classList.add('mood-good');
      state.score += 60;
      state.combo = 0;
      launchConfetti(14);
    } else {
      els.feedbackFace.textContent = '😅';
      els.feedbackText.textContent = 'おしい、もうすこし！';
      els.feedbackSub.textContent = `おつりが ${result.changeCoins}まいに なったよ（さいしょうは ${result.minCoins}まい）`;
      els.gameMascot.classList.add('mood-close');
      state.score += 30;
      state.combo = 0;
    }

    updateHud();
    els.feedbackOverlay.classList.add('show');
  }

  function onNextClick() {
    els.feedbackOverlay.classList.remove('show');
    if (pendingRetry) {
      pendingRetry = false;
      return;
    }
    advanceQuestion();
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

  function showLevelClear() {
    const stars = state.perfectCount >= 5 ? 3 : state.perfectCount >= 3 ? 2 : 1;
    els.clearedLevel.textContent = state.level;
    els.clearScore.textContent = state.score;
    const starEls = els.clearStars.querySelectorAll('.star');
    starEls.forEach((el, i) => {
      el.classList.remove('earned');
      void el.offsetWidth;
      if (i < stars) el.classList.add('earned');
    });

    if (state.level >= LEVELS.length) {
      els.finalScore.textContent = state.score;
      showScreen('screen-finalclear');
    } else {
      showScreen('screen-levelclear');
    }
  }

  function resetGameState() {
    state.level = 1;
    state.questionIndex = 0;
    state.score = 0;
    state.combo = 0;
    state.perfectCount = 0;
    generateQuestion();
  }

  // ---------- Events ----------
  els.startBtn.addEventListener('click', () => {
    resetGameState();
    renderQuestion();
    showScreen('screen-game');
  });

  els.restartBtn.addEventListener('click', () => {
    resetGameState();
    renderQuestion();
    showScreen('screen-game');
  });

  els.nextLevelBtn.addEventListener('click', () => {
    state.level += 1;
    state.questionIndex = 0;
    state.perfectCount = 0;
    generateQuestion();
    renderQuestion();
    showScreen('screen-game');
  });

  els.payBtn.addEventListener('click', () => {
    const result = evaluateAnswer();
    showFeedback(result);
  });

  els.nextBtn.addEventListener('click', onNextClick);
})();

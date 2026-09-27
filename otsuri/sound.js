/* 効果音。音声ファイルは使わず Web Audio API で合成する。 */
window.SFX = (() => {
  const MUTE_KEY = 'otsuri-muted-v1';

  let ctx = null;
  let master = null;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* 使えなくても続行 */ }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  // ---- 音の部品 ----
  function tone({ freq = 880, to = 0, dur = 0.12, type = 'triangle', vol = 0.3, attack = 0.006, when = 0 }) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function noiseBurst({ dur = 0.05, vol = 0.12, freq = 3200, q = 1.2, when = 0 }) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // 金属的な「チャリン」
  function clink({ when = 0, vol = 0.2, base = 2450 } = {}) {
    [[1, 0.09], [1.47, 0.07], [2.11, 0.05]].forEach(([ratio, dur], i) => {
      tone({ freq: base * ratio, dur, type: 'sine', vol: vol * (0.75 - i * 0.2), attack: 0.001, when });
    });
    noiseBurst({ dur: 0.035, vol: vol * 0.4, freq: base * 1.4, when });
  }

  const semi = (f, n) => f * Math.pow(2, n / 12);

  const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.7, E6: 1318.5, G6: 1568 };

  // ---- 効果音 ----
  const SOUNDS = {
    tap() { tone({ freq: 660, to: 880, dur: 0.06, type: 'sine', vol: 0.16, when: 0 }); },
    select() { tone({ freq: 700, to: 1180, dur: 0.1, type: 'triangle', vol: 0.2 }); },
    back() { tone({ freq: 700, to: 420, dur: 0.1, type: 'triangle', vol: 0.16 }); },
    coinUp() {
      tone({ freq: 680, to: 1240, dur: 0.11, type: 'triangle', vol: 0.2 });
      clink({ when: 0.05, vol: 0.16 });
    },
    coinDown() {
      tone({ freq: 1000, to: 520, dur: 0.11, type: 'triangle', vol: 0.16 });
      clink({ when: 0.05, vol: 0.1, base: 2100 });
    },
    pay() {
      [0, 0.07, 0.14].forEach((w, i) => clink({ when: w, vol: 0.18, base: 2300 + i * 260 }));
      tone({ freq: 520, to: 1040, dur: 0.22, type: 'sine', vol: 0.12, when: 0.02 });
    },
    question() { tone({ freq: 880, to: 1170, dur: 0.14, type: 'sine', vol: 0.14 }); },
    // combo が増えるほど音程が上がり、音も厚くなる
    perfect(combo = 1) {
      const up = Math.min(Math.max(combo - 1, 0), 5) * 2;
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => {
        tone({ freq: semi(f, up), dur: 0.3, type: 'triangle', vol: 0.22, when: i * 0.075 });
        tone({ freq: semi(f * 2, up), dur: 0.22, type: 'sine', vol: 0.09, when: i * 0.075 });
      });
      tone({ freq: semi(NOTE.E6, up), dur: 0.5, type: 'sine', vol: 0.12, when: 0.32 });
      if (combo >= 3) {
        tone({ freq: semi(NOTE.C5 / 2, up), dur: 0.5, type: 'square', vol: 0.06, when: 0.3 });
        [NOTE.G6, NOTE.C6 * 2].forEach((f, i) => tone({ freq: semi(f, up), dur: 0.18, type: 'sine', vol: 0.07, when: 0.4 + i * 0.06 }));
      }
      if (combo >= 4) noiseBurst({ dur: 0.35, vol: 0.06, freq: 7000, q: 0.8, when: 0.3 });
    },
    good(combo = 1) {
      const up = Math.min(Math.max(combo - 1, 0), 5) * 2;
      tone({ freq: semi(NOTE.E5, up), dur: 0.16, type: 'triangle', vol: 0.2 });
      tone({ freq: semi(NOTE.A5, up), dur: 0.28, type: 'triangle', vol: 0.2, when: 0.1 });
      tone({ freq: semi(NOTE.A5 * 2, up), dur: 0.2, type: 'sine', vol: 0.07, when: 0.1 });
    },
    // コンボ段階が上がったときのファンファーレ
    comboUp(tier = 1) {
      tone({ freq: 400, to: 1600 + tier * 300, dur: 0.35, type: 'sawtooth', vol: 0.05 });
      const base = semi(NOTE.C5, tier * 2);
      [0, 4, 7, 12, 16].slice(0, 3 + tier).forEach((n, i) => {
        tone({ freq: semi(base, n), dur: 0.26, type: 'square', vol: 0.06, when: 0.18 + i * 0.06 });
        tone({ freq: semi(base * 2, n), dur: 0.3, type: 'triangle', vol: 0.12, when: 0.18 + i * 0.06 });
      });
    },
    // スコアにコインが入るたびの「チャリン」。n 枚目ほど高くなる
    dopa(n = 0) { clink({ vol: 0.13, base: 2200 + Math.min(n, 14) * 90 }); },
    flash() {
      noiseBurst({ dur: 0.3, vol: 0.14, freq: 1800, q: 0.6 });
      tone({ freq: 1600, to: 300, dur: 0.3, type: 'sine', vol: 0.08 });
    },
    fever() {
      [0, 0.1, 0.2, 0.3].forEach((w, i) => tone({ freq: semi(NOTE.C5, i * 4), dur: 0.14, type: 'square', vol: 0.08, when: w }));
      [NOTE.C6, NOTE.E6, NOTE.G6].forEach((f) => tone({ freq: f, dur: 0.8, type: 'triangle', vol: 0.12, when: 0.42 }));
      noiseBurst({ dur: 0.6, vol: 0.08, freq: 5000, q: 0.5, when: 0.42 });
    },
    close() {
      tone({ freq: 520, dur: 0.14, type: 'triangle', vol: 0.16 });
      tone({ freq: 415, dur: 0.22, type: 'triangle', vol: 0.15, when: 0.12 });
    },
    miss() {
      tone({ freq: 300, to: 200, dur: 0.18, type: 'square', vol: 0.1 });
      tone({ freq: 150, to: 100, dur: 0.2, type: 'sine', vol: 0.12, when: 0.02 });
    },
    star(index = 0) {
      const f = [NOTE.C6, NOTE.E6, NOTE.G6][Math.min(index, 2)];
      tone({ freq: f, dur: 0.3, type: 'sine', vol: 0.2 });
      tone({ freq: f * 1.5, dur: 0.2, type: 'sine', vol: 0.08, when: 0.03 });
      noiseBurst({ dur: 0.12, vol: 0.05, freq: 6000, q: 2, when: 0.01 });
    },
    levelClear() {
      [[NOTE.C5, 0], [NOTE.E5, 0.12], [NOTE.G5, 0.24], [NOTE.C6, 0.36]].forEach(([f, w]) => {
        tone({ freq: f, dur: 0.34, type: 'triangle', vol: 0.2, when: w });
      });
    },
    modeClear() {
      [[NOTE.G5, 0], [NOTE.C6, 0.14], [NOTE.E6, 0.28], [NOTE.G6, 0.42]].forEach(([f, w]) => {
        tone({ freq: f, dur: 0.4, type: 'triangle', vol: 0.2, when: w });
        tone({ freq: f / 2, dur: 0.4, type: 'sine', vol: 0.1, when: w });
      });
      [NOTE.C6, NOTE.E6, NOTE.G6].forEach((f) => tone({ freq: f, dur: 0.9, type: 'triangle', vol: 0.13, when: 0.6 }));
    },
  };

  // ---- フィーバーBGM（ループ） ----
  // 先読みスケジューラで16分音符を並べる。テンポは速め。
  const FEVER_STEP = 60 / 168 / 4;
  const FEVER_BASS = [0, 0, 12, 0, 5, 5, 17, 5, 7, 7, 19, 7, 5, 5, 17, 5];
  const FEVER_LEAD = [0, 4, 7, 12, 16, 12, 7, 4, 5, 9, 12, 17, 19, 17, 12, 9];
  let feverTimer = null;
  let feverNext = 0;
  let feverStepNo = 0;

  function feverTick() {
    if (!ctx) return;
    while (feverNext < ctx.currentTime + 0.2) {
      const when = Math.max(0, feverNext - ctx.currentTime);
      const i = feverStepNo % 16;
      const bar = Math.floor(feverStepNo / 16) % 2;
      tone({ freq: semi(NOTE.C5 / 4, FEVER_BASS[i] + bar * 2), dur: FEVER_STEP * 0.9, type: 'square', vol: 0.05, when });
      tone({ freq: semi(NOTE.C5, FEVER_LEAD[i] + bar * 2), dur: FEVER_STEP * 0.8, type: 'triangle', vol: 0.08, when });
      if (i % 4 === 0) tone({ freq: 140, to: 45, dur: 0.12, type: 'sine', vol: 0.22, when });
      if (i % 2 === 1) noiseBurst({ dur: 0.03, vol: 0.05, freq: 8000, q: 1, when });
      if (i % 8 === 4) noiseBurst({ dur: 0.1, vol: 0.09, freq: 1800, q: 0.7, when });
      feverNext += FEVER_STEP;
      feverStepNo += 1;
    }
  }

  function startFever() {
    stopFever();
    if (muted || !ensure()) return;
    feverNext = ctx.currentTime + 0.05;
    feverStepNo = 0;
    feverTick();
    feverTimer = setInterval(feverTick, 50);
  }

  function stopFever() {
    if (feverTimer) clearInterval(feverTimer);
    feverTimer = null;
  }

  function play(name, arg) {
    if (muted) return;
    const fn = SOUNDS[name];
    if (!fn) return;
    try { fn(arg); } catch (e) { /* 音が出せなくてもゲームは続行 */ }
  }

  function unlock() { if (!muted) ensure(); }

  function setMuted(next) {
    muted = !!next;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* 保存できなくても続行 */ }
    if (!muted) ensure();
    else stopFever();
    return muted;
  }

  return { play, unlock, setMuted, isMuted: () => muted, startFever, stopFever };
})();

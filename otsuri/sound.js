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
    perfect() {
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => {
        tone({ freq: f, dur: 0.3, type: 'triangle', vol: 0.22, when: i * 0.075 });
        tone({ freq: f * 2, dur: 0.22, type: 'sine', vol: 0.09, when: i * 0.075 });
      });
      tone({ freq: NOTE.E6, dur: 0.5, type: 'sine', vol: 0.12, when: 0.32 });
    },
    good() {
      tone({ freq: NOTE.E5, dur: 0.16, type: 'triangle', vol: 0.2 });
      tone({ freq: NOTE.A5, dur: 0.28, type: 'triangle', vol: 0.2, when: 0.1 });
      tone({ freq: NOTE.A5 * 2, dur: 0.2, type: 'sine', vol: 0.07, when: 0.1 });
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
    return muted;
  }

  return { play, unlock, setMuted, isMuted: () => muted };
})();

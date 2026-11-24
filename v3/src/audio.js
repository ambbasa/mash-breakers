// Zero-dependency Retro Arcade Web Audio Synthesizer
window.MB = window.MB || {};

(function () {
  let ctx = null;
  let muted = false;

  function ensureCtx() {
    if (muted) return null;
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
    }
    gain.gain.setValueAtTime(vol || 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  function noise(dur, vol, filterFreq) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime;
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(filterFreq || 800, now);
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol || 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start(now);
  }

  const Audio = {
    isMuted: () => muted,
    toggleMute() {
      muted = !muted;
      return muted;
    },
    unlock() {
      ensureCtx();
    },
    uiMove() {
      tone(520, 0.05, "square", 0.08, 660);
    },
    uiConfirm() {
      tone(523, 0.07, "square", 0.12);
      setTimeout(() => tone(784, 0.12, "square", 0.12), 60);
    },
    countdown(isGo) {
      if (isGo) {
        tone(880, 0.22, "sawtooth", 0.18, 1320);
      } else {
        tone(440, 0.12, "square", 0.13);
      }
    },
    mash(ratio) {
      const pitch = 190 + Math.min(1, ratio || 0) * 340;
      tone(pitch, 0.045, "square", 0.09, pitch * 1.18);
    },
    boost() {
      tone(320, 0.18, "sawtooth", 0.16, 1240);
      noise(0.16, 0.14, 1800);
    },
    megaMash() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((n, i) => {
        setTimeout(() => tone(n, 0.11, "sawtooth", 0.14), i * 45);
      });
    },
    impactHeavy() {
      tone(150, 0.28, "sawtooth", 0.24, 32);
      noise(0.32, 0.28, 420);
    },
    impactMedium() {
      tone(220, 0.14, "triangle", 0.18, 60);
      noise(0.14, 0.16, 900);
    },
    screech() {
      tone(980, 0.09, "sawtooth", 0.06, 720);
      noise(0.08, 0.07, 2400);
    },
    win() {
      const notes = [523, 659, 784, 1046, 784, 1046];
      const times = [0, 80, 160, 240, 360, 440];
      notes.forEach((n, i) => {
        setTimeout(() => tone(n, i === 5 ? 0.35 : 0.1, "square", 0.13), times[i]);
      });
    },
    fail() {
      tone(300, 0.18, "sawtooth", 0.15, 220);
      setTimeout(() => tone(210, 0.32, "sawtooth", 0.15, 110), 170);
    },
  };

  window.MB.Audio = Audio;
})();

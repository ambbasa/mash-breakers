// MASH BREAKERS V4 — 90s Arcade Breakbeat Synth BGM + Web Audio SFX + Announcer Voice
window.MB = window.MB || {};

(function () {
  let ctx = null;
  let sfxMuted = false;
  let bgmMuted = false;
  let bgmTimer = null;
  let bgmMode = "none"; // none | menu | race | fever
  let stepIdx = 0;

  function ensureCtx() {
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

  function tone(freq, dur, type, vol, slideTo, bypassSfxMute) {
    if (!bypassSfxMute && sfxMuted) return;
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

  function noise(dur, vol, filterFreq, bypassSfxMute) {
    if (!bypassSfxMute && sfxMuted) return;
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

  // 90s Namco Breakbeat / FM-Synth Arcade BGM Sequencer
  const MENU_BASS = [110, 0, 110, 130.8, 146.8, 0, 164.8, 146.8, 110, 0, 110, 130.8, 196, 164.8, 146.8, 130.8];
  const MENU_LEAD = [440, 0, 523.3, 0, 587.3, 659.3, 0, 587.3, 523.3, 0, 440, 0, 392, 440, 523.3, 0];

  const RACE_BASS = [146.8, 146.8, 220, 146.8, 174.6, 174.6, 261.6, 174.6, 196, 196, 293.7, 196, 164.8, 196, 220, 261.6];
  const RACE_LEAD = [587.3, 0, 698.5, 587.3, 880, 0, 784, 698.5, 659.3, 784, 880, 0, 1046.5, 880, 784, 698.5];

  function tickBgm() {
    if (bgmMuted || bgmMode === "none") return;
    const c = ensureCtx();
    if (!c || c.state !== "running") return;

    const s = stepIdx % 16;
    const isFever = bgmMode === "fever";
    const isMenu = bgmMode === "menu";
    const bassArr = isMenu ? MENU_BASS : RACE_BASS;
    const leadArr = isMenu ? MENU_LEAD : RACE_LEAD;
    const vol = isMenu ? 0.045 : isFever ? 0.068 : 0.056;

    // Breakbeat Kick on 0, 6, 10 (classic 90s arcade breakbeat!)
    if (s === 0 || s === 6 || s === 10 || (isFever && s === 14)) {
      tone(140, 0.09, "sine", vol * 2.1, 38, true);
    }
    // Crisp Snare on 4, 12
    if (s === 4 || s === 12) {
      noise(0.085, vol * 1.4, 1900, true);
      tone(210, 0.05, "triangle", vol * 0.9, 110, true);
    }
    // Syncopated Hi-hat
    if (s % 2 === 1 || isFever) {
      noise(0.028, vol * 0.45, 7200, true);
    }

    // Punchy FM-style Bass
    const bf = bassArr[s];
    if (bf > 0) {
      tone(bf * (isFever ? 1.122 : 1.0), 0.11, "sawtooth", vol * 1.05, bf * 0.98, true);
    }

    // Energetic Arcade Synth Lead
    const lf = leadArr[s];
    if (lf > 0 && (!isMenu || s % 2 === 0)) {
      tone(lf * (isFever ? 1.122 : 1.0), 0.1, isFever ? "sawtooth" : "square", vol * 0.72, null, true);
    }

    stepIdx = (stepIdx + 1) % 16;
  }

  function startBgmLoop(mode) {
    if (bgmMode === mode && bgmTimer) return;
    bgmMode = mode;
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
    if (mode === "none") return;
    const stepMs = mode === "fever" ? 102 : mode === "race" ? 118 : 145;
    bgmTimer = setInterval(tickBgm, stepMs);
  }

  // Arcade Announcer Voice Callouts (Web Speech API, non-blocking)
  function announce(phrase) {
    if (sfxMuted) return;
    try {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(phrase);
        u.lang = "en-US";
        u.rate = 1.28;
        u.pitch = 1.15;
        u.volume = 0.85;
        window.speechSynthesis.speak(u);
      }
    } catch (_) {}
  }

  const Audio = {
    isMuted: () => sfxMuted,
    isBgmMuted: () => bgmMuted,
    toggleMute() {
      sfxMuted = !sfxMuted;
      return sfxMuted;
    },
    toggleBgm() {
      bgmMuted = !bgmMuted;
      return bgmMuted;
    },
    setBgm(mode) {
      startBgmLoop(mode);
    },
    unlock() {
      ensureCtx();
      if (bgmMode === "none") startBgmLoop("menu");
    },
    announce,
    uiMove() {
      tone(540, 0.05, "square", 0.08, 680);
    },
    uiConfirm() {
      tone(523, 0.07, "square", 0.12);
      setTimeout(() => tone(784, 0.12, "square", 0.12), 55);
    },
    countdown(isGo) {
      if (isGo) {
        tone(880, 0.24, "sawtooth", 0.18, 1320);
        announce("Go!");
      } else {
        tone(440, 0.12, "square", 0.13);
      }
    },
    mash(ratio) {
      const pitch = 195 + Math.min(1, ratio || 0) * 360;
      tone(pitch, 0.045, "square", 0.09, pitch * 1.18);
    },
    boost() {
      tone(320, 0.18, "sawtooth", 0.16, 1280);
      noise(0.16, 0.15, 1900);
      announce("Sonic Boom!");
    },
    megaMash() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((n, i) => {
        setTimeout(() => tone(n, 0.11, "sawtooth", 0.14), i * 42);
      });
      announce("Mega Mash!");
    },
    impactHeavy() {
      tone(150, 0.3, "sawtooth", 0.25, 30);
      noise(0.34, 0.28, 420);
    },
    impactMedium() {
      tone(220, 0.14, "triangle", 0.18, 60);
      noise(0.14, 0.16, 900);
    },
    screech() {
      tone(980, 0.09, "sawtooth", 0.06, 720);
      noise(0.08, 0.07, 2400);
    },
    worldRecord() {
      const notes = [523, 659, 784, 1046, 1318, 1046, 1568];
      const times = [0, 70, 140, 210, 290, 380, 460];
      notes.forEach((n, i) => {
        setTimeout(() => tone(n, i === 6 ? 0.42 : 0.1, "sawtooth", 0.14), times[i]);
      });
      announce("New World Record!");
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

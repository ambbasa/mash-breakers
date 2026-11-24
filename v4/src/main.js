// MASH BREAKERS — Modern Neo-Arcade State Machine, HiDPI Canvas & UI Renderer
window.MB = window.MB || {};

(function () {
  const W = 960;
  const H = 540;
  const STORAGE_KEY = "mash_breakers_highscores_v1";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  // Crisp HiDPI scaling so vector cel-shading, portraits & typography are razor-sharp
  function setupHiDPI() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  setupHiDPI();
  window.addEventListener("resize", setupHiDPI);

  window.MB.showRendaMonitor = true;
  const { SDK, Audio, Juice, Sprites, Events } = window.MB;
  SDK.init();

  const state = {
    screen: "title", // title | char_select | event_select | playing | event_result | cup_summary
    charIndex: 0,
    eventIndex: 0,
    mode: "cup",
    cupStage: 0,
    cupResults: [],
    activeEvent: null,
    powerBonus: 1.0,
    animTime: 0,
    resultDelay: 0,
    highScores: loadScores(),
    hitBoxes: [],
  };

  function loadScores() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { cupBest: 0, sprint: null, meteor: null, train: null };
  }

  function saveScores() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.highScores));
    } catch (_) {}
  }

  function recordEventBest(eventId, score) {
    const prev = state.highScores[eventId] || 0;
    if (score > prev) {
      state.highScores[eventId] = score;
      saveScores();
      return true;
    }
    return false;
  }

  function startEvent(eventId, powerBonus) {
    Juice.reset();
    const char = Sprites.CHARACTERS[state.charIndex];
    state.powerBonus = powerBonus || 1.0;
    state.activeEvent = Events.createEvent(eventId, char, state.powerBonus);
    state.screen = "playing";
    state.resultDelay = 0;
    SDK.gameplayStart();
  }

  function startCup() {
    state.mode = "cup";
    state.cupStage = 0;
    state.cupResults = [];
    startEvent(Events.LIST[0].id, 1.0);
  }

  function handleInput(type) {
    if (SDK.isAdActive()) return;
    Audio.unlock();

    if (state.screen === "title") {
      if (type === "action" || type === "left" || type === "right") {
        Audio.uiConfirm();
        state.screen = "char_select";
      }
      return;
    }

    if (state.screen === "char_select") {
      if (type === "left") {
        state.charIndex = (state.charIndex + Sprites.CHARACTERS.length - 1) % Sprites.CHARACTERS.length;
        Audio.uiMove();
      } else if (type === "right") {
        state.charIndex = (state.charIndex + 1) % Sprites.CHARACTERS.length;
        Audio.uiMove();
      } else if (type === "action") {
        Audio.uiConfirm();
        state.screen = "event_select";
      }
      return;
    }

    if (state.screen === "event_select") {
      const totalOptions = Events.LIST.length + 1;
      if (type === "left") {
        state.eventIndex = (state.eventIndex + totalOptions - 1) % totalOptions;
        Audio.uiMove();
      } else if (type === "right") {
        state.eventIndex = (state.eventIndex + 1) % totalOptions;
        Audio.uiMove();
      } else if (type === "action") {
        Audio.uiConfirm();
        if (state.eventIndex === 0) {
          startCup();
        } else {
          state.mode = "single";
          startEvent(Events.LIST[state.eventIndex - 1].id, 1.0);
        }
      }
      return;
    }

    if (state.screen === "playing" && state.activeEvent) {
      state.activeEvent.onInput(type);
      return;
    }

    if (state.screen === "event_result") {
      if (type === "action") {
        Audio.uiConfirm();
        proceedAfterResult();
      } else if (type === "left") {
        Audio.uiConfirm();
        startEvent(state.activeEvent.meta.id, 1.0);
      } else if (type === "right") {
        triggerRewardedRetry();
      }
      return;
    }

    if (state.screen === "cup_summary") {
      if (type === "action") {
        Audio.uiConfirm();
        state.screen = "event_select";
      }
    }
  }

  function proceedAfterResult() {
    if (state.mode === "cup") {
      state.cupResults.push({
        eventName: state.activeEvent.meta.name,
        ...state.activeEvent.result,
      });
      state.cupStage += 1;
      if (state.cupStage < Events.LIST.length) {
        startEvent(Events.LIST[state.cupStage].id, 1.0);
      } else {
        const total = state.cupResults.reduce((acc, r) => acc + r.score, 0);
        if (total > state.highScores.cupBest) {
          state.highScores.cupBest = total;
          saveScores();
        }
        state.screen = "cup_summary";
        Audio.win();
      }
    } else {
      state.screen = "event_select";
    }
  }

  async function triggerRewardedRetry() {
    const ok = await SDK.rewardedBreak("REWARDED AD: +10% SUPER POWER RETRY");
    if (ok && state.activeEvent) {
      Audio.megaMash();
      startEvent(state.activeEvent.meta.id, 1.1);
    }
  }

  const keyMap = {
    KeyA: "left",
    ArrowLeft: "left",
    KeyZ: "left",
    KeyD: "right",
    ArrowRight: "right",
    KeyX: "right",
    Space: "action",
    Enter: "action",
  };

  const padEls = {
    left: document.getElementById("pad-left"),
    right: document.getElementById("pad-right"),
    action: document.getElementById("pad-action"),
  };

  window.addEventListener("keydown", (e) => {
    const mapped = keyMap[e.code];
    if (!mapped) return;
    e.preventDefault();
    if (e.repeat) return;
    if (padEls[mapped]) padEls[mapped].classList.add("pressed");
    handleInput(mapped);
  });

  window.addEventListener("keyup", (e) => {
    const mapped = keyMap[e.code];
    if (mapped && padEls[mapped]) padEls[mapped].classList.remove("pressed");
  });

  Object.keys(padEls).forEach((type) => {
    const el = padEls[type];
    if (!el) return;
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      el.classList.add("pressed");
      handleInput(type);
    });
    const release = () => el.classList.remove("pressed");
    el.addEventListener("pointerup", release);
    el.addEventListener("pointerleave", release);
    el.addEventListener("pointercancel", release);
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (SDK.isAdActive()) return;
    Audio.unlock();
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * W;
    const cy = ((e.clientY - rect.top) / rect.height) * H;
    for (const box of state.hitBoxes) {
      if (cx >= box.x && cx <= box.x + box.w && cy >= box.y && cy <= box.y + box.h) {
        box.onClick();
        return;
      }
    }
    if (state.screen === "title") {
      handleInput("action");
    }
  });

  const btnBgm = document.getElementById("btn-bgm");
  if (btnBgm) {
    btnBgm.addEventListener("click", () => {
      Audio.unlock();
      const muted = Audio.toggleBgm();
      btnBgm.textContent = muted ? "🔇 BGM" : "🎵 BGM";
    });
  }

  const btnRenda = document.getElementById("btn-renda");
  if (btnRenda) {
    btnRenda.classList.add("active");
    btnRenda.addEventListener("click", () => {
      window.MB.showRendaMonitor = !window.MB.showRendaMonitor;
      btnRenda.classList.toggle("active", window.MB.showRendaMonitor);
    });
  }

  const btnSound = document.getElementById("btn-sound");
  btnSound.addEventListener("click", () => {
    const muted = Audio.toggleMute();
    btnSound.textContent = muted ? "🔇 MUTE" : "🔊 SFX";
  });

  const btnShake = document.getElementById("btn-shake");
  btnShake.addEventListener("click", () => {
    const label = Juice.cycleAccessibility();
    btnShake.textContent = `💥 FX: ${label}`;
  });

  document.getElementById("btn-home").addEventListener("click", () => {
    SDK.gameplayStop();
    Juice.reset();
    state.screen = "title";
    Audio.setBgm("menu");
    Audio.uiMove();
  });

  // =========================================================
  // MODERN NEO-ARCADE UI HELPERS
  // =========================================================
  function addHitBox(x, y, w, h, onClick) {
    state.hitBoxes.push({ x, y, w, h, onClick });
  }

  function drawMenuBg() {
    const stadium = Sprites.getAsset("stadium");
    if (stadium && stadium.complete && stadium.naturalWidth > 0) {
      ctx.drawImage(stadium, 0, 0, W, H);
      const scrim = ctx.createLinearGradient(0, 0, 0, H);
      scrim.addColorStop(0, "rgba(7, 10, 26, 0.78)");
      scrim.addColorStop(0.55, "rgba(10, 14, 34, 0.84)");
      scrim.addColorStop(1, "rgba(6, 8, 20, 0.94)");
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "#0b0e24";
      ctx.fillRect(0, 0, W, H);
    }

    // Subtle animated diagonal energy grid lines
    ctx.save();
    ctx.strokeStyle = "rgba(56, 243, 255, 0.07)";
    ctx.lineWidth = 2;
    const shift = (state.animTime * 42) % 90;
    for (let x = -H; x < W + H; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x + shift, 0);
      ctx.lineTo(x + shift - 180, H);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSkewRect(x, y, w, h, skew, fill, stroke, lineW) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + skew, y);
    ctx.lineTo(x + w + skew, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineW || 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================
  // SCREEN 1: TITLE SCREEN (NEO-ARCADE KEY ART)
  // =========================================================
  function drawTitleScreen() {
    const stadium = Sprites.getAsset("stadium");
    if (stadium && stadium.complete && stadium.naturalWidth > 0) {
      // Subtle ken-burns breathing zoom on megadome key art
      const z = 1.03 + Math.sin(state.animTime * 0.45) * 0.025;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(z, z);
      ctx.drawImage(stadium, -W / 2, -H / 2, W, H);
      ctx.restore();

      const scrim = ctx.createLinearGradient(0, 0, 0, H);
      scrim.addColorStop(0, "rgba(7, 10, 28, 0.45)");
      scrim.addColorStop(0.55, "rgba(8, 12, 32, 0.38)");
      scrim.addColorStop(1, "rgba(6, 8, 22, 0.88)");
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, W, H);
    } else {
      Sprites.drawStadiumBg(ctx, W, H, state.animTime * 90, "day");
      ctx.fillStyle = "rgba(8, 10, 26, 0.55)";
      ctx.fillRect(0, 0, W, H);
    }

    // Diagonal character showcase cards flanking the bottom corners
    const slots = [
      { idx: 0, x: 34, y: 276, w: 190, h: 215, skew: 18 },
      { idx: 1, x: 720, y: 276, w: 190, h: 215, skew: 18 },
      { idx: 2, x: 378, y: 315, w: 190, h: 176, skew: 14 },
    ];
    slots.forEach((s) => {
      const c = Sprites.CHARACTERS[s.idx];
      const img = Sprites.getPortrait(c.id);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(s.x + s.skew, s.y);
      ctx.lineTo(s.x + s.w + s.skew, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.lineTo(s.x, s.y + s.h);
      ctx.closePath();
      ctx.fillStyle = "#101530";
      ctx.fill();
      ctx.save();
      ctx.clip();
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, s.x - 6, s.y - 6, s.w + 26, s.w + 26);
      }
      const fade = ctx.createLinearGradient(0, s.y + s.h - 60, 0, s.y + s.h);
      fade.addColorStop(0, "rgba(8,10,24,0)");
      fade.addColorStop(1, "rgba(8,10,24,0.92)");
      ctx.fillStyle = fade;
      ctx.fillRect(s.x, s.y, s.w + s.skew, s.h);
      ctx.restore();
      ctx.strokeStyle = c.aura;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 900 15px 'Arial Black', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.name, s.x + s.w / 2 + 4, s.y + s.h - 14);
      ctx.restore();
    });

    // Dramatic Neo-Arcade Skewed Metallic Title Logo
    ctx.save();
    const pulse = 1 + Math.sin(state.animTime * 4.5) * 0.025;
    ctx.translate(W / 2, 138);
    ctx.transform(pulse, -0.025 * pulse, -0.18 * pulse, pulse, 0, 0);
    ctx.textAlign = "center";

    // Outer neon glow drop shadow
    ctx.shadowColor = "rgba(255, 60, 100, 0.7)";
    ctx.shadowBlur = 24;
    ctx.font = "900 84px 'Arial Black', Impact, sans-serif";
    ctx.lineWidth = 14;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#080a18";
    ctx.strokeText("MASH BREAKERS", 0, 0);

    const logoGrad = ctx.createLinearGradient(0, -68, 0, 14);
    logoGrad.addColorStop(0, "#ffffff");
    logoGrad.addColorStop(0.28, "#fff280");
    logoGrad.addColorStop(0.62, "#ff9900");
    logoGrad.addColorStop(1, "#ff1e56");
    ctx.fillStyle = logoGrad;
    ctx.fillText("MASH BREAKERS", 0, 0);
    ctx.restore();

    // Subtitle neon pill
    drawSkewRect(W / 2 - 255, 168, 510, 32, 12, "rgba(8, 12, 32, 0.88)", "#38f3ff", 2.5);
    ctx.textAlign = "center";
    ctx.fillStyle = "#38f3ff";
    ctx.font = "italic 900 15px 'Segoe UI', sans-serif";
    ctx.fillText("⚡ NEO-ARCADE SUPERHUMAN SPORTS  //  3-EVENT CUP ⚡", W / 2 + 6, 189);

    // Pulsing Press Start Button
    const ctaGlow = 0.85 + Math.sin(state.animTime * 6) * 0.15;
    ctx.save();
    ctx.globalAlpha = ctaGlow;
    const ctaGrad = ctx.createLinearGradient(W / 2 - 256, 224, W / 2 + 256, 276);
    ctaGrad.addColorStop(0, "#ff1e56");
    ctaGrad.addColorStop(0.5, "#ff7700");
    ctaGrad.addColorStop(1, "#ff1e56");
    drawSkewRect(W / 2 - 256, 224, 512, 52, 14, ctaGrad, "#ffee33", 3.5);
    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 900 21px 'Arial Black', sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 6;
    ctx.fillText("PRESS [SPACE] OR CLICK TO PLAY", W / 2 + 7, 257);
    ctx.restore();

    // High score badge at bottom
    drawSkewRect(W / 2 - 175, 498, 350, 32, 10, "rgba(8, 12, 28, 0.9)", "#4a5a9c", 2);
    ctx.fillStyle = "#ffee33";
    ctx.font = "900 15px monospace";
    ctx.fillText(`🏆 CUP HIGH SCORE: ${state.highScores.cupBest.toLocaleString()} PTS`, W / 2 + 5, 519);
  }

  // =========================================================
  // SCREEN 2: CHARACTER SELECT (FIGHTING-GAME FIGHTER CARDS)
  // =========================================================
  function drawCharSelect() {
    drawMenuBg();

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffee33";
    ctx.font = "italic 900 38px 'Arial Black', sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 10;
    ctx.fillText("SELECT YOUR SUPERHUMAN", W / 2, 54);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#a8b8e6";
    ctx.font = "700 14px 'Segoe UI', sans-serif";
    ctx.fillText("A / D 로 캐릭터 선택 · SPACE 로 결정 (또는 카드 클릭)", W / 2, 80);

    const cardW = 274;
    const cardH = 398;
    const gap = 26;
    const startX = (W - (cardW * 3 + gap * 2)) / 2;

    Sprites.CHARACTERS.forEach((c, idx) => {
      const x = startX + idx * (cardW + gap);
      const y = 104;
      const selected = idx === state.charIndex;
      const img = Sprites.getPortrait(c.id);

      ctx.save();
      if (selected) {
        ctx.shadowColor = c.aura;
        ctx.shadowBlur = 24;
      }

      // Card container
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 14);
      ctx.fillStyle = selected ? "#1b234d" : "#111630";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Full-bleed illustrated anime portrait in upper 62% of card
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, cardW - 8, 232, [10, 10, 0, 0]);
      ctx.clip();
      if (img && img.complete && img.naturalWidth > 0) {
        const z = selected ? 1.07 + Math.sin(state.animTime * 4) * 0.02 : 1.0;
        const dw = (cardW - 8) * z;
        const dh = dw;
        ctx.drawImage(img, x + 4 - (dw - (cardW - 8)) / 2, y - 8, dw, dh);
      } else {
        ctx.fillStyle = c.suitDark;
        ctx.fillRect(x + 4, y + 4, cardW - 8, 232);
      }

      // Dramatic bottom gradient scrim on portrait
      const pFade = ctx.createLinearGradient(0, y + 150, 0, y + 236);
      pFade.addColorStop(0, "rgba(12, 16, 38, 0)");
      pFade.addColorStop(1, selected ? "rgba(27, 35, 77, 1)" : "rgba(17, 22, 48, 1)");
      ctx.fillStyle = pFade;
      ctx.fillRect(x + 4, y + 145, cardW - 8, 95);

      // Country badge top-left
      drawSkewRect(x + 12, y + 12, 54, 24, 6, "rgba(8, 10, 24, 0.85)", c.aura, 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(c.country, x + 42, y + 28);

      // Live mini animated sprite preview in bottom-right of portrait
      if (selected) {
        Sprites.drawCharacter(ctx, c, x + cardW - 44, y + 216, {
          scale: 0.50,
          pose: "charge",
          phase: state.animTime,
          mega: true,
        });
      }
      ctx.restore();

      // Name & Style title
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 900 24px 'Arial Black', sans-serif";
      ctx.fillText(c.name, x + 16, y + 258);

      ctx.fillStyle = c.aura;
      ctx.font = "italic 800 12px 'Segoe UI', sans-serif";
      ctx.fillText(c.title, x + 16, y + 278);

      // Modern skewed stat bars
      const stats = [
        ["SPEED", c.speedStat, "#38f3ff"],
        ["MASH ", c.mashStat, "#ffee33"],
        ["POWER", c.powerStat, "#ff3366"],
      ];
      stats.forEach(([label, val, col], sIdx) => {
        const sy = y + 296 + sIdx * 28;
        ctx.fillStyle = "#98a8d8";
        ctx.font = "900 12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(label, x + 16, sy + 13);

        drawSkewRect(x + 68, sy + 2, 182, 13, 5, "#090c1e", "#2d3766", 1.5);
        drawSkewRect(x + 68, sy + 2, (val / 10) * 182, 13, 5, col, null, 0);
      });

      // Outer border
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 14);
      ctx.strokeStyle = selected ? c.aura : "#2d3666";
      ctx.lineWidth = selected ? 4.5 : 2;
      ctx.stroke();

      if (selected) {
        drawSkewRect(x + cardW / 2 - 66, y - 14, 132, 24, 8, c.aura, "#090b18", 2);
        ctx.fillStyle = "#090b18";
        ctx.font = "italic 900 12px 'Arial Black', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("★ SELECTED ★", x + cardW / 2 + 4, y + 2);
      }
      ctx.restore();

      addHitBox(x, y, cardW, cardH, () => {
        if (state.charIndex === idx) {
          Audio.uiConfirm();
          state.screen = "event_select";
        } else {
          state.charIndex = idx;
          Audio.uiMove();
        }
      });
    });
  }

  // =========================================================
  // SCREEN 3: EVENT / MODE SELECT
  // =========================================================
  function drawEventSelect() {
    drawMenuBg();
    const char = Sprites.CHARACTERS[state.charIndex];

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffee33";
    ctx.font = "italic 900 34px 'Arial Black', sans-serif";
    ctx.fillText("SELECT MODE / EVENT", W / 2, 50);

    // Selected hero mini pill
    ctx.fillStyle = "#a8b8e6";
    ctx.font = "700 14px 'Segoe UI', sans-serif";
    ctx.fillText(`PLAYER: ${char.name} [${char.country}]  —  A / D 이동 · SPACE 시작`, W / 2, 76);

    // 0: Featured 3-Event Arcade Cup Banner
    const cupSelected = state.eventIndex === 0;
    const cx = 96, cy = 98, cw = 768, ch = 104;
    ctx.save();
    if (cupSelected) {
      ctx.shadowColor = "#ffee33";
      ctx.shadowBlur = 20;
    }
    const cupGrad = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
    cupGrad.addColorStop(0, cupSelected ? "#3a2268" : "#191e42");
    cupGrad.addColorStop(0.5, cupSelected ? "#522568" : "#1d2450");
    cupGrad.addColorStop(1, cupSelected ? "#262d68" : "#151a38");
    drawSkewRect(cx, cy, cw, ch, 14, cupGrad, cupSelected ? "#ffee33" : "#3a4580", cupSelected ? 4 : 2);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffee33";
    ctx.font = "italic 900 28px 'Arial Black', sans-serif";
    ctx.fillText("🏆 3-EVENT ARCADE CUP (RECOMMENDED)", W / 2 + 6, cy + 44);
    ctx.fillStyle = "#e6ecff";
    ctx.font = "700 15px 'Segoe UI', sans-serif";
    ctx.fillText("3종목 연속 도전으로 최고 기록 갱신! (음속 질주 → 운석 격파 → 폭주 열차)", W / 2 + 4, cy + 78);
    ctx.restore();

    addHitBox(cx, cy, cw, ch, () => {
      state.eventIndex = 0;
      Audio.uiConfirm();
      startCup();
    });

    // 1..3 Individual Event Cards with live miniature visual headers
    const cardW = 248, cardH = 282, gap = 22;
    const startX = (W - (cardW * 3 + gap * 2)) / 2;

    Events.LIST.forEach((ev, i) => {
      const idx = i + 1;
      const x = startX + i * (cardW + gap);
      const y = 226;
      const sel = state.eventIndex === idx;

      ctx.save();
      if (sel) {
        ctx.shadowColor = ev.accent;
        ctx.shadowBlur = 18;
      }
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 12);
      ctx.fillStyle = sel ? "#1c244f" : "#111632";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Miniature themed visual header strip
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, cardW - 8, 84, [8, 8, 0, 0]);
      ctx.clip();
      const hGrad = ctx.createLinearGradient(x, y, x + cardW, y + 88);
      if (ev.id === "sprint") {
        hGrad.addColorStop(0, "#0b46b8");
        hGrad.addColorStop(1, "#38f3ff");
      } else if (ev.id === "meteor") {
        hGrad.addColorStop(0, "#4a1242");
        hGrad.addColorStop(1, "#ff7722");
      } else {
        hGrad.addColorStop(0, "#0b1236");
        hGrad.addColorStop(1, "#ff2255");
      }
      ctx.fillStyle = hGrad;
      ctx.fillRect(x + 4, y + 4, cardW - 8, 84);

      // Stylized icon badge
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.font = "900 54px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(ev.id === "sprint" ? "⚡" : ev.id === "meteor" ? "☄️" : "🚄", x + cardW - 14, y + 68);

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 900 12px monospace";
      ctx.fillText(`EVENT 0${idx}`, x + 16, y + 28);
      ctx.font = "italic 900 21px 'Arial Black', sans-serif";
      ctx.fillText(ev.name, x + 16, y + 56);
      ctx.fillStyle = "#ffee33";
      ctx.font = "800 14px 'Segoe UI', sans-serif";
      ctx.fillText(ev.krName, x + 16, y + 77);
      ctx.restore();

      // Description
      ctx.textAlign = "center";
      ctx.fillStyle = "#c4cef0";
      ctx.font = "600 13px 'Segoe UI', sans-serif";
      const mid = Math.floor(ev.desc.length / 2);
      const splitAt = ev.desc.indexOf(" ", mid - 6);
      const line1 = splitAt > 0 ? ev.desc.slice(0, splitAt) : ev.desc;
      const line2 = splitAt > 0 ? ev.desc.slice(splitAt + 1) : "";
      ctx.fillText(line1, x + cardW / 2, y + 132);
      ctx.fillText(line2, x + cardW / 2, y + 154);

      // Target pill
      drawSkewRect(x + 20, y + 182, cardW - 40, 32, 8, "rgba(8, 12, 28, 0.85)", ev.accent, 2);
      ctx.fillStyle = "#55ff88";
      ctx.font = "900 13px monospace";
      ctx.fillText(ev.targetLabel, x + cardW / 2 + 4, y + 203);

      const best = state.highScores[ev.id];
      ctx.fillStyle = best ? "#ffee33" : "#7884b2";
      ctx.font = "900 14px monospace";
      ctx.fillText(best ? `★ BEST: ${best.toLocaleString()} PTS` : "NO RECORD YET", x + cardW / 2, y + 252);

      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 12);
      ctx.strokeStyle = sel ? ev.accent : "#2e3869";
      ctx.lineWidth = sel ? 4 : 2;
      ctx.stroke();
      ctx.restore();

      addHitBox(x, y, cardW, cardH, () => {
        state.eventIndex = idx;
        state.mode = "single";
        Audio.uiConfirm();
        startEvent(ev.id, 1.0);
      });
    });
  }

  // =========================================================
  // SCREEN 4: EVENT RESULT OVERLAY
  // =========================================================
  function drawResultOverlay() {
    const ev = state.activeEvent;
    const r = ev.result;
    const char = Sprites.CHARACTERS[state.charIndex];
    const img = Sprites.getPortrait(char.id);

    ctx.fillStyle = "rgba(6, 8, 20, 0.82)";
    ctx.fillRect(0, 0, W, H);

    const bx = 110, by = 62, bw = 740, bh = 416;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 16);
    ctx.fillStyle = "#121734";
    ctx.fill();
    ctx.strokeStyle = r.passed ? "#ffee33" : "#ff3355";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Left hero portrait panel
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bx + 16, by + 16, 210, 290, 12);
    ctx.clip();
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, bx + 16 - 35, by + 16, 280, 280);
    } else {
      ctx.fillStyle = char.suitDark;
      ctx.fillRect(bx + 16, by + 16, 210, 290);
    }
    ctx.restore();
    ctx.strokeStyle = char.aura;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bx + 16, by + 16, 210, 290, 12);
    ctx.stroke();

    // Right stats area
    const rx = bx + 485;
    ctx.textAlign = "center";
    ctx.fillStyle = "#98a8d8";
    ctx.font = "italic 900 15px 'Segoe UI', sans-serif";
    ctx.fillText(`${ev.meta.name}  //  EVENT RESULT`, rx, by + 48);

    // Metallic medal text
    const medalColor =
      r.medal === "S-RANK" ? "#38f3ff" :
      r.medal === "GOLD" ? "#ffee33" :
      r.medal === "SILVER" ? "#e0ecff" :
      r.medal === "BRONZE" ? "#ff9944" : "#ff3355";
    ctx.fillStyle = medalColor;
    ctx.font = "italic 900 58px 'Arial Black', sans-serif";
    ctx.shadowColor = medalColor;
    ctx.shadowBlur = 18;
    ctx.fillText(r.medal, rx, by + 118);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 32px monospace";
    ctx.fillText(`${r.recordText}`, rx, by + 172);
    ctx.fillStyle = "#ffee33";
    ctx.font = "900 22px monospace";
    ctx.fillText(`${r.score.toLocaleString()} PTS`, rx, by + 206);

    ctx.fillStyle = "#cfd9ff";
    ctx.font = "700 15px 'Segoe UI', sans-serif";
    ctx.fillText(r.detailText, rx, by + 248);

    if (r.isWorldRecord) {
      ctx.fillStyle = "#ffee33";
      ctx.font = "italic 900 18px 'Arial Black', sans-serif";
      ctx.fillText("🏆 NEW WORLD RECORD!! 🏆", rx, by + 282);
    } else if (state.powerBonus > 1.0) {
      ctx.fillStyle = "#38f3ff";
      ctx.font = "italic 900 14px 'Segoe UI', sans-serif";
      ctx.fillText("⚡ REWARDED AD +10% SUPER POWER APPLIED!", rx, by + 282);
    }

    // Bottom action buttons
    const btns = [
      {
        x: bx + 28, y: by + 328, w: 210, h: 66,
        bg: "#243060", border: "#6c84d6",
        label: "RETRY [A]", sub: "다시 도전",
        onClick: () => { Audio.uiConfirm(); startEvent(ev.meta.id, 1.0); },
      },
      {
        x: bx + 265, y: by + 328, w: 210, h: 66,
        bg: "#008a48", border: "#55ff88",
        label: state.mode === "cup" ? "NEXT [SPACE]" : "MENU [SPACE]",
        sub: state.mode === "cup" ? "다음 종목" : "종목 선택",
        onClick: () => { Audio.uiConfirm(); proceedAfterResult(); },
      },
      {
        x: bx + 502, y: by + 328, w: 210, h: 66,
        bg: "#a85c00", border: "#ffee33",
        label: "📺 AD +10% [D]", sub: "보상형 광고 재도전",
        onClick: () => triggerRewardedRetry(),
      },
    ];

    btns.forEach((b) => {
      drawSkewRect(b.x, b.y, b.w, b.h, 10, b.bg, b.border, 3);
      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 900 16px 'Arial Black', sans-serif";
      ctx.fillText(b.label, b.x + b.w / 2 + 5, b.y + 30);
      ctx.fillStyle = "#e0e8ff";
      ctx.font = "700 12px 'Segoe UI', sans-serif";
      ctx.fillText(b.sub, b.x + b.w / 2 + 5, b.y + 51);
      addHitBox(b.x, b.y, b.w, b.h, b.onClick);
    });

    ctx.restore();
  }

  // =========================================================
  // SCREEN 5: 3-EVENT CUP SUMMARY
  // =========================================================
  function drawCupSummary() {
    drawMenuBg();
    const char = Sprites.CHARACTERS[state.charIndex];
    const img = Sprites.getPortrait(char.id);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffee33";
    ctx.font = "italic 900 40px 'Arial Black', sans-serif";
    ctx.fillText("🏆 3-EVENT ARCADE CUP COMPLETE!", W / 2, 66);

    // Champion portrait card on left
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(62, 108, 224, 340, 14);
    ctx.fillStyle = "#161d42";
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 36, 108, 276, 276);
    }
    ctx.restore();
    ctx.strokeStyle = char.aura;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 900 22px 'Arial Black', sans-serif";
    ctx.fillText(char.name, 174, 412);
    ctx.fillStyle = char.aura;
    ctx.font = "800 13px 'Segoe UI', sans-serif";
    ctx.fillText(char.title, 174, 434);
    ctx.restore();

    let total = 0;
    state.cupResults.forEach((r, i) => {
      total += r.score;
      const ry = 114 + i * 74;
      drawSkewRect(314, ry, 578, 60, 10, "rgba(18, 24, 54, 0.9)", r.passed ? "#55ff88" : "#ff4466", 2.5);

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 900 20px 'Arial Black', sans-serif";
      ctx.fillText(`${i + 1}. ${r.eventName}`, 336, ry + 37);

      ctx.textAlign = "right";
      ctx.fillStyle = "#ffee33";
      ctx.font = "900 19px monospace";
      ctx.fillText(`${r.recordText}  [${r.medal}]  ${r.score.toLocaleString()} PTS`, 880, ry + 37);
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "#38f3ff";
    ctx.font = "italic 900 36px monospace";
    ctx.fillText(`TOTAL SCORE: ${total.toLocaleString()} PTS`, 604, 386);
    ctx.fillStyle = "#a8b8e6";
    ctx.font = "800 16px monospace";
    ctx.fillText(`ALL-TIME BEST: ${state.highScores.cupBest.toLocaleString()} PTS`, 604, 418);

    const bx = 468, by = 442, bw = 272, bh = 56;
    drawSkewRect(bx, by, bw, bh, 12, "#008a48", "#55ff88", 3);
    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 900 18px 'Arial Black', sans-serif";
    ctx.fillText("BACK TO MENU [SPACE]", bx + bw / 2 + 6, by + 35);
    addHitBox(bx, by, bw, bh, () => {
      Audio.uiConfirm();
      state.screen = "event_select";
    });
  }

  // =========================================================
  // MAIN GAME LOOP
  // =========================================================
  let lastTime = performance.now();

  function loop(now) {
    const realDt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    state.animTime += realDt;
    state.hitBoxes = [];

    const simDt = Juice.update(realDt);

    if (state.screen === "playing" && state.activeEvent) {
      state.activeEvent.update(simDt);
      if (state.activeEvent.phase === "finish") {
        state.resultDelay += realDt;
        if (state.resultDelay >= 1.35) {
          SDK.gameplayStop();
          const isWR = recordEventBest(state.activeEvent.meta.id, state.activeEvent.result.score);
          state.activeEvent.result.isWorldRecord = isWR && state.activeEvent.result.passed;
          if (state.activeEvent.result.isWorldRecord) {
            Audio.worldRecord();
          }
          state.screen = "event_result";
        }
      }
    }

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Dynamic camera zoom punch + trauma shake
    if (Juice.shakeX !== 0 || Juice.shakeY !== 0 || Juice.zoom !== 1.0) {
      ctx.translate(W / 2 + Juice.shakeX, H / 2 + Juice.shakeY);
      ctx.scale(Juice.zoom, Juice.zoom);
      ctx.rotate(Juice.shakeRot);
      ctx.translate(-W / 2, -H / 2);
    }

    if (state.screen === "title") {
      drawTitleScreen();
    } else if (state.screen === "char_select") {
      drawCharSelect();
    } else if (state.screen === "event_select") {
      drawEventSelect();
    } else if (state.screen === "playing" || state.screen === "event_result") {
      if (state.activeEvent) {
        state.activeEvent.draw(ctx, W, H);
      }
      Juice.drawEffects(ctx, W, H);
      if (state.screen === "event_result") {
        drawResultOverlay();
      }
    } else if (state.screen === "cup_summary") {
      drawCupSummary();
    }

    ctx.restore();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();

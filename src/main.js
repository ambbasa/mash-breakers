// MASH BREAKERS — Main Arcade State Machine & Input Controller
window.MB = window.MB || {};

(function () {
  const W = 960;
  const H = 540;
  const STORAGE_KEY = "mash_breakers_highscores_v1";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  const { SDK, Audio, Juice, Sprites, Events } = window.MB;
  SDK.init();

  // Game state
  const state = {
    screen: "title", // title | char_select | event_select | playing | event_result | cup_summary
    charIndex: 0,
    eventIndex: 0,
    mode: "cup", // cup (3 events in a row) | single
    cupStage: 0,
    cupResults: [],
    activeEvent: null,
    powerBonus: 1.0, // +10% if player watched rewarded retry ad
    animTime: 0,
    resultDelay: 0,
    highScores: loadScores(),
    hitBoxes: [], // Clickable UI boxes on canvas
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

  // Unified input dispatcher (Keyboard + Touch Arcade Buttons)
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
      const totalOptions = Events.LIST.length + 1; // 0 = 3-EVENT ARCADE CUP, 1..3 = single events
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

  // Keyboard bindings (anti-hold: ignore e.repeat)
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
    if (e.repeat) return; // Prevents holding button down to cheat!
    if (padEls[mapped]) padEls[mapped].classList.add("pressed");
    handleInput(mapped);
  });

  window.addEventListener("keyup", (e) => {
    const mapped = keyMap[e.code];
    if (mapped && padEls[mapped]) padEls[mapped].classList.remove("pressed");
  });

  // Pointer / Touch bindings for on-screen arcade buttons
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

  // Canvas direct click support for menus
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

  // Top bar buttons
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
    Audio.uiMove();
  });

  // =========================================================
  // RENDERING SCREENS
  // =========================================================
  function addHitBox(x, y, w, h, onClick) {
    state.hitBoxes.push({ x, y, w, h, onClick });
  }

  function drawTitleScreen() {
    Sprites.drawStadiumBg(ctx, W, H, state.animTime * 90, "day");
    ctx.fillStyle = "rgba(8, 10, 26, 0.52)";
    ctx.fillRect(0, 0, W, H);

    // Attract-mode running characters
    Sprites.CHARACTERS.forEach((c, i) => {
      const rx = ((state.animTime * (160 + i * 25) + i * 260) % (W + 180)) - 90;
      Sprites.drawCharacter(ctx, c, rx, 455 + i * 12, {
        scale: 1.05,
        pose: "run",
        phase: state.animTime * 1.4 + i,
        mega: i === 0,
      });
    });

    // Bold 90s Arcade Logo
    ctx.save();
    ctx.textAlign = "center";
    const pulse = 1 + Math.sin(state.animTime * 5) * 0.03;
    ctx.translate(W / 2, 165);
    ctx.scale(pulse, pulse);

    ctx.font = "900 84px sans-serif";
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#0b0d1f";
    ctx.strokeText("MASH BREAKERS", 0, 0);

    const grad = ctx.createLinearGradient(0, -65, 0, 12);
    grad.addColorStop(0, "#fff599");
    grad.addColorStop(0.5, "#ffaa00");
    grad.addColorStop(1, "#ff2244");
    ctx.fillStyle = grad;
    ctx.fillText("MASH BREAKERS", 0, 0);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#44ffff";
    ctx.font = "900 20px sans-serif";
    ctx.fillText("SUPERHUMAN ARCADE SPORTS — 3-EVENT PROTOTYPE", W / 2, 212);

    // Press Start CTA
    if (Math.floor(state.animTime * 2.2) % 2 === 0) {
      ctx.fillStyle = "#ffee33";
      ctx.font = "900 30px sans-serif";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 6;
      ctx.strokeText("PRESS [SPACE] OR CLICK TO START", W / 2, 305);
      ctx.fillText("PRESS [SPACE] OR CLICK TO START", W / 2, 305);
    }

    // Best Cup Score badge
    ctx.fillStyle = "rgba(10, 14, 34, 0.85)";
    ctx.fillRect(W / 2 - 190, 340, 380, 44);
    ctx.strokeStyle = "#4a548f";
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 190, 340, 380, 44);
    ctx.fillStyle = "#fff";
    ctx.font = "900 18px monospace";
    ctx.fillText(`CUP HIGH SCORE: ${state.highScores.cupBest.toLocaleString()} PTS`, W / 2, 368);
  }

  function drawCharSelect() {
    ctx.fillStyle = "#10132a";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffee33";
    ctx.font = "900 36px sans-serif";
    ctx.fillText("SELECT YOUR SUPERHUMAN", W / 2, 58);
    ctx.fillStyle = "#98a0c8";
    ctx.font = "700 15px sans-serif";
    ctx.fillText("A / D 로 캐릭터 선택 · SPACE 로 결정 (또는 카드 클릭)", W / 2, 86);

    const cardW = 265;
    const cardH = 355;
    const gap = 30;
    const startX = (W - (cardW * 3 + gap * 2)) / 2;

    Sprites.CHARACTERS.forEach((c, idx) => {
      const x = startX + idx * (cardW + gap);
      const y = 112;
      const selected = idx === state.charIndex;

      ctx.fillStyle = selected ? "#212854" : "#151936";
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = selected ? "#ffee33" : "#353c6e";
      ctx.lineWidth = selected ? 5 : 2;
      ctx.strokeRect(x, y, cardW, cardH);

      Sprites.drawCharacter(ctx, c, x + cardW / 2, y + 158, {
        scale: selected ? 1.35 : 1.12,
        pose: selected ? "charge" : "idle",
        phase: state.animTime,
        mega: selected,
      });

      ctx.fillStyle = "#fff";
      ctx.font = "900 22px sans-serif";
      ctx.fillText(c.name, x + cardW / 2, y + 205);
      ctx.fillStyle = c.aura;
      ctx.font = "800 13px sans-serif";
      ctx.fillText(`[${c.country}] ${c.title}`, x + cardW / 2, y + 226);

      // Stat bars
      const stats = [
        ["SPEED", c.speedStat, "#44ffff"],
        ["MASH ", c.mashStat, "#ffee33"],
        ["POWER", c.powerStat, "#ff4466"],
      ];
      stats.forEach(([label, val, col], sIdx) => {
        const sy = y + 248 + sIdx * 28;
        ctx.fillStyle = "#98a0c8";
        ctx.font = "900 12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(label, x + 22, sy + 12);
        ctx.fillStyle = "#0b0d1f";
        ctx.fillRect(x + 74, sy + 2, 165, 12);
        ctx.fillStyle = col;
        ctx.fillRect(x + 74, sy + 2, (val / 10) * 165, 12);
      });
      ctx.textAlign = "center";

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

  function drawEventSelect() {
    ctx.fillStyle = "#10132a";
    ctx.fillRect(0, 0, W, H);
    const char = Sprites.CHARACTERS[state.charIndex];

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffee33";
    ctx.font = "900 34px sans-serif";
    ctx.fillText("SELECT MODE / EVENT", W / 2, 54);
    ctx.fillStyle = "#98a0c8";
    ctx.font = "700 14px sans-serif";
    ctx.fillText(`PLAYER: ${char.name} — A / D 이동 · SPACE 시작`, W / 2, 80);

    // 0: Full 3-Event Arcade Cup Banner
    const cupSelected = state.eventIndex === 0;
    const cx = 110, cy = 104, cw = 740, ch = 96;
    ctx.fillStyle = cupSelected ? "#2c2459" : "#181d3d";
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = cupSelected ? "#ffee33" : "#3a4278";
    ctx.lineWidth = cupSelected ? 5 : 2;
    ctx.strokeRect(cx, cy, cw, ch);

    ctx.fillStyle = "#ffee33";
    ctx.font = "900 28px sans-serif";
    ctx.fillText("🏆 3-EVENT ARCADE CUP (RECOMMENDED)", W / 2, cy + 44);
    ctx.fillStyle = "#dce2ff";
    ctx.font = "700 15px sans-serif";
    ctx.fillText("3종목 연속 도전으로 최고 기록 갱신! (음속 질주 → 운석 격파 → 폭주 열차)", W / 2, cy + 74);

    addHitBox(cx, cy, cw, ch, () => {
      state.eventIndex = 0;
      Audio.uiConfirm();
      startCup();
    });

    // 1..3 Individual Events
    const cardW = 240, cardH = 260, gap = 22;
    const startX = (W - (cardW * 3 + gap * 2)) / 2;

    Events.LIST.forEach((ev, i) => {
      const idx = i + 1;
      const x = startX + i * (cardW + gap);
      const y = 228;
      const sel = state.eventIndex === idx;

      ctx.fillStyle = sel ? "#212854" : "#151936";
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = sel ? "#44ffff" : "#353c6e";
      ctx.lineWidth = sel ? 4 : 2;
      ctx.strokeRect(x, y, cardW, cardH);

      ctx.fillStyle = "#44ffff";
      ctx.font = "900 13px sans-serif";
      ctx.fillText(`EVENT ${idx}`, x + cardW / 2, y + 32);

      ctx.fillStyle = "#fff";
      ctx.font = "900 21px sans-serif";
      ctx.fillText(ev.name, x + cardW / 2, y + 64);

      ctx.fillStyle = "#ffee33";
      ctx.font = "800 15px sans-serif";
      ctx.fillText(ev.krName, x + cardW / 2, y + 90);

      // Wrap short description
      ctx.fillStyle = "#b8c0e6";
      ctx.font = "600 13px sans-serif";
      const mid = Math.floor(ev.desc.length / 2);
      const splitAt = ev.desc.indexOf(" ", mid - 6);
      const line1 = splitAt > 0 ? ev.desc.slice(0, splitAt) : ev.desc;
      const line2 = splitAt > 0 ? ev.desc.slice(splitAt + 1) : "";
      ctx.fillText(line1, x + cardW / 2, y + 135);
      ctx.fillText(line2, x + cardW / 2, y + 156);

      ctx.fillStyle = "#55ff88";
      ctx.font = "900 13px monospace";
      ctx.fillText(ev.targetLabel, x + cardW / 2, y + 202);

      const best = state.highScores[ev.id];
      ctx.fillStyle = "#98a0c8";
      ctx.font = "800 13px monospace";
      ctx.fillText(best ? `BEST: ${best} PTS` : "NO RECORD YET", x + cardW / 2, y + 234);

      addHitBox(x, y, cardW, cardH, () => {
        state.eventIndex = idx;
        state.mode = "single";
        Audio.uiConfirm();
        startEvent(ev.id, 1.0);
      });
    });
  }

  function drawResultOverlay() {
    const ev = state.activeEvent;
    const r = ev.result;

    ctx.fillStyle = "rgba(7, 9, 22, 0.84)";
    ctx.fillRect(0, 0, W, H);

    const bx = 170, by = 68, bw = 620, bh = 404;
    ctx.fillStyle = "#161a36";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = r.passed ? "#ffee33" : "#ff3355";
    ctx.lineWidth = 4;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.textAlign = "center";
    ctx.fillStyle = "#98a0c8";
    ctx.font = "900 16px sans-serif";
    ctx.fillText(`${ev.meta.name} — RESULT`, W / 2, by + 38);

    ctx.fillStyle = r.passed ? "#55ff88" : "#ff4466";
    ctx.font = "900 50px sans-serif";
    ctx.fillText(r.medal, W / 2, by + 98);

    ctx.fillStyle = "#ffee33";
    ctx.font = "900 34px monospace";
    ctx.fillText(`${r.recordText}  (${r.score.toLocaleString()} PTS)`, W / 2, by + 150);

    ctx.fillStyle = "#dce2ff";
    ctx.font = "700 16px sans-serif";
    ctx.fillText(r.detailText, W / 2, by + 190);

    if (state.powerBonus > 1.0) {
      ctx.fillStyle = "#44ffff";
      ctx.font = "900 14px sans-serif";
      ctx.fillText("⚡ REWARDED AD +10% SUPER POWER APPLIED!", W / 2, by + 220);
    }

    // Action Buttons
    const btns = [
      {
        x: bx + 28, y: by + 258, w: 175, h: 64,
        bg: "#26305e", border: "#6677bb",
        label: "RETRY [A]", sub: "다시 도전",
        onClick: () => { Audio.uiConfirm(); startEvent(ev.meta.id, 1.0); },
      },
      {
        x: bx + 222, y: by + 258, w: 176, h: 64,
        bg: "#008844", border: "#55ff88",
        label: state.mode === "cup" ? "NEXT [SPACE]" : "MENU [SPACE]",
        sub: state.mode === "cup" ? "다음 종목" : "종목 선택",
        onClick: () => { Audio.uiConfirm(); proceedAfterResult(); },
      },
      {
        x: bx + 416, y: by + 258, w: 176, h: 64,
        bg: "#995500", border: "#ffee33",
        label: "📺 AD +10% [D]", sub: "보상형 광고 재도전",
        onClick: () => triggerRewardedRetry(),
      },
    ];

    btns.forEach((b) => {
      ctx.fillStyle = b.bg;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = b.border;
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = "#fff";
      ctx.font = "900 16px sans-serif";
      ctx.fillText(b.label, b.x + b.w / 2, b.y + 28);
      ctx.fillStyle = "#e0e6ff";
      ctx.font = "700 12px sans-serif";
      ctx.fillText(b.sub, b.x + b.w / 2, b.y + 49);
      addHitBox(b.x, b.y, b.w, b.h, b.onClick);
    });
  }

  function drawCupSummary() {
    ctx.fillStyle = "#10132a";
    ctx.fillRect(0, 0, W, H);
    const char = Sprites.CHARACTERS[state.charIndex];

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffee33";
    ctx.font = "900 42px sans-serif";
    ctx.fillText("🏆 3-EVENT ARCADE CUP COMPLETE!", W / 2, 74);

    Sprites.drawCharacter(ctx, char, 165, 360, { scale: 1.5, pose: "win", phase: state.animTime, mega: true });

    let total = 0;
    state.cupResults.forEach((r, i) => {
      total += r.score;
      const ry = 135 + i * 74;
      ctx.fillStyle = "#191e40";
      ctx.fillRect(290, ry, 540, 60);
      ctx.strokeStyle = r.passed ? "#55ff88" : "#ff4466";
      ctx.lineWidth = 2;
      ctx.strokeRect(290, ry, 540, 60);

      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.font = "900 20px sans-serif";
      ctx.fillText(`${i + 1}. ${r.eventName}`, 310, ry + 37);

      ctx.textAlign = "right";
      ctx.fillStyle = "#ffee33";
      ctx.font = "900 20px monospace";
      ctx.fillText(`${r.recordText}  [${r.medal}]  ${r.score} PTS`, 810, ry + 37);
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "#44ffff";
    ctx.font = "900 34px monospace";
    ctx.fillText(`TOTAL SCORE: ${total.toLocaleString()} PTS`, 560, 405);
    ctx.fillStyle = "#98a0c8";
    ctx.font = "800 16px monospace";
    ctx.fillText(`ALL-TIME BEST: ${state.highScores.cupBest.toLocaleString()} PTS`, 560, 438);

    const bx = 430, by = 458, bw = 260, bh = 52;
    ctx.fillStyle = "#008844";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#55ff88";
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = "#fff";
    ctx.font = "900 18px sans-serif";
    ctx.fillText("BACK TO MENU [SPACE]", bx + bw / 2, by + 33);
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
          recordEventBest(state.activeEvent.meta.id, state.activeEvent.result.score);
          state.screen = "event_result";
        }
      }
    }

    // Render with camera trauma shake offset
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (Juice.shakeX !== 0 || Juice.shakeY !== 0) {
      ctx.translate(W / 2 + Juice.shakeX, H / 2 + Juice.shakeY);
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

// MASH BREAKERS V6: OVERDRIVE MISSION — 4 Re-Themed Original Missions + Live Hype HUD
// 1. NEON OVERPASS (Slipstream Warp Overtake vs Cyber Hoverbike)
// 2. SHIELD BREAKER (Gold Overcharge Hyper-Dash vs CPU Rival)
// 3. ORBITAL DROP (Falling AI Satellite Space Home-Run Launch)
// 4. DRILL BREAKER (Colossal Siege Drill Catch + Core Overheat Counter)
window.MB = window.MB || {};

(function () {
  const EVENT_LIST = [
    {
      id: "overpass",
      name: "NEON OVERPASS",
      krName: "네온 고가도로 추격전",
      desc: "A/D 교대 연타로 사이버 호버바이크 추격! 슬립스트림에서 [SPACE] 워프 추월!",
      demoTip: "MASH [A]/[D] TO CHASE HOVERBIKE → HIT [SPACE] IN SLIPSTREAM FOR WARP!",
      targetLabel: "CLEAR < 4.50s",
      accent: "#ff33aa",
      icon: "🏍️",
    },
    {
      id: "shield",
      name: "SHIELD BREAKER",
      krName: "에너지 방벽 연속 돌파",
      desc: "네온 보안 통로 2레인 돌파! 황금 방벽을 [SPACE]로 깨면 무적 하이퍼 대시!",
      demoTip: "MASH [A]/[D] + [SPACE] TO SMASH SHIELDS! GOLD SHIELD = HYPER DASH!",
      targetLabel: "CLEAR >= 10 GATES",
      accent: "#38f3ff",
      icon: "🛡️",
    },
    {
      id: "orbital",
      name: "ORBITAL DROP",
      krName: "추락 궤도 위성 역발사",
      desc: "5초간 연타 충전 후, 옥상 헬기패드에서 [SPACE] 어퍼컷으로 우주로 역발사!",
      demoTip: "5 SEC MASH CHARGE → HIT [SPACE] IN CYAN ZONE TO LAUNCH BACK TO SPACE!",
      targetLabel: "CLEAR >= 300 KM",
      accent: "#ff8833",
      icon: "🛰️",
    },
    {
      id: "drill",
      name: "DRILL BREAKER",
      krName: "폭주 거대 드릴 저지",
      desc: "초거대 공성 드릴 정면 캐치 + 연타! 코어 과열 시 [SPACE] 카운터 역회전!",
      demoTip: "[SPACE] CATCH IN YELLOW ZONE → MASH [A]/[D] → [SPACE] ON CORE FLASH!",
      targetLabel: "CLEAR >= 5.0m LEFT",
      accent: "#ffee33",
      icon: "⚙️",
    },
  ];

  function drawHudPanel(ctx, x, y, w, h, accent) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + 12, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - 12, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fillStyle = "rgba(8, 12, 28, 0.86)";
    ctx.fill();
    ctx.strokeStyle = accent || "#3e4b8a";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = accent || "#38f3ff";
    ctx.beginPath();
    ctx.moveTo(x + 12, y);
    ctx.lineTo(x + 18, y);
    ctx.lineTo(x + 6, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPowerBar(ctx, x, y, w, h, ratio, label, mega) {
    ctx.save();
    const skew = 8;
    ctx.beginPath();
    ctx.moveTo(x + skew, y);
    ctx.lineTo(x + w + skew, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fillStyle = "rgba(8, 12, 28, 0.88)";
    ctx.fill();

    const clamped = Math.max(0, Math.min(1, ratio));
    if (clamped > 0.005) {
      ctx.save();
      ctx.clip();
      const grad = ctx.createLinearGradient(x, y, x + w, y);
      if (mega) {
        grad.addColorStop(0, "#ff1e56");
        grad.addColorStop(0.5, "#ffee22");
        grad.addColorStop(1, "#38f3ff");
      } else {
        grad.addColorStop(0, "#1288ff");
        grad.addColorStop(0.65, "#ffaa00");
        grad.addColorStop(1, "#ff2255");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, (w + skew) * clamped, h);
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(x, y, (w + skew) * clamped, h * 0.38);
      ctx.restore();
    }

    ctx.strokeStyle = mega ? "#ffee33" : "#4a5a9c";
    ctx.lineWidth = mega ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 900 13px 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = 4;
    ctx.fillText(label, x + 14, y + h - 6);

    if (mega) {
      ctx.fillStyle = "#ffee33";
      ctx.textAlign = "right";
      ctx.fillText("⚡ OVERDRIVE!!", x + w - 6, y + h - 6);
    }
    ctx.restore();
  }

  // LIVE Broadcast Hype Viewer Counter (modern Neo-City broadcast motif!)
  function drawLiveHype(ctx, W, viewers) {
    ctx.save();
    drawHudPanel(ctx, W - 222, 88, 204, 34, "#ff2255");
    const blink = Math.floor(performance.now() / 380) % 2 === 0;
    ctx.fillStyle = blink ? "#ff2255" : "#ff8899";
    ctx.beginPath();
    ctx.arc(W - 196, 105, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 12px monospace";
    const kText = viewers >= 1000 ? `${(viewers / 1000).toFixed(1)}K` : String(Math.floor(viewers));
    ctx.fillText(`LIVE  ${kText} VIEWERS`, W - 183, 109);
    ctx.restore();
  }

  function drawDemoOverlay(ctx, W, meta, timer) {
    ctx.save();
    drawHudPanel(ctx, 96, 124, W - 192, 92, meta.accent);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffee33";
    ctx.font = "italic 900 22px 'Arial Black', sans-serif";
    ctx.fillText(`MISSION // ${meta.name}`, W / 2, 158);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 14px 'Segoe UI', sans-serif";
    ctx.fillText(meta.demoTip, W / 2, 185);
    ctx.fillStyle = "#38f3ff";
    ctx.font = "900 12px monospace";
    ctx.fillText(`LAUNCHING IN ${Math.max(0.1, timer).toFixed(1)}s  ·  PRESS [SPACE] TO SKIP`, W / 2, 206);
    ctx.restore();
  }

  function drawRendaMonitor(ctx, renda) {
    if (!window.MB.showRendaMonitor || !renda) return;
    ctx.save();
    drawHudPanel(ctx, 18, 90, 224, 82, "#ffee33");
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffee33";
    ctx.font = "900 11px monospace";
    ctx.fillText("RENDA TELEMETRY", 36, 108);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 12px monospace";
    ctx.fillText(`CPS: ${String(renda.cps).padStart(2, "0")}  PEAK: ${String(renda.peakCps).padStart(2, "0")}`, 36, 128);
    const modeCol = renda.lastMode === "KOUGO" ? "#55ff88" : renda.lastMode === "DOUJI" ? "#38f3ff" : "#ffaa44";
    ctx.fillStyle = modeCol;
    ctx.fillText(`MODE: ${renda.lastMode.padEnd(5, " ")} STREAK: ${renda.kougoStreak}`, 36, 147);
    ctx.fillStyle = "#98a8d8";
    ctx.fillText("CURVE: NON-LINEAR", 36, 164);
    ctx.restore();
  }

  // =========================================================
  // MISSION 01: NEON OVERPASS (SLIPSTREAM WARP vs HOVERBIKE)
  // =========================================================
  function createOverpassEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    const renda = window.MB.Renda.createTracker();
    return {
      meta: EVENT_LIST[0],
      renda,
      phase: "demo",
      demoTimer: 1.8,
      countdown: 2.0,
      lastCountNum: 4,
      elapsed: 0,
      distance: 0,
      speed: 0,
      rivalDist: 4.5, // Hoverbike starts slightly ahead so you chase into its slipstream!
      rivalSpeed: 0,
      viewers: 14200,
      megaActive: false,
      warpAvailable: false,
      warpUsed: false,
      warpCursor: 0,
      runPhase: 0,
      ghostTimer: 0,
      finishTimer: 0,
      result: null,

      onInput(type) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        const PixiFX = window.MB.PixiFX;

        if (this.phase === "demo" && type === "action") {
          this.phase = "countdown";
          Audio.uiConfirm();
          return;
        }
        if (this.phase !== "race") return;

        if (type === "left" || type === "right") {
          const r = this.renda.register(type, this.speed / 46);
          const gain = 4.3 * r.effectiveGain * char.mashMult * char.speedMult * bonus;
          this.speed = Math.min(55, this.speed + gain);
          this.viewers += 420 + r.streak * 65;
          Audio.mash(this.speed / 48);

          Juice.spawnBurst(235, 492, 5, char.trailColors, 220, { angleBase: Math.PI, spread: 0.5, upBias: 40, kind: "spark" });
          if (char.id === "rex" && this.speed > 20) Juice.spawnLightning(245, 470, 165, 492, "#ffee33");

          if (this.speed > 36 && !this.megaActive) {
            this.megaActive = true;
            this.viewers += 35000;
            Audio.megaMash();
            Audio.setBgm("fever");
            Juice.feedback("medium", 275, 430, "#ff33aa");
            Juice.triggerCutIn(char, "OVERDRIVE!!", "NEON HIGHWAY BREAKTHROUGH!", "#ff33aa");
          }
        } else if (type === "action" && this.warpAvailable && !this.warpUsed) {
          this.warpUsed = true;
          this.warpAvailable = false;
          const err = Math.abs(this.warpCursor - 0.5);
          if (err < 0.17) {
            this.speed = Math.min(64, this.speed + 18 * char.powerMult);
            this.megaActive = true;
            this.viewers += 88000;
            Audio.boost();
            Audio.setBgm("fever");
            if (PixiFX) PixiFX.spawnGlowBurst(320, 440, 0xff33aa, 30);
            Juice.feedback("large", 320, 440, "#ff33aa");
            Juice.triggerCutIn(char, "WARP OVERTAKE!!", "SLIPSTREAM HYPER BOOST!", "#ffee33");
            Juice.spawnText(480, 170, "WARP OVERTAKE!!", "#38f3ff", 44);
          } else if (err < 0.34) {
            this.speed = Math.min(56, this.speed + 9.5);
            this.viewers += 28000;
            Audio.boost();
            Juice.feedback("medium", 320, 440, "#ffee44");
            Juice.spawnText(480, 195, "SLIPSTREAM BOOST!", "#ffee44", 32);
          } else {
            this.speed = Math.max(8, this.speed * 0.72);
            Audio.fail();
            Juice.spawnText(480, 195, "AIR DRAG!", "#ff4466", 30);
          }
        }
      },

      update(dt) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        this.renda.update();

        if (this.phase === "demo") {
          this.demoTimer -= dt;
          this.runPhase += dt * 1.2;
          if (this.demoTimer <= 0) {
            this.phase = "countdown";
            Audio.announce("Ready!");
          }
          return;
        }

        if (this.phase === "countdown") {
          this.countdown -= dt;
          const num = Math.ceil(this.countdown);
          if (num < this.lastCountNum && num > 0) {
            this.lastCountNum = num;
            Audio.countdown(false);
            Juice.spawnText(480, 235, String(num), "#ffee33", 76);
            Juice.addZoomKick(0.02);
          }
          if (this.countdown <= 0) {
            this.phase = "race";
            Audio.countdown(true);
            Audio.setBgm("race");
            Juice.spawnText(480, 220, "GO!! CHASE THE HOVERBIKE!", "#ff33aa", 46);
            Juice.addTrauma(0.28);
          }
          return;
        }

        if (this.phase === "race") {
          this.elapsed += dt;
          this.speed = Math.max(0, this.speed - (11.5 + this.speed * 0.28) * dt);
          this.distance += this.speed * dt;
          this.runPhase += dt * (0.65 + this.speed * 0.14);
          this.viewers += this.speed * 140 * dt;

          Juice.zoomTarget = 1.0 + Math.min(0.055, (this.speed / 55) * 0.055);
          const targetRival = this.elapsed < 0.7 ? 32 * (this.elapsed / 0.7) : 28.0;
          this.rivalSpeed += (targetRival - this.rivalSpeed) * Math.min(1, dt * 6);
          this.rivalDist = Math.min(112, this.rivalDist + this.rivalSpeed * dt);
          Juice.speedLineIntensity = Math.max(0, Math.min(1, (this.speed - 19) / 24));

          if (this.speed > 24) {
            this.ghostTimer += dt;
            if (this.ghostTimer > (this.megaActive ? 0.042 : 0.08)) {
              this.ghostTimer = 0;
              Juice.spawnAfterimage(245, 496, char, { scale: 1.05, pose: "run", phase: this.runPhase - 0.16 });
            }
          }

          // Slipstream Warp window activates when chasing mid-highway (36..78m)
          if (!this.warpUsed && this.distance >= 36 && this.distance <= 78) {
            this.warpAvailable = true;
            this.warpCursor = (this.distance - 36) / 42;
          } else {
            this.warpAvailable = false;
          }

          if (this.distance >= 100) {
            this.distance = 100;
            this.phase = "finish";
            Juice.speedLineIntensity = 0;
            Juice.zoomTarget = 1.0;
            Audio.setBgm("menu");
            const t = this.elapsed;
            const passed = t <= 4.5;
            const beatBike = this.distance >= this.rivalDist;
            const medal = t <= 3.15 ? "S-RANK" : t <= 3.55 ? "GOLD" : t <= 4.05 ? "SILVER" : passed ? "BRONZE" : "FAIL";
            const score = Math.max(100, Math.round((6.5 - Math.min(6.4, t)) * 1200));
            if (passed) Audio.win(); else Audio.fail();
            Juice.feedback(passed ? "large" : "medium", 480, 420, passed ? "#ff33aa" : "#ff3355");
            this.result = {
              passed,
              medal,
              score,
              viewers: Math.round(this.viewers),
              recordText: `${t.toFixed(2)} sec`,
              detailText: beatBike
                ? `사이버 호버바이크 워프 추월! (LIVE ${(this.viewers / 1000).toFixed(1)}K)`
                : passed
                  ? `고가도로 돌파 성공! (LIVE ${(this.viewers / 1000).toFixed(1)}K)`
                  : "4.50초 이내 돌파에 아쉽게 실패했습니다.",
            };
          }
        } else if (this.phase === "finish") {
          this.finishTimer += dt;
          this.speed = Math.max(0, this.speed - 38 * dt);
          this.rivalDist += this.rivalSpeed * 0.4 * dt;
          this.runPhase += dt * 0.8;
        }
      },

      draw(ctx, W, H) {
        const Sprites = window.MB.Sprites;
        const Juice = window.MB.Juice;
        const scrollX = this.distance * 54;
        Sprites.drawStageBg(ctx, W, H, scrollX, "overpass");

        // Wet Neon Asphalt Dual-Lane Highway
        Sprites.drawROZPerspectiveFloor(ctx, W, 424, 354, scrollX, "#14192e", "#1e2645", "rgba(255,51,170,0.22)");
        Sprites.drawROZPerspectiveFloor(ctx, W, H, 424, scrollX, "#1c223d", "#0c1022", "rgba(56,243,255,0.24)");
        ctx.fillStyle = "#ff33aa";
        ctx.fillRect(0, 354, W, 3);
        ctx.fillStyle = "#ffee33";
        ctx.fillRect(0, 422, W, 4);

        for (let m = 0; m <= 100; m += 10) {
          const mx = 270 + (m - this.distance) * 54;
          if (mx < -70 || mx > W + 70) continue;
          if (m === 100) {
            const gGrad = ctx.createLinearGradient(mx - 22, 354, mx + 22, 354);
            gGrad.addColorStop(0, "rgba(255, 51, 170, 0)");
            gGrad.addColorStop(0.5, "rgba(255, 51, 170, 0.6)");
            gGrad.addColorStop(1, "rgba(255, 51, 170, 0)");
            ctx.fillStyle = gGrad;
            ctx.fillRect(mx - 22, 220, 44, 320);
            ctx.fillStyle = "#ffee33";
            ctx.fillRect(mx - 4, 354, 10, 186);
          } else {
            ctx.fillStyle = "rgba(56,243,255,0.45)";
            ctx.fillRect(mx, 358, 4, 182);
          }
          ctx.fillStyle = m === 100 ? "#ffee33" : "#ffffff";
          ctx.font = "italic 900 17px 'Arial Black', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(m === 100 ? "FINISH!!" : `${m}m`, mx, 446);
        }

        // Cyber Hoverbike Rival on Upper Highway Lane
        const bikeX = 270 + (this.rivalDist - this.distance) * 54;
        if (bikeX > -260 && bikeX < W + 260) {
          Sprites.drawHoverbike(ctx, bikeX, 412, this.phase === "race" ? this.rivalSpeed / 28 : 0.2);
          ctx.fillStyle = "#ff44cc";
          ctx.font = "italic 900 12px 'Arial Black', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("TARGET: HOVERBIKE", bikeX, 336);
        }

        Juice.drawAfterimages(ctx);
        const charX = this.phase === "finish" ? Math.min(640, 270 + this.finishTimer * 180) : 270;
        const stretch = 1 + Math.min(0.24, this.speed * 0.005);
        Sprites.drawCharacter(ctx, char, charX, 496, {
          scale: 1.08,
          pose: this.phase === "finish" ? (this.result.passed ? "win" : "fail") : (this.speed > 1 ? "run" : "idle"),
          phase: this.runPhase,
          mega: this.megaActive,
          scaleX: stretch,
          scaleY: 1 / Math.sqrt(stretch),
        });

        // Slipstream Warp Bar
        if (this.warpAvailable) {
          const bx = 270, by = 112, bw = 420, bh = 32;
          drawHudPanel(ctx, bx - 16, by - 34, bw + 32, bh + 48, "#ff33aa");
          ctx.fillStyle = "#ffee33";
          ctx.font = "italic 900 15px 'Arial Black', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚡ SLIPSTREAM LOCK! PRESS [SPACE] FOR WARP OVERTAKE!", 480, by - 12);
          ctx.fillStyle = "#162044";
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = "#ff33aa";
          ctx.fillRect(bx + bw * 0.22, by, bw * 0.56, bh);
          ctx.fillStyle = "#38f3ff";
          ctx.fillRect(bx + bw * 0.36, by, bw * 0.28, bh);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, bw, bh);
          const cx = bx + this.warpCursor * bw;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(cx - 5, by - 6, 10, bh + 12);
        }

        drawHudPanel(ctx, 18, 14, 248, 66, "#ff33aa");
        ctx.fillStyle = "#ff99dd";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("MISSION 01 // NEON OVERPASS", 38, 34);
        ctx.fillStyle = "#ffee33";
        ctx.font = "900 30px monospace";
        ctx.fillText(`${this.elapsed.toFixed(2)}s`, 36, 68);

        drawPowerBar(ctx, 290, 18, 372, 26, this.speed / 45, `SPEED: ${Math.round(this.speed * 28)} km/h`, this.megaActive);
        drawPowerBar(ctx, 290, 52, 372, 20, this.distance / 100, `DIST: ${Math.floor(this.distance)} / 100m`, false);

        const gap = this.distance - this.rivalDist;
        drawHudPanel(ctx, 694, 14, 248, 66, gap >= 0 ? "#55ff88" : "#ff33aa");
        ctx.fillStyle = gap >= 0 ? "#55ff88" : "#ff88cc";
        ctx.font = "italic 900 15px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`VS BIKE: ${gap >= 0 ? "+" : ""}${gap.toFixed(1)}m`, 818, 41);
        ctx.fillStyle = "#ffee33";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.fillText("CLEAR < 4.50s | GOLD < 3.55s", 818, 63);

        drawLiveHype(ctx, W, this.viewers);
        drawRendaMonitor(ctx, this.renda);
        if (this.phase === "demo") drawDemoOverlay(ctx, W, this.meta, this.demoTimer);
      },
    };
  }

  // =========================================================
  // MISSION 02: SHIELD BREAKER (GOLD OVERCHARGE HYPER-DASH!)
  // =========================================================
  function createShieldEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    const renda = window.MB.Renda.createTracker();
    const rivalChar = window.MB.Sprites.CHARACTERS.find((c) => c.id !== char.id) || window.MB.Sprites.CHARACTERS[2];
    const spacing = 14.0;
    const gates = [];
    const rivalGates = [];
    for (let i = 1; i <= 44; i++) {
      gates.push({ dist: i * spacing, broken: false, isGold: i % 4 === 0 });
      rivalGates.push({ dist: i * spacing, broken: false, isGold: i % 4 === 0 });
    }

    return {
      meta: EVENT_LIST[1],
      renda,
      phase: "demo",
      demoTimer: 1.8,
      countdown: 2.0,
      lastCountNum: 4,
      timeLeft: 18.0,
      distance: 0,
      speed: 0,
      brokenCount: 0,
      combo: 0,
      hyperDashTimer: 0, // Invincible auto-smash dash from Gold Shields!
      smashAnim: 0,
      stumbleTimer: 0,
      rivalDist: 0,
      rivalCount: 0,
      rivalSmash: 0,
      viewers: 18500,
      megaActive: false,
      runPhase: 0,
      ghostTimer: 0,
      finishTimer: 0,
      result: null,

      onInput(type) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        const PixiFX = window.MB.PixiFX;

        if (this.phase === "demo" && type === "action") {
          this.phase = "countdown";
          Audio.uiConfirm();
          return;
        }
        if (this.phase !== "race") return;

        if (type === "left" || type === "right") {
          const r = this.renda.register(type, this.speed / 36);
          const gain = (this.stumbleTimer > 0 ? 1.8 : 3.9) * r.effectiveGain * char.mashMult * char.speedMult * bonus;
          this.speed = Math.min(44, this.speed + gain);
          this.viewers += 360 + this.combo * 85;
          Audio.mash(this.speed / 38);
          Juice.spawnBurst(245, 492, 4, char.trailColors, 190, { angleBase: Math.PI, spread: 0.5, upBias: 35, kind: "spark" });
        } else if (type === "action") {
          this.smashAnim = 0.28;
          const next = gates.find((g) => !g.broken && g.dist >= this.distance - 1.5 && g.dist <= this.distance + 8.5);
          if (next) {
            next.broken = true;
            this.brokenCount += 1;
            this.combo += 1;
            const err = Math.abs(next.dist - (this.distance + 2.8));
            const isPerfect = err < 2.3;
            this.speed = Math.min(46, this.speed + (isPerfect ? 6.5 : 3.2) * char.powerMult);
            this.viewers += next.isGold ? 55000 : isPerfect ? 14000 : 6000;
            Audio.impactHeavy();
            if (PixiFX) PixiFX.spawnIceShatter(350, 420, next.isGold ? 42 : 24);
            Juice.feedback(next.isGold || isPerfect ? "medium" : "small", 350, 420, next.isGold ? "#ffee33" : "#38f3ff");
            Juice.spawnBurst(350, 420, 20, next.isGold ? ["#ffee33", "#ffaa00", "#ffffff"] : ["#38f3ff", "#0088ff", "#ffffff"], 390, { kind: "spark" });

            if (next.isGold) {
              // GOLD OVERCHARGE HYPER DASH!
              this.hyperDashTimer = 1.6;
              this.speed = 46;
              this.megaActive = true;
              Audio.megaMash();
              Audio.setBgm("fever");
              Juice.triggerCutIn(char, "HYPER DASH!!", "GOLD SHIELD OVERCHARGE!", "#ffee33");
              Juice.spawnText(420, 310, "★ HYPER DASH!! AUTO-SMASH! ★", "#ffee33", 32);
            } else {
              Juice.spawnText(390, 330, isPerfect ? `BREACH!! x${this.combo}` : "BREAK!", isPerfect ? "#38f3ff" : "#ffee33", isPerfect ? 34 : 26);
            }
          } else {
            Audio.uiMove();
          }
        }
      },

      update(dt) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        const PixiFX = window.MB.PixiFX;
        this.renda.update();

        if (this.phase === "demo") {
          this.demoTimer -= dt;
          this.runPhase += dt * 1.2;
          if (this.demoTimer <= 0) {
            this.phase = "countdown";
            Audio.announce("Ready!");
          }
          return;
        }

        if (this.phase === "countdown") {
          this.countdown -= dt;
          const num = Math.ceil(this.countdown);
          if (num < this.lastCountNum && num > 0) {
            this.lastCountNum = num;
            Audio.countdown(false);
            Juice.spawnText(480, 235, String(num), "#ffee33", 76);
            Juice.addZoomKick(0.02);
          }
          if (this.countdown <= 0) {
            this.phase = "race";
            Audio.countdown(true);
            Audio.setBgm("race");
            Juice.spawnText(480, 210, "GO!! BREACH THE SHIELDS!", "#38f3ff", 46);
          }
          return;
        }

        if (this.phase === "race") {
          this.timeLeft = Math.max(0, this.timeLeft - dt);
          if (this.smashAnim > 0) this.smashAnim = Math.max(0, this.smashAnim - dt);
          if (this.stumbleTimer > 0) this.stumbleTimer = Math.max(0, this.stumbleTimer - dt);
          if (this.rivalSmash > 0) this.rivalSmash = Math.max(0, this.rivalSmash - dt);

          if (this.hyperDashTimer > 0) {
            this.hyperDashTimer = Math.max(0, this.hyperDashTimer - dt);
            this.speed = Math.max(this.speed, 42);
            this.smashAnim = 0.15;
          } else {
            this.speed = Math.max(0, this.speed - (10.5 + this.speed * 0.25) * dt);
          }

          this.distance += this.speed * dt;
          this.runPhase += dt * (0.7 + this.speed * 0.16);
          Juice.speedLineIntensity = Math.max(0, Math.min(1, (this.speed - 18) / 20));

          const hit = gates.find((g) => !g.broken && g.dist <= this.distance + 1.8);
          if (hit) {
            hit.broken = true;
            if (this.hyperDashTimer > 0) {
              // Auto-shatter during invincible Hyper Dash!
              this.brokenCount += 1;
              this.combo += 1;
              this.viewers += 22000;
              Audio.impactHeavy();
              if (PixiFX) PixiFX.spawnIceShatter(350, 420, 28);
              Juice.addTrauma(0.28);
              Juice.spawnText(390, 330, `AUTO-BREACH x${this.combo}!`, "#ffee33", 30);
            } else {
              this.combo = 0;
              this.stumbleTimer = 0.35;
              this.speed = Math.max(4, this.speed * 0.38);
              Audio.impactMedium();
              Juice.addTrauma(0.32);
              Juice.spawnText(360, 345, "BLOCKED! HIT [SPACE]!", "#ff5566", 24);
            }
          }

          // Upper Lane CPU Rival
          this.rivalDist += 12.6 * dt;
          const rHit = rivalGates.find((g) => !g.broken && g.dist <= this.rivalDist + 2.2);
          if (rHit) {
            rHit.broken = true;
            this.rivalCount += 1;
            this.rivalSmash = 0.25;
            if (PixiFX) PixiFX.spawnIceShatter(320 + (rHit.dist - this.distance) * 32, 330, 12);
          }

          if (this.speed > 22) {
            this.ghostTimer += dt;
            if (this.ghostTimer > 0.055) {
              this.ghostTimer = 0;
              Juice.spawnAfterimage(255, 496, char, { scale: 1.04, pose: this.smashAnim > 0 ? "smash" : "run", phase: this.runPhase - 0.12 });
            }
          }

          if (this.timeLeft <= 0) {
            this.phase = "finish";
            Juice.speedLineIntensity = 0;
            Audio.setBgm("menu");
            const pcs = this.brokenCount;
            const passed = pcs >= 10;
            const medal = pcs >= 22 ? "S-RANK" : pcs >= 16 ? "GOLD" : pcs >= 13 ? "SILVER" : passed ? "BRONZE" : "FAIL";
            const score = pcs * 320 + Math.round(this.distance * 4);
            if (passed) Audio.win(); else Audio.fail();
            Juice.feedback(passed ? "large" : "medium", 480, 410, passed ? "#38f3ff" : "#ff3355");
            this.result = {
              passed,
              medal,
              score,
              viewers: Math.round(this.viewers),
              recordText: `${pcs} GATES`,
              detailText: pcs >= this.rivalCount
                ? `라이벌(${this.rivalCount} GATES) 격파! (LIVE ${(this.viewers / 1000).toFixed(1)}K)`
                : passed
                  ? `보안 구역 돌파 성공! (LIVE ${(this.viewers / 1000).toFixed(1)}K)`
                  : `에너지 방벽 10개 이상 돌파가 필요합니다.`,
            };
          }
        } else if (this.phase === "finish") {
          this.finishTimer += dt;
          this.speed = Math.max(0, this.speed - 36 * dt);
        }
      },

      draw(ctx, W, H) {
        const Sprites = window.MB.Sprites;
        const Juice = window.MB.Juice;
        const scrollX = this.distance * 36;
        Sprites.drawStageBg(ctx, W, H, scrollX, "corridor");

        Sprites.drawROZPerspectiveFloor(ctx, W, 385, 330, scrollX, "#112238", "#1a3554", "rgba(56,243,255,0.22)");
        Sprites.drawROZPerspectiveFloor(ctx, W, H, 425, scrollX, "#152b47", "#0a1628", "rgba(255,238,51,0.22)");

        ctx.fillStyle = "#091020";
        ctx.fillRect(0, 384, W, 42);
        ctx.fillStyle = "#38f3ff";
        ctx.fillRect(0, 384, W, 3);
        ctx.fillRect(0, 424, W, 3);

        rivalGates.forEach((g) => {
          if (g.broken) return;
          const bx = 265 + (g.dist - this.distance) * 36;
          if (bx < -100 || bx > W + 100) return;
          Sprites.drawEnergyBarrier(ctx, bx, 380, 120, g.isGold, false);
        });
        const rX = 265 + (this.rivalDist - this.distance) * 36;
        if (rX > -140 && rX < W + 140) {
          Sprites.drawCharacter(ctx, rivalChar, rX, 382, { scale: 0.78, pose: this.rivalSmash > 0 ? "punch" : "run", phase: this.runPhase * 0.9 });
        }

        gates.forEach((g) => {
          if (g.broken) return;
          const bx = 265 + (g.dist - this.distance) * 36;
          if (bx < -120 || bx > W + 120) return;
          const inSweet = g.dist >= this.distance - 1.0 && g.dist <= this.distance + 8.0;
          ctx.fillStyle = g.isGold ? "rgba(255, 238, 51, 0.5)" : inSweet ? "rgba(56, 243, 255, 0.45)" : "rgba(56, 243, 255, 0.18)";
          ctx.fillRect(bx - 95, 488, 90, 14);
          Sprites.drawEnergyBarrier(ctx, bx, 496, 165, g.isGold, inSweet);
        });

        Juice.drawAfterimages(ctx);
        Sprites.drawCharacter(ctx, char, 265, 496, {
          scale: 1.06,
          pose: this.phase === "finish" ? (this.result.passed ? "win" : "fail") : (this.smashAnim > 0 ? "smash" : (this.speed > 1 ? "run" : "idle")),
          phase: this.runPhase,
          mega: this.megaActive || this.hyperDashTimer > 0,
        });

        ctx.save();
        ctx.textAlign = "right";
        ctx.font = "900 44px monospace";
        ctx.strokeStyle = "#080c1c";
        ctx.lineWidth = 6;
        ctx.strokeText(String(this.rivalCount).padStart(2, "0"), W - 26, 366);
        ctx.fillStyle = "#ff2255";
        ctx.fillText(String(this.rivalCount).padStart(2, "0"), W - 26, 366);
        ctx.strokeText(String(this.brokenCount).padStart(2, "0"), W - 26, 488);
        ctx.fillStyle = this.hyperDashTimer > 0 ? "#ffee33" : "#38f3ff";
        ctx.fillText(String(this.brokenCount).padStart(2, "0"), W - 26, 488);
        ctx.restore();

        drawHudPanel(ctx, 18, 14, 242, 66, "#38f3ff");
        ctx.fillStyle = "#8ce0ff";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("MISSION 02 // SHIELD BREAKER", 38, 34);
        ctx.fillStyle = this.timeLeft < 5 ? "#ff3355" : "#ffee33";
        ctx.font = "900 30px monospace";
        ctx.fillText(`${this.timeLeft.toFixed(1)}s`, 36, 68);

        drawPowerBar(ctx, 284, 18, 384, 26, this.brokenCount / 22, this.hyperDashTimer > 0 ? "★ HYPER DASH INVINCIBLE!! ★" : `BREACHED: ${this.brokenCount} GATES (x${this.combo})`, this.megaActive || this.hyperDashTimer > 0);
        drawPowerBar(ctx, 284, 52, 384, 20, this.speed / 44, `SPEED: ${Math.round(this.speed * 18)} km/h`, false);

        drawHudPanel(ctx, 694, 14, 248, 66, "#ffee33");
        ctx.fillStyle = "#ffffff";
        ctx.font = "italic 900 14px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`YOU ${this.brokenCount}  vs  RIVAL ${this.rivalCount}`, 818, 40);
        ctx.fillStyle = "#38f3ff";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.fillText("CLEAR 10+  |  GOLD 16+", 818, 63);

        drawLiveHype(ctx, W, this.viewers);
        drawRendaMonitor(ctx, this.renda);
        if (this.phase === "demo") drawDemoOverlay(ctx, W, this.meta, this.demoTimer);
      },
    };
  }

  // =========================================================
  // MISSION 03: ORBITAL DROP (SATELLITE SPACE HOME-RUN LAUNCH!)
  // =========================================================
  function createOrbitalEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    const renda = window.MB.Renda.createTracker();
    return {
      meta: EVENT_LIST[2],
      renda,
      phase: "demo",
      demoTimer: 1.8,
      countdown: 2.0,
      lastCountNum: 4,
      chargeTime: 5.0,
      power: 0,
      viewers: 22400,
      megaActive: false,
      aimPos: 0,
      aimDir: 1,
      aimTimer: 0,
      satY: 128,
      launched: false,
      launchT: 0,
      animPhase: 0,
      finishTimer: 0,
      result: null,

      onInput(type) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;

        if (this.phase === "demo" && type === "action") {
          this.phase = "countdown";
          Audio.uiConfirm();
          return;
        }

        if (this.phase === "charge" && (type === "left" || type === "right")) {
          const r = this.renda.register(type, this.power / 105);
          const gain = 3.25 * r.effectiveGain * char.mashMult * bonus;
          this.power = Math.min(125, this.power + gain);
          this.viewers += 580 + r.streak * 95;
          Audio.mash(this.power / 100);
          Juice.addTrauma(0.09);
          Juice.spawnBurst(480, 445, 5, char.trailColors, 240, { upBias: 150, kind: "spark" });
          if (this.power > 40) {
            Juice.spawnLightning(480 + (Math.random() - 0.5) * 90, 430, 480 + (Math.random() - 0.5) * 160, this.satY + 95, char.aura);
          }
          if (this.power >= 85 && !this.megaActive) {
            this.megaActive = true;
            this.viewers += 48000;
            Audio.megaMash();
            Audio.setBgm("fever");
            Juice.feedback("medium", 480, 430, "#ffee33");
            Juice.triggerCutIn(char, "OVERDRIVE!!", "ORBITAL LAUNCH POWER MAX!", "#ffee33");
          }
        } else if (this.phase === "aim" && type === "action") {
          this.executeLaunch();
        }
      },

      executeLaunch() {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        const PixiFX = window.MB.PixiFX;
        this.phase = "finish";
        Juice.zoomTarget = 1.0;
        Audio.setBgm("menu");
        const err = Math.abs(this.aimPos - 0.5);
        const timingMult = err < 0.08 ? 1.45 : err < 0.18 ? 1.15 : err < 0.32 ? 0.82 : 0.45;
        const timingLabel = err < 0.08 ? "ORBITAL HOME RUN!!" : err < 0.18 ? "GREAT LAUNCH!" : err < 0.32 ? "GOOD" : "WEAK DEFLECTION...";
        const km = Math.round(this.power * 4.8 * char.powerMult * timingMult);
        const passed = km >= 300;

        this.launched = passed;
        this.viewers += passed ? 120000 : 15000;
        Audio.impactHeavy();
        if (PixiFX) PixiFX.spawnGlowBurst(480, this.satY + 40, 0x38f3ff, 36);
        Juice.feedback("large", 480, this.satY + 40, passed ? "#38f3ff" : "#ff4455");
        Juice.spawnBurst(480, this.satY + 40, passed ? 40 : 14, ["#ffee44", "#38f3ff", "#ff6622", "#ffffff"], 560, { kind: "spark" });
        if (err < 0.12 && passed) {
          Audio.announce("Orbital Home Run!");
          Juice.triggerCutIn(char, "ORBITAL HOME RUN!!", `LAUNCHED ${km} KM TO SPACE!`, "#38f3ff");
        }
        Juice.spawnText(480, 145, timingLabel, err < 0.18 ? "#38f3ff" : "#ffaa44", 38);
        Juice.spawnText(480, 205, `${km} KM ALTITUDE!!`, "#ffee33", 50);

        const medal = km >= 700 ? "S-RANK" : km >= 560 ? "GOLD" : km >= 420 ? "SILVER" : passed ? "BRONZE" : "FAIL";
        const score = Math.round(km * 8.5);
        setTimeout(() => { if (passed) Audio.win(); else Audio.fail(); }, 280);

        this.result = {
          passed,
          medal,
          score,
          viewers: Math.round(this.viewers),
          recordText: `${km} KM`,
          detailText: passed
            ? `추락 위성을 대기권 밖 ${km}km로 역발사! (LIVE ${(this.viewers / 1000).toFixed(1)}K)`
            : "파워가 부족해 위성을 궤도로 되돌리지 못했습니다. (300 KM 필요)",
        };
      },

      update(dt) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        this.animPhase += dt;
        this.renda.update();

        if (this.phase === "demo") {
          this.demoTimer -= dt;
          if (this.demoTimer <= 0) {
            this.phase = "countdown";
            Audio.announce("Ready!");
          }
          return;
        }

        if (this.phase === "countdown") {
          this.countdown -= dt;
          const num = Math.ceil(this.countdown);
          if (num < this.lastCountNum && num > 0) {
            this.lastCountNum = num;
            Audio.countdown(false);
            Juice.spawnText(480, 250, String(num), "#ffee33", 76);
            Juice.addZoomKick(0.02);
          }
          if (this.countdown <= 0) {
            this.phase = "charge";
            Audio.countdown(true);
            Audio.setBgm("race");
            Juice.spawnText(480, 240, "MASH A / D TO CHARGE LAUNCH!", "#ff8833", 44);
          }
          return;
        }

        if (this.phase === "charge") {
          this.chargeTime -= dt;
          const progress = 1 - this.chargeTime / 5.0;
          this.satY = 128 + progress * 88;
          Juice.zoomTarget = 1.0 + progress * 0.065;
          Juice.speedLineIntensity = Math.min(1, this.power / 95);
          if (this.chargeTime <= 0) {
            this.chargeTime = 0;
            this.phase = "aim";
            Juice.zoomTarget = 1.08;
            Audio.countdown(true);
            Juice.spawnText(480, 120, "NOW!! LAUNCH [SPACE]!", "#38f3ff", 46);
          }
        } else if (this.phase === "aim") {
          this.aimTimer += dt;
          this.aimPos += this.aimDir * dt * 1.95;
          if (this.aimPos >= 1) { this.aimPos = 1; this.aimDir = -1; }
          if (this.aimPos <= 0) { this.aimPos = 0; this.aimDir = 1; }
          if (this.aimTimer > 2.8) this.executeLaunch();
        } else if (this.phase === "finish") {
          Juice.speedLineIntensity = 0;
          this.finishTimer += dt;
          if (this.launched) this.launchT = Math.min(1.6, this.launchT + dt);
        }
      },

      draw(ctx, W, H) {
        const Sprites = window.MB.Sprites;
        Sprites.drawStageBg(ctx, W, H, 0, "rooftop");

        const ringPulse = 1 + Math.sin(this.animPhase * 11) * 0.07;
        ctx.save();
        ctx.strokeStyle = this.megaActive ? "#38f3ff" : "#ffee33";
        ctx.lineWidth = 4;
        ctx.shadowColor = this.megaActive ? "#38f3ff" : "#ff8800";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.ellipse(480, 490, 134 * ringPulse, 24 * ringPulse, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        Sprites.drawOrbitalSatellite(ctx, 480, this.satY, 345, this.power / 100, this.launched, this.launchT);

        const pose =
          this.phase === "charge" ? "charge" :
          this.phase === "aim" ? "charge" :
          this.phase === "finish" ? (this.finishTimer < 0.45 ? "punch" : (this.result.passed ? "win" : "fail")) : "idle";
        const punchJump = this.phase === "finish" && this.finishTimer < 0.45 ? -105 * Math.sin((this.finishTimer / 0.45) * Math.PI) : 0;

        Sprites.drawCharacter(ctx, char, 480, 494 + punchJump, {
          scale: 1.12,
          pose,
          phase: this.animPhase,
          mega: this.megaActive,
        });

        if (this.phase === "aim") {
          const bx = 250, by = 326, bw = 460, bh = 34;
          drawHudPanel(ctx, bx - 18, by - 36, bw + 36, bh + 50, "#ffee33");
          ctx.fillStyle = "#ffffff";
          ctx.font = "italic 900 16px 'Arial Black', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚡ HIT [SPACE] IN CYAN ZONE FOR SPACE HOME RUN!", 480, by - 12);
          ctx.fillStyle = "#261830";
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = "#ff7722";
          ctx.fillRect(bx + bw * 0.25, by, bw * 0.5, bh);
          ctx.fillStyle = "#ffee33";
          ctx.fillRect(bx + bw * 0.36, by, bw * 0.28, bh);
          ctx.fillStyle = "#38f3ff";
          ctx.fillRect(bx + bw * 0.44, by, bw * 0.12, bh);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, bw, bh);
          const cx = bx + this.aimPos * bw;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(cx - 5, by - 7, 10, bh + 14);
        }

        drawHudPanel(ctx, 18, 14, 240, 66, "#ff8833");
        ctx.fillStyle = "#ffbb88";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("MISSION 03 // ORBITAL DROP", 38, 34);
        ctx.fillStyle = "#ffee33";
        ctx.font = "900 28px monospace";
        ctx.fillText(this.phase === "charge" ? `${this.chargeTime.toFixed(1)}s` : (this.phase === "aim" ? "LAUNCH!" : "DONE"), 36, 68);

        drawPowerBar(ctx, 276, 22, 408, 36, this.power / 100, `THRUST POWER: ${Math.round(this.power)}%`, this.megaActive);

        drawHudPanel(ctx, 708, 14, 234, 66, "#ffee33");
        ctx.fillStyle = "#ffffff";
        ctx.font = "italic 900 14px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CLEAR: 300+ KM", 825, 40);
        ctx.fillStyle = "#38f3ff";
        ctx.font = "italic 900 13px 'Segoe UI', sans-serif";
        ctx.fillText("GOLD: 560+  |  S: 700+", 825, 63);

        drawLiveHype(ctx, W, this.viewers);
        drawRendaMonitor(ctx, this.renda);
        if (this.phase === "demo") drawDemoOverlay(ctx, W, this.meta, this.demoTimer);
      },
    };
  }

  // =========================================================
  // MISSION 04: DRILL BREAKER (SIEGE DRILL + CORE OVERHEAT COUNTER!)
  // =========================================================
  function createDrillEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    const renda = window.MB.Renda.createTracker();
    return {
      meta: EVENT_LIST[3],
      renda,
      phase: "demo",
      demoTimer: 1.8,
      countdown: 2.0,
      lastCountNum: 4,
      drillDist: 720,
      drillSpeed: 540,
      remainingMeters: 50.0,
      scrollTrack: 0,
      viewers: 31000,
      megaActive: false,
      pushPower: 0,
      coreCounterReady: false,
      coreCounterUsed: false,
      coreCounterTimer: 0,
      animPhase: 0,
      sparkTimer: 0,
      finishTimer: 0,
      result: null,

      onInput(type) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        const PixiFX = window.MB.PixiFX;

        if (this.phase === "demo" && type === "action") {
          this.phase = "countdown";
          Audio.uiConfirm();
          return;
        }

        if (this.phase === "approach" && type === "action") {
          if (this.drillDist <= 140 && this.drillDist >= -25) {
            const err = Math.abs(this.drillDist - 45);
            if (err < 38) {
              this.drillSpeed = 19.5;
              this.viewers += 62000;
              Audio.announce("Perfect Catch!");
              Juice.feedback("large", 360, 420, "#38f3ff");
              Juice.triggerCutIn(char, "PERFECT CATCH!!", "-35% DRILL TORQUE! MASH!", "#38f3ff");
              Juice.spawnText(480, 165, "PERFECT CATCH!!", "#38f3ff", 40);
            } else {
              this.drillSpeed = 24.5;
              this.viewers += 24000;
              Juice.feedback("medium", 360, 420, "#ffee33");
              Juice.spawnText(480, 185, "GOOD CATCH! MASH A / D!", "#ffee33", 34);
            }
            Audio.impactHeavy();
            this.drillDist = 0;
            this.phase = "push";
          } else if (this.drillDist < 260) {
            this.drillSpeed = 28.5;
            this.drillDist = 0;
            Audio.impactMedium();
            Juice.feedback("medium", 360, 420, "#ff8844");
            Juice.spawnText(480, 185, "EARLY CATCH! MASH HARD!!", "#ff8844", 30);
            this.phase = "push";
          }
        } else if (this.phase === "push") {
          if (type === "action" && this.coreCounterReady && !this.coreCounterUsed) {
            // CORE OVERHEAT COUNTER! Reverses drill torque (-42% speed!)
            this.coreCounterUsed = true;
            this.coreCounterReady = false;
            this.drillSpeed = Math.max(0, this.drillSpeed * 0.58);
            this.viewers += 95000;
            Audio.boost();
            Audio.announce("Core Counter!");
            if (PixiFX) PixiFX.spawnGlowBurst(520, 360, 0x38f3ff, 36);
            Juice.feedback("large", 460, 380, "#ffee33");
            Juice.triggerCutIn(char, "CORE COUNTER!!", "DRILL TORQUE REVERSED -42%!", "#ffee33");
            Juice.spawnText(480, 165, "⚡ CORE COUNTER!! -42% SPEED!", "#ffee33", 36);
          } else if (type === "left" || type === "right") {
            const r = this.renda.register(type, this.pushPower / 100);
            const brake = 1.48 * r.effectiveGain * char.mashMult * char.powerMult * bonus;
            this.drillSpeed = Math.max(0, this.drillSpeed - brake);
            this.pushPower = Math.min(100, this.pushPower + 6.5 * r.effectiveGain);
            this.viewers += 640 + r.streak * 80;
            Audio.mash(this.pushPower / 100);
            Juice.addTrauma(0.1);
            Juice.spawnBurst(345, 476, 6, ["#ffee44", "#ff6622", "#38f3ff", "#ffffff"], 290, { angleBase: Math.PI * 0.85, spread: 0.6, upBias: 110, kind: "spark" });

            if (this.pushPower >= 80 && !this.megaActive) {
              this.megaActive = true;
              this.viewers += 42000;
              Audio.megaMash();
              Audio.setBgm("fever");
              Juice.triggerCutIn(char, "OVERDRIVE!!", "REACTOR DEFENSE LOCK!", "#ffee33");
            }
          }
        }
      },

      finishDrill(passed) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        this.phase = "finish";
        Juice.speedLineIntensity = 0;
        Juice.zoomTarget = 1.0;
        Audio.setBgm("menu");
        const m = Math.max(0, this.remainingMeters);
        const ok = passed && m >= 5.0;
        const medal = m >= 30 ? "S-RANK" : m >= 22 ? "GOLD" : m >= 13 ? "SILVER" : ok ? "BRONZE" : "FAIL";
        const score = ok ? Math.round(1800 + m * 140) : Math.round(m * 100);
        if (ok) Audio.win(); else Audio.fail();
        Juice.feedback("large", 360, 420, ok ? "#55ff88" : "#ff2244");

        this.result = {
          passed: ok,
          medal,
          score,
          viewers: Math.round(this.viewers),
          recordText: ok ? `${m.toFixed(1)}m LEFT` : "BREACHED!",
          detailText: ok
            ? `폭주 공성 드릴을 ${m.toFixed(1)}m 앞에서 완벽 저지! (LIVE ${(this.viewers / 1000).toFixed(1)}K)`
            : "터널 방어선이 돌파되었습니다! (5.0m 이상 남기고 저지 필요)",
        };
      },

      update(dt) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        this.animPhase += dt;
        this.renda.update();

        if (this.phase === "demo") {
          this.demoTimer -= dt;
          if (this.demoTimer <= 0) {
            this.phase = "countdown";
            Audio.announce("Ready!");
          }
          return;
        }

        if (this.phase === "countdown") {
          this.countdown -= dt;
          const num = Math.ceil(this.countdown);
          if (num < this.lastCountNum && num > 0) {
            this.lastCountNum = num;
            Audio.countdown(false);
            Juice.spawnText(480, 230, String(num), "#ffee33", 76);
            Juice.addZoomKick(0.02);
          }
          if (this.countdown <= 0) {
            this.phase = "approach";
            Juice.zoomTarget = 1.06;
            Audio.countdown(true);
            Audio.setBgm("race");
            Juice.spawnText(480, 190, "CATCH THE DRILL IN YELLOW ZONE -> [SPACE]!", "#ffee33", 30);
          }
          return;
        }

        if (this.phase === "approach") {
          this.drillDist -= this.drillSpeed * dt;
          Juice.speedLineIntensity = 0.55;
          if (this.drillDist <= -30) {
            this.drillDist = 0;
            this.drillSpeed = 30.5;
            Audio.impactHeavy();
            Juice.feedback("large", 340, 420, "#ff3355");
            Juice.spawnText(480, 185, "MISSED CATCH! MASH A / D NOW!!", "#ff4455", 32);
            this.phase = "push";
          }
        } else if (this.phase === "push") {
          this.pushPower = Math.max(0, this.pushPower - 24 * dt);
          this.remainingMeters -= this.drillSpeed * dt;
          this.scrollTrack -= this.drillSpeed * 32 * dt;
          Juice.speedLineIntensity = Math.min(1, this.drillSpeed / 22);
          Juice.zoomTarget = 1.02 + Math.min(0.05, (this.drillSpeed / 25) * 0.05);

          // Trigger 1-time Core Overheat Counter window when remainingMeters crosses 36m!
          if (!this.coreCounterUsed && !this.coreCounterReady && this.remainingMeters <= 38 && this.drillSpeed > 6) {
            this.coreCounterReady = true;
            this.coreCounterTimer = 1.5;
            Audio.countdown(true);
            Juice.spawnText(480, 150, "⚡ CORE OVERHEAT! HIT [SPACE] COUNTER!", "#ffee33", 30);
          }
          if (this.coreCounterReady) {
            this.coreCounterTimer -= dt;
            if (this.coreCounterTimer <= 0) {
              this.coreCounterReady = false;
              this.coreCounterUsed = true;
            }
          }

          this.sparkTimer += dt;
          if (this.sparkTimer > 0.06 && this.drillSpeed > 2) {
            this.sparkTimer = 0;
            Audio.screech();
            Juice.spawnBurst(365, 476, 5, ["#ffee44", "#ff6622", "#ffffff"], 260, { angleBase: -2.65, spread: 0.55, kind: "spark" });
          }

          if (this.drillSpeed <= 0.1) {
            this.drillSpeed = 0;
            this.finishDrill(true);
          } else if (this.remainingMeters <= 0) {
            this.remainingMeters = 0;
            this.finishDrill(false);
          }
        } else if (this.phase === "finish") {
          this.finishTimer += dt;
        }
      },

      draw(ctx, W, H) {
        const Sprites = window.MB.Sprites;
        Sprites.drawStageBg(ctx, W, H, this.scrollTrack, "tunnel");

        const dangerX = 285 - this.remainingMeters * 14;
        if (dangerX > -50) {
          const dGrad = ctx.createLinearGradient(dangerX - 24, 260, dangerX + 24, 260);
          dGrad.addColorStop(0, "rgba(255, 25, 65, 0)");
          dGrad.addColorStop(0.5, "rgba(255, 25, 65, 0.65)");
          dGrad.addColorStop(1, "rgba(255, 25, 65, 0)");
          ctx.fillStyle = dGrad;
          ctx.fillRect(dangerX - 24, 240, 48, 300);
          ctx.fillStyle = "#ff2244";
          ctx.fillRect(dangerX - 5, 260, 10, 280);
          ctx.fillStyle = "#ffee33";
          ctx.font = "italic 900 17px 'Arial Black', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚠ CORE LINE", dangerX, 288);
        }

        if (this.phase === "approach") {
          ctx.save();
          const czGrad = ctx.createLinearGradient(345, 210, 345, 495);
          czGrad.addColorStop(0, "rgba(255, 238, 51, 0.04)");
          czGrad.addColorStop(1, "rgba(255, 238, 51, 0.34)");
          ctx.fillStyle = czGrad;
          ctx.fillRect(345, 220, 140, 275);
          ctx.strokeStyle = "#ffee33";
          ctx.lineWidth = 3.5;
          ctx.setLineDash([12, 7]);
          ctx.strokeRect(345, 220, 140, 275);
          ctx.setLineDash([]);
          ctx.fillStyle = "#ffee33";
          ctx.font = "italic 900 16px 'Arial Black', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚡ CATCH ZONE [SPACE]", 415, 208);
          ctx.restore();
        }

        const playerX = 290;
        const drillFrontX = playerX + 56 + Math.max(0, this.drillDist);
        Sprites.drawSiegeDrill(ctx, drillFrontX, 494, this.phase === "approach" ? 1 : this.drillSpeed / 25, this.coreCounterReady);

        const pose =
          this.phase === "push" ? "brace" :
          this.phase === "finish" ? (this.result.passed ? "win" : "fail") : "idle";
        Sprites.drawCharacter(ctx, char, playerX, 496, {
          scale: 1.12,
          pose,
          phase: this.animPhase,
          mega: this.megaActive,
        });

        drawHudPanel(ctx, 18, 14, 240, 66, "#ffee33");
        ctx.fillStyle = "#ffee88";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("MISSION 04 // DRILL BREAKER", 38, 34);
        ctx.fillStyle = this.remainingMeters < 10 ? "#ff3355" : "#55ff88";
        ctx.font = "900 28px monospace";
        ctx.fillText(`${this.remainingMeters.toFixed(1)}m`, 36, 68);

        const rpm = this.phase === "approach" ? 9990 : Math.round(this.drillSpeed * 320);
        drawPowerBar(ctx, 282, 18, 386, 26, this.phase === "approach" ? 1 : this.drillSpeed / 28, `DRILL TORQUE: ${rpm} RPM`, false);
        drawPowerBar(ctx, 282, 52, 386, 20, this.pushPower / 100, this.coreCounterReady ? "⚡ PRESS [SPACE] CORE COUNTER!!" : "BRAKE POWER", this.megaActive || this.coreCounterReady);

        drawHudPanel(ctx, 694, 14, 248, 66, "#ffee33");
        ctx.fillStyle = "#ffffff";
        ctx.font = "italic 900 14px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CLEAR: >= 5.0m LEFT", 818, 40);
        ctx.fillStyle = "#38f3ff";
        ctx.font = "italic 900 13px 'Segoe UI', sans-serif";
        ctx.fillText("GOLD: >= 22m  |  S: >= 30m", 818, 63);

        drawLiveHype(ctx, W, this.viewers);
        drawRendaMonitor(ctx, this.renda);
        if (this.phase === "demo") drawDemoOverlay(ctx, W, this.meta, this.demoTimer);
      },
    };
  }

  function createEvent(id, char, powerBonus) {
    if (id === "overpass") return createOverpassEvent(char, powerBonus);
    if (id === "shield") return createShieldEvent(char, powerBonus);
    if (id === "orbital") return createOrbitalEvent(char, powerBonus);
    return createDrillEvent(char, powerBonus);
  }

  window.MB.Events = {
    LIST: EVENT_LIST,
    createEvent,
  };
})();

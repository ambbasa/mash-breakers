// MASH BREAKERS V4 — Namco NB-2 Systems Edition
// Features: RENDA non-linear KOUGO/DOUJI physics, ROZ 2.5D perspective,
// 3-layer audience, skippable pre-event demo, live RENDA monitor, BGM fever lift
window.MB = window.MB || {};

(function () {
  const EVENT_LIST = [
    {
      id: "sprint",
      name: "MACH SPRINT",
      krName: "100m 음속 질주",
      desc: "A / D 교대 연타(KOUGO)로 사이버 레이서를 추월! [SPACE] 소닉 부스트!",
      demoTip: "TAP [A]/[D] ALTERNATING (KOUGO) → PRESS [SPACE] AT CENTER!",
      targetLabel: "QUALIFY < 4.50s",
      theme: "day",
      accent: "#38f3ff",
    },
    {
      id: "ice",
      name: "ICE CRUSHER",
      krName: "초인 얼음 격파",
      desc: "2레인 라이벌과 18초 대결! A/D 질주 + 얼음 기둥 앞에서 [SPACE] 격파!",
      demoTip: "MASH [A]/[D] TO RUN → PRESS [SPACE] AT EACH ICE PILLAR TO SMASH!",
      targetLabel: "QUALIFY >= 10 PCS",
      theme: "glacier",
      accent: "#38f3ff",
    },
    {
      id: "meteor",
      name: "METEOR BREAKER",
      krName: "거대 운석 격파",
      desc: "5초간 미친 연타로 파워 충전 후, 타이밍 바 중앙에서 [SPACE] 어퍼컷!",
      demoTip: "5 SEC RAPID MASH TO CHARGE → HIT [SPACE] IN CYAN ZONE!",
      targetLabel: "QUALIFY >= 300 TONS",
      theme: "sunset",
      accent: "#ff8833",
    },
    {
      id: "train",
      name: "TRAIN STOP",
      krName: "폭주 열차 멈추기",
      desc: "초거대 열차가 노란 존에 들어올 때 [SPACE] 캐치! 이후 폭풍 연타로 정지!",
      demoTip: "PRESS [SPACE] IN YELLOW ZONE TO CATCH → MASH [A]/[D] TO BRAKE!",
      targetLabel: "QUALIFY >= 5.0m LEFT",
      theme: "night",
      accent: "#ff3366",
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
      ctx.fillText("⚡ MEGA MASH!!", x + w - 6, y + h - 6);
    }
    ctx.restore();
  }

  // Skippable 2-second pre-event visual demo banner (like Numan Athletics / Mach Breakers!)
  function drawDemoOverlay(ctx, W, meta, timer) {
    ctx.save();
    drawHudPanel(ctx, 110, 122, W - 220, 92, meta.accent);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffee33";
    ctx.font = "italic 900 22px 'Arial Black', sans-serif";
    ctx.fillText(`${meta.name}  //  HOW TO PLAY`, W / 2, 156);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 15px 'Segoe UI', sans-serif";
    ctx.fillText(meta.demoTip, W / 2, 184);
    ctx.fillStyle = "#38f3ff";
    ctx.font = "900 12px monospace";
    ctx.fillText(`STARTING IN ${Math.max(0.1, timer).toFixed(1)}s  ·  PRESS [SPACE] TO SKIP`, W / 2, 205);
    ctx.restore();
  }

  // Live Namco-style RENDA MONITOR telemetry HUD (toggled via top bar button)
  function drawRendaMonitor(ctx, renda) {
    if (!window.MB.showRendaMonitor || !renda) return;
    ctx.save();
    drawHudPanel(ctx, 18, 92, 232, 86, "#ffee33");
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffee33";
    ctx.font = "900 11px monospace";
    ctx.fillText("RENDA MONITOR (NB-2 SPEC)", 36, 110);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 12px monospace";
    ctx.fillText(`CPS: ${String(renda.cps).padStart(2, "0")}  PEAK: ${String(renda.peakCps).padStart(2, "0")}`, 36, 130);
    const modeCol = renda.lastMode === "KOUGO" ? "#55ff88" : renda.lastMode === "DOUJI" ? "#38f3ff" : "#ffaa44";
    ctx.fillStyle = modeCol;
    ctx.fillText(`MODE: ${renda.lastMode.padEnd(5, " ")} STREAK: ${renda.kougoStreak}`, 36, 149);
    ctx.fillStyle = "#98a8d8";
    ctx.fillText(`W: K=1.00 D=0.68 S=0.42`, 36, 168);
    ctx.restore();
  }

  // =========================================================
  // EVENT 1: MACH SPRINT (100m 음속 질주 vs CYBER DRAG-RACER)
  // =========================================================
  function createSprintEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    const renda = window.MB.Renda.createTracker();
    return {
      meta: EVENT_LIST[0],
      renda,
      phase: "demo", // demo -> countdown -> race -> finish
      demoTimer: 1.9,
      countdown: 2.1,
      lastCountNum: 4,
      elapsed: 0,
      distance: 0,
      speed: 0,
      rivalDist: 0,
      rivalSpeed: 0,
      megaActive: false,
      boostAvailable: false,
      boostUsed: false,
      boostWindowPos: 0,
      runPhase: 0,
      ghostTimer: 0,
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
        if (this.phase !== "race") return;

        if (type === "left" || type === "right") {
          const r = this.renda.register(type, this.speed / 46);
          const gain = 4.25 * r.effectiveGain * char.mashMult * char.speedMult * bonus;
          this.speed = Math.min(55, this.speed + gain);
          Audio.mash(this.speed / 48);

          Juice.spawnBurst(235, 492, 5, char.trailColors, 220, { angleBase: Math.PI, spread: 0.5, upBias: 40, kind: "spark" });
          if (char.id === "rex" && this.speed > 20) {
            Juice.spawnLightning(245, 470, 165, 492, "#ffee33");
          } else if (char.id === "bruno" && this.speed > 18) {
            Juice.spawnBurst(235, 494, 2, ["#4dff88", "#ffee33"], 150, { kind: "smoke", gravity: -30 });
          }

          if (this.speed > 36 && !this.megaActive) {
            this.megaActive = true;
            Audio.megaMash();
            Audio.setBgm("fever");
            Juice.feedback("medium", 275, 430, char.aura);
            Juice.triggerCutIn(char, "MEGA MASH!!", "MACH 1 BREAKTHROUGH!", char.aura);
          }
        } else if (type === "action" && this.boostAvailable && !this.boostUsed) {
          this.boostUsed = true;
          this.boostAvailable = false;
          const distFromCenter = Math.abs(this.boostWindowPos - 0.5);
          if (distFromCenter < 0.16) {
            this.speed = Math.min(62, this.speed + 16.5 * char.powerMult);
            this.megaActive = true;
            Audio.boost();
            Audio.setBgm("fever");
            Juice.feedback("large", 320, 440, "#38f3ff");
            Juice.triggerCutIn(char, "SONIC BOOM!!", "MAX OVERDRIVE BOOST!", "#ffee33");
            Juice.spawnText(480, 170, "SONIC BOOM!!", "#38f3ff", 42);
          } else if (distFromCenter < 0.32) {
            this.speed = Math.min(56, this.speed + 9.5);
            Audio.boost();
            Juice.feedback("medium", 320, 440, "#ffee44");
            Juice.spawnText(480, 195, "TURBO BOOST!", "#ffee44", 34);
          } else {
            this.speed = Math.max(8, this.speed * 0.72);
            Audio.fail();
            Juice.spawnText(480, 195, "STUMBLE!", "#ff4466", 30);
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
            Juice.spawnText(480, 220, "GO!! BEAT THE RACER!", "#55ff88", 50);
            Juice.addTrauma(0.28);
            Juice.addZoomKick(0.04);
          }
          return;
        }

        if (this.phase === "race") {
          this.elapsed += dt;
          this.speed = Math.max(0, this.speed - (11.5 + this.speed * 0.28) * dt);
          this.distance += this.speed * dt;
          this.runPhase += dt * (0.65 + this.speed * 0.14);

          // ROZ dynamic camera zoom responds to velocity!
          Juice.zoomTarget = 1.0 + Math.min(0.055, (this.speed / 55) * 0.055);

          const targetRivalSpeed = this.elapsed < 0.8 ? 34 * (this.elapsed / 0.8) : 29.5;
          this.rivalSpeed += (targetRivalSpeed - this.rivalSpeed) * Math.min(1, dt * 6);
          this.rivalDist = Math.min(108, this.rivalDist + this.rivalSpeed * dt);

          Juice.speedLineIntensity = Math.max(0, Math.min(1, (this.speed - 19) / 24));

          if (this.speed > 24) {
            this.ghostTimer += dt;
            if (this.ghostTimer > (this.megaActive ? 0.042 : 0.08)) {
              this.ghostTimer = 0;
              const stretch = 1 + Math.min(0.24, this.speed * 0.005);
              Juice.spawnAfterimage(245, 496, char, {
                scale: 1.05,
                pose: "run",
                phase: this.runPhase - 0.16,
                scaleX: stretch,
                scaleY: 1 / Math.sqrt(stretch),
              });
            }
          }

          if (!this.boostUsed && this.distance >= 40 && this.distance <= 76) {
            this.boostAvailable = true;
            this.boostWindowPos = (this.distance - 40) / 36;
          } else {
            this.boostAvailable = false;
          }

          if (this.distance >= 100) {
            this.distance = 100;
            this.phase = "finish";
            Juice.speedLineIntensity = 0;
            Juice.zoomTarget = 1.0;
            Audio.setBgm("menu");
            const t = this.elapsed;
            const passed = t <= 4.5;
            const beatRival = this.distance >= this.rivalDist;
            const medal = t <= 3.15 ? "S-RANK" : t <= 3.55 ? "GOLD" : t <= 4.05 ? "SILVER" : passed ? "BRONZE" : "FAIL";
            const score = Math.max(100, Math.round((6.5 - Math.min(6.4, t)) * 1200));
            if (passed) Audio.win(); else Audio.fail();
            Juice.feedback(passed ? "large" : "medium", 480, 420, passed ? "#ffee33" : "#ff3355");
            this.result = {
              passed,
              medal,
              score,
              peakCps: this.renda.peakCps,
              recordText: `${t.toFixed(2)} sec`,
              detailText: beatRival
                ? `사이버 레이서 격파! (PEAK ${this.renda.peakCps} CPS)`
                : passed
                  ? `음속 돌파 합격! (PEAK ${this.renda.peakCps} CPS)`
                  : "4.50초 이내 기록에 아쉽게 실패했습니다.",
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
        const scrollX = this.distance * 52;
        Sprites.drawStageBg(ctx, W, H, scrollX, "day");
        // 3-Layer Parallax Cheering Audience (AUDIENCE_1 / 2 / 3)
        Sprites.draw3LayerAudience(ctx, W, 316, scrollX);

        // ROZ 2.5D Perspective Dual-Lane Speedway
        Sprites.drawROZPerspectiveFloor(ctx, W, 422, 350, scrollX, "#1b223a", "#2b3559", "rgba(56,243,255,0.18)");
        Sprites.drawROZPerspectiveFloor(ctx, W, H, 422, scrollX, "#c83828", "#7d1c16", "rgba(255,230,180,0.22)");

        ctx.fillStyle = "#38f3ff";
        ctx.fillRect(0, 350, W, 3);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 420, W, 5);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(0, 502, W, 4);

        for (let m = 0; m <= 100; m += 10) {
          const mx = 270 + (m - this.distance) * 52;
          if (mx < -70 || mx > W + 70) continue;
          if (m === 100) {
            const gGrad = ctx.createLinearGradient(mx - 22, 350, mx + 22, 350);
            gGrad.addColorStop(0, "rgba(255, 238, 51, 0)");
            gGrad.addColorStop(0.5, "rgba(255, 238, 51, 0.55)");
            gGrad.addColorStop(1, "rgba(255, 238, 51, 0)");
            ctx.fillStyle = gGrad;
            ctx.fillRect(mx - 22, 220, 44, 320);
            ctx.fillStyle = "#ffee33";
            ctx.fillRect(mx - 4, 350, 10, 190);
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fillRect(mx, 354, 4, 186);
          }
          ctx.fillStyle = m === 100 ? "#ffee33" : "#ffffff";
          ctx.font = "italic 900 17px 'Arial Black', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(m === 100 ? "GOAL!!" : `${m}m`, mx, 444);
        }

        const rivalScreenX = 270 + (this.rivalDist - this.distance) * 52;
        if (rivalScreenX > -280 && rivalScreenX < W + 280) {
          Sprites.drawCyberRacer(ctx, rivalScreenX, 412, this.phase === "race" ? this.rivalSpeed / 30 : 0.15);
          ctx.fillStyle = "#ff44aa";
          ctx.font = "italic 900 12px 'Arial Black', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("CPU RIVAL", rivalScreenX, 344);
        }

        Juice.drawAfterimages(ctx);

        const charX = this.phase === "finish" ? Math.min(640, 270 + this.finishTimer * 180) : 270;
        const stretch = 1 + Math.min(0.24, this.speed * 0.005);

        if (this.megaActive && this.phase === "race") {
          ctx.save();
          const coneGrad = ctx.createLinearGradient(charX + 75, 430, charX - 95, 430);
          coneGrad.addColorStop(0, "rgba(255,255,255,0.85)");
          coneGrad.addColorStop(0.4, char.aura + "66");
          coneGrad.addColorStop(1, "rgba(56,243,255,0)");
          ctx.strokeStyle = coneGrad;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(charX - 90, 355);
          ctx.quadraticCurveTo(charX + 82, 435, charX - 90, 515);
          ctx.stroke();
          ctx.restore();
        }

        Sprites.drawCharacter(ctx, char, charX, 496, {
          scale: 1.08,
          pose: this.phase === "finish" ? (this.result.passed ? "win" : "fail") : (this.speed > 1 ? "run" : "idle"),
          phase: this.runPhase,
          mega: this.megaActive,
          scaleX: stretch,
          scaleY: 1 / Math.sqrt(stretch),
        });

        if (this.boostAvailable) {
          const bx = 270, by = 112, bw = 420, bh = 32;
          drawHudPanel(ctx, bx - 16, by - 34, bw + 32, bh + 48, "#38f3ff");
          ctx.fillStyle = "#ffee33";
          ctx.font = "italic 900 15px 'Arial Black', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚡ PRESS [SPACE] AT CENTER FOR SONIC BOOM!", 480, by - 12);
          ctx.fillStyle = "#162044";
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = "#ff9900";
          ctx.fillRect(bx + bw * 0.22, by, bw * 0.56, bh);
          ctx.fillStyle = "#38f3ff";
          ctx.fillRect(bx + bw * 0.36, by, bw * 0.28, bh);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, bw, bh);
          const cx = bx + this.boostWindowPos * bw;
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#38f3ff";
          ctx.shadowBlur = 12;
          ctx.fillRect(cx - 5, by - 6, 10, bh + 12);
          ctx.shadowBlur = 0;
        }

        drawHudPanel(ctx, 18, 14, 248, 66, "#38f3ff");
        ctx.fillStyle = "#8cb4ff";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("MACH SPRINT // VS RACER", 38, 34);
        ctx.fillStyle = "#ffee33";
        ctx.font = "900 30px monospace";
        ctx.fillText(`${this.elapsed.toFixed(2)}s`, 36, 68);

        const kmh = Math.round(this.speed * 28);
        drawPowerBar(ctx, 290, 18, 372, 26, this.speed / 45, `SPEED: ${kmh} km/h`, this.megaActive);
        drawPowerBar(ctx, 290, 52, 372, 20, this.distance / 100, `DIST: ${Math.floor(this.distance)} / 100m`, false);

        const gap = this.distance - this.rivalDist;
        drawHudPanel(ctx, 694, 14, 248, 66, gap >= 0 ? "#55ff88" : "#ff3366");
        ctx.fillStyle = gap >= 0 ? "#55ff88" : "#ff6688";
        ctx.font = "italic 900 15px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`VS CPU: ${gap >= 0 ? "+" : ""}${gap.toFixed(1)}m`, 818, 41);
        ctx.fillStyle = "#ffee33";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.fillText("QUALIFY < 4.50s | GOLD < 3.55s", 818, 63);

        drawRendaMonitor(ctx, this.renda);
        if (this.phase === "demo") drawDemoOverlay(ctx, W, this.meta, this.demoTimer);
      },
    };
  }

  // =========================================================
  // EVENT 2: METEOR BREAKER (COLOSSAL VOLCANIC METEOR + ROZ ZOOM)
  // =========================================================
  function createMeteorEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    const renda = window.MB.Renda.createTracker();
    return {
      meta: EVENT_LIST[3],
      renda,
      phase: "demo",
      demoTimer: 1.9,
      countdown: 2.0,
      lastCountNum: 4,
      chargeTime: 5.0,
      power: 0,
      megaActive: false,
      aimPos: 0,
      aimDir: 1,
      aimTimer: 0,
      meteorY: 128,
      shattered: false,
      shatterT: 0,
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
          Audio.mash(this.power / 100);
          Juice.addTrauma(0.09);
          Juice.spawnBurst(480, 445, 5, char.trailColors, 240, { upBias: 150, kind: "spark" });
          if (this.power > 40) {
            Juice.spawnLightning(480 + (Math.random() - 0.5) * 90, 430, 480 + (Math.random() - 0.5) * 160, this.meteorY + 95, char.aura);
          }
          if (this.power >= 85 && !this.megaActive) {
            this.megaActive = true;
            Audio.megaMash();
            Audio.setBgm("fever");
            Juice.feedback("medium", 480, 430, "#ffee33");
            Juice.triggerCutIn(char, "MEGA MASH!!", "GIGA POWER OVERLOAD!", "#ffee33");
          }
        } else if (this.phase === "aim" && type === "action") {
          this.executeStrike();
        }
      },

      executeStrike() {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        this.phase = "finish";
        Juice.zoomTarget = 1.0;
        Audio.setBgm("menu");
        const err = Math.abs(this.aimPos - 0.5);
        const timingMult = err < 0.08 ? 1.45 : err < 0.18 ? 1.15 : err < 0.32 ? 0.82 : 0.45;
        const timingLabel = err < 0.08 ? "PERFECT UPPERCUT!!" : err < 0.18 ? "GREAT HIT!" : err < 0.32 ? "GOOD" : "GLANCING BLOW...";
        const tons = Math.round(this.power * 4.8 * char.powerMult * timingMult);
        const passed = tons >= 300;

        this.shattered = passed;
        Audio.impactHeavy();
        Juice.feedback("large", 480, this.meteorY + 40, passed ? "#ffee33" : "#ff4455");
        Juice.spawnBurst(480, this.meteorY + 40, passed ? 42 : 16, ["#4d3635", "#2d1d20", "#ff8822"], 480, { kind: "rock", upBias: 160 });
        Juice.spawnBurst(480, this.meteorY + 40, passed ? 36 : 14, ["#ffee44", "#ff6622", "#ffffff"], 560, { kind: "spark" });
        if (err < 0.12 && passed) {
          Audio.announce("Perfect!");
          Juice.triggerCutIn(char, "PERFECT UPPERCUT!!", `${tons} TONS SHATTER!!`, "#38f3ff");
        }
        Juice.spawnText(480, 145, timingLabel, err < 0.18 ? "#38f3ff" : "#ffaa44", 38);
        Juice.spawnText(480, 205, `${tons} TONS!!`, "#ffee33", 56);

        const medal = tons >= 700 ? "S-RANK" : tons >= 560 ? "GOLD" : tons >= 420 ? "SILVER" : passed ? "BRONZE" : "FAIL";
        const score = Math.round(tons * 8.5);
        setTimeout(() => { if (passed) Audio.win(); else Audio.fail(); }, 280);

        this.result = {
          passed,
          medal,
          score,
          peakCps: this.renda.peakCps,
          recordText: `${tons} TONS`,
          detailText: passed
            ? `초거대 운석 격파! (PEAK ${this.renda.peakCps} CPS)`
            : "파워가 부족해 운석이 부서지지 않았습니다. (300 TONS 필요)",
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
            Juice.spawnText(480, 240, "MASH A / D TO CHARGE!", "#ff8833", 48);
          }
          return;
        }

        if (this.phase === "charge") {
          this.chargeTime -= dt;
          const progress = 1 - this.chargeTime / 5.0;
          this.meteorY = 128 + progress * 86;
          // ROZ progressive zoom-in as colossal meteor descends!
          Juice.zoomTarget = 1.0 + progress * 0.065;
          Juice.speedLineIntensity = Math.min(1, this.power / 95);
          if (this.chargeTime <= 0) {
            this.chargeTime = 0;
            this.phase = "aim";
            Juice.zoomTarget = 1.08;
            Audio.countdown(true);
            Juice.spawnText(480, 120, "NOW!! PRESS [SPACE]!", "#38f3ff", 46);
          }
        } else if (this.phase === "aim") {
          this.aimTimer += dt;
          this.aimPos += this.aimDir * dt * 1.95;
          if (this.aimPos >= 1) { this.aimPos = 1; this.aimDir = -1; }
          if (this.aimPos <= 0) { this.aimPos = 0; this.aimDir = 1; }
          if (this.aimTimer > 2.8) {
            this.executeStrike();
          }
        } else if (this.phase === "finish") {
          Juice.speedLineIntensity = 0;
          this.finishTimer += dt;
          if (this.shattered) {
            this.shatterT = Math.min(1.8, this.shatterT + dt);
          }
        }
      },

      draw(ctx, W, H) {
        const Sprites = window.MB.Sprites;
        Sprites.drawStageBg(ctx, W, H, 0, "volcano");

        const ringPulse = 1 + Math.sin(this.animPhase * 11) * 0.07;
        ctx.save();
        ctx.strokeStyle = this.megaActive ? "#ffee33" : "#ff8833";
        ctx.lineWidth = 4.5;
        ctx.shadowColor = this.megaActive ? "#ffee33" : "#ff5500";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.ellipse(480, 494, 132 * ringPulse, 26 * ringPulse, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        Sprites.drawMeteor(ctx, 480, this.meteorY, 345, this.power / 100, this.shattered, this.shatterT);

        const pose =
          this.phase === "charge" ? "charge" :
          this.phase === "aim" ? "charge" :
          this.phase === "finish" ? (this.finishTimer < 0.45 ? "punch" : (this.result.passed ? "win" : "fail")) : "idle";
        const punchJump = this.phase === "finish" && this.finishTimer < 0.45 ? -105 * Math.sin((this.finishTimer / 0.45) * Math.PI) : 0;

        Sprites.drawCharacter(ctx, char, 480, 496 + punchJump, {
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
          ctx.fillText("⚡ HIT [SPACE] IN THE CYAN ZONE!", 480, by - 12);
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
          ctx.shadowColor = "#38f3ff";
          ctx.shadowBlur = 12;
          ctx.fillRect(cx - 5, by - 7, 10, bh + 14);
          ctx.shadowBlur = 0;
        }

        drawHudPanel(ctx, 18, 14, 232, 66, "#ff8833");
        ctx.fillStyle = "#ffbb88";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("METEOR BREAKER", 38, 34);
        ctx.fillStyle = "#ffee33";
        ctx.font = "900 28px monospace";
        ctx.fillText(this.phase === "charge" ? `${this.chargeTime.toFixed(1)}s` : (this.phase === "aim" ? "STRIKE!" : "DONE"), 36, 68);

        drawPowerBar(ctx, 270, 22, 416, 36, this.power / 100, `GIGA POWER: ${Math.round(this.power)}%`, this.megaActive);

        drawHudPanel(ctx, 708, 14, 234, 66, "#ffee33");
        ctx.fillStyle = "#ffffff";
        ctx.font = "italic 900 14px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("QUALIFY: 300+ TONS", 825, 40);
        ctx.fillStyle = "#38f3ff";
        ctx.font = "italic 900 13px 'Segoe UI', sans-serif";
        ctx.fillText("GOLD: 560+  |  S: 700+", 825, 63);

        drawRendaMonitor(ctx, this.renda);
        if (this.phase === "demo") drawDemoOverlay(ctx, W, this.meta, this.demoTimer);
      },
    };
  }

  // =========================================================
  // EVENT 3: TRAIN STOP (COLOSSAL NEO-SHINKANSEN + ROZ STARE-DOWN)
  // =========================================================
  function createTrainEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    const renda = window.MB.Renda.createTracker();
    return {
      meta: EVENT_LIST[3],
      renda,
      phase: "demo",
      demoTimer: 1.9,
      countdown: 2.0,
      lastCountNum: 4,
      trainDist: 740,
      trainSpeed: 540,
      remainingMeters: 50.0,
      scrollTrack: 0,
      megaActive: false,
      catchQuality: "NONE",
      pushPower: 0,
      animPhase: 0,
      sparkTimer: 0,
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

        if (this.phase === "approach" && type === "action") {
          if (this.trainDist <= 140 && this.trainDist >= -25) {
            const err = Math.abs(this.trainDist - 45);
            if (err < 38) {
              this.catchQuality = "PERFECT CATCH!!";
              this.trainSpeed = 19.5;
              Audio.announce("Perfect Catch!");
              Juice.feedback("large", 360, 420, "#38f3ff");
              Juice.triggerCutIn(char, "PERFECT CATCH!!", "-35% MOMENTUM! MASH NOW!", "#38f3ff");
              Juice.spawnText(480, 165, "PERFECT CATCH!!", "#38f3ff", 40);
            } else {
              this.catchQuality = "GOOD CATCH!";
              this.trainSpeed = 24.5;
              Juice.feedback("medium", 360, 420, "#ffee33");
              Juice.spawnText(480, 185, "GOOD CATCH! MASH A / D!", "#ffee33", 34);
            }
            Audio.impactHeavy();
            this.trainDist = 0;
            this.phase = "push";
          } else if (this.trainDist < 260) {
            this.catchQuality = "EARLY GUARD";
            this.trainSpeed = 28.5;
            this.trainDist = 0;
            Audio.impactMedium();
            Juice.feedback("medium", 360, 420, "#ff8844");
            Juice.spawnText(480, 185, "EARLY CATCH! MASH HARD!!", "#ff8844", 30);
            this.phase = "push";
          }
        } else if (this.phase === "push" && (type === "left" || type === "right")) {
          const r = this.renda.register(type, this.pushPower / 100);
          const brake = 1.48 * r.effectiveGain * char.mashMult * char.powerMult * bonus;
          this.trainSpeed = Math.max(0, this.trainSpeed - brake);
          this.pushPower = Math.min(100, this.pushPower + 6.5 * r.effectiveGain);
          Audio.mash(this.pushPower / 100);
          Juice.addTrauma(0.1);
          Juice.spawnBurst(345, 488, 6, ["#ffee44", "#ff6622", "#38f3ff", "#ffffff"], 290, { angleBase: Math.PI * 0.85, spread: 0.6, upBias: 110, kind: "spark" });
          Juice.spawnBurst(310, 492, 2, ["rgba(255,220,180,0.8)", "#ffffff"], 150, { kind: "smoke", gravity: -40 });

          if (this.pushPower >= 80 && !this.megaActive) {
            this.megaActive = true;
            Audio.megaMash();
            Audio.setBgm("fever");
            Juice.triggerCutIn(char, "MEGA MASH!!", "HYPER BRAKE OVERDRIVE!", "#ffee33");
          }
        }
      },

      finishTrain(passed) {
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
          peakCps: this.renda.peakCps,
          recordText: ok ? `${m.toFixed(1)}m LEFT` : "CRASHED!",
          detailText: ok
            ? `초거대 열차 정지 성공! (PEAK ${this.renda.peakCps} CPS)`
            : "열차의 기세를 막지 못했습니다! (5.0m 이상 남기고 정지 필요)",
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
            Juice.spawnText(480, 190, "WAIT FOR YELLOW ZONE -> [SPACE]!", "#ffee33", 32);
          }
          return;
        }

        if (this.phase === "approach") {
          this.trainDist -= this.trainSpeed * dt;
          Juice.speedLineIntensity = 0.55;
          if (this.trainDist <= -30) {
            this.trainDist = 0;
            this.trainSpeed = 30.5;
            this.catchQuality = "MISSED CATCH!";
            Audio.impactHeavy();
            Juice.feedback("large", 340, 420, "#ff3355");
            Juice.spawnText(480, 185, "MISSED CATCH! MASH A / D NOW!!", "#ff4455", 32);
            this.phase = "push";
          }
        } else if (this.phase === "push") {
          this.pushPower = Math.max(0, this.pushPower - 24 * dt);
          this.remainingMeters -= this.trainSpeed * dt;
          this.scrollTrack -= this.trainSpeed * 32 * dt;
          Juice.speedLineIntensity = Math.min(1, this.trainSpeed / 22);
          Juice.zoomTarget = 1.02 + Math.min(0.05, (this.trainSpeed / 25) * 0.05);

          this.sparkTimer += dt;
          if (this.sparkTimer > 0.06 && this.trainSpeed > 2) {
            this.sparkTimer = 0;
            Audio.screech();
            Juice.spawnBurst(365, 488, 5, ["#ffee44", "#ff6622", "#ffffff"], 260, { angleBase: -2.65, spread: 0.55, kind: "spark" });
          }

          if (this.trainSpeed <= 0.1) {
            this.trainSpeed = 0;
            this.finishTrain(true);
          } else if (this.remainingMeters <= 0) {
            this.remainingMeters = 0;
            this.finishTrain(false);
          }
        } else if (this.phase === "finish") {
          this.finishTimer += dt;
        }
      },

      draw(ctx, W, H) {
        const Sprites = window.MB.Sprites;
        Sprites.drawStageBg(ctx, W, H, this.scrollTrack, "viaduct");

        if (this.phase === "push" && this.trainSpeed > 2) {
          const glow = ctx.createLinearGradient(250, 485, 520, 485);
          glow.addColorStop(0, "rgba(255, 80, 20, 0)");
          glow.addColorStop(0.45, "rgba(255, 130, 30, 0.7)");
          glow.addColorStop(1, "rgba(255, 220, 80, 0)");
          ctx.fillStyle = glow;
          ctx.fillRect(250, 476, 270, 16);
        }

        const dangerX = 285 - this.remainingMeters * 14;
        if (dangerX > -50) {
          const dGrad = ctx.createLinearGradient(dangerX - 24, 300, dangerX + 24, 300);
          dGrad.addColorStop(0, "rgba(255, 25, 65, 0)");
          dGrad.addColorStop(0.5, "rgba(255, 25, 65, 0.65)");
          dGrad.addColorStop(1, "rgba(255, 25, 65, 0)");
          ctx.fillStyle = dGrad;
          ctx.fillRect(dangerX - 24, 240, 48, 300);
          ctx.fillStyle = "#ff2244";
          ctx.fillRect(dangerX - 5, 260, 10, 280);
          ctx.fillStyle = "#ffee33";
          ctx.font = "italic 900 18px 'Arial Black', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚠ DANGER", dangerX, 288);
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
        const trainFrontX = playerX + 64 + Math.max(0, this.trainDist);
        Sprites.drawHyperTrain(ctx, trainFrontX, 494, this.phase === "approach" ? 1 : this.trainSpeed / 25);

        const pose =
          this.phase === "push" ? "brace" :
          this.phase === "finish" ? (this.result.passed ? "win" : "fail") : "idle";
        Sprites.drawCharacter(ctx, char, playerX, 496, {
          scale: 1.12,
          pose,
          phase: this.animPhase,
          mega: this.megaActive,
        });

        drawHudPanel(ctx, 18, 14, 240, 66, "#ff3366");
        ctx.fillStyle = "#ff88aa";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("TRAIN STOP // 999 KM/H", 38, 34);
        ctx.fillStyle = this.remainingMeters < 10 ? "#ff3355" : "#55ff88";
        ctx.font = "900 28px monospace";
        ctx.fillText(`${this.remainingMeters.toFixed(1)}m`, 36, 68);

        const kmh = this.phase === "approach" ? 999 : Math.round(this.trainSpeed * 32);
        drawPowerBar(ctx, 282, 18, 386, 26, this.phase === "approach" ? 1 : this.trainSpeed / 28, `TRAIN SPEED: ${kmh} km/h`, false);
        drawPowerBar(ctx, 282, 52, 386, 20, this.pushPower / 100, `BRAKE POWER`, this.megaActive);

        drawHudPanel(ctx, 694, 14, 248, 66, "#ffee33");
        ctx.fillStyle = "#ffffff";
        ctx.font = "italic 900 14px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("QUALIFY: >= 5.0m LEFT", 818, 40);
        ctx.fillStyle = "#38f3ff";
        ctx.font = "italic 900 13px 'Segoe UI', sans-serif";
        ctx.fillText("GOLD: >= 22m  |  S: >= 30m", 818, 63);

        drawRendaMonitor(ctx, this.renda);
        if (this.phase === "demo") drawDemoOverlay(ctx, W, this.meta, this.demoTimer);
      },
    };
  }


  // =========================================================
  // EVENT 2: ICE CRUSHER (2-LANE SIMULTANEOUS ICE PILLAR SMASH!)
  // Directly inspired by Mach Breakers (1995) dual-lane Ice Crusher
  // =========================================================
  function createIceEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    const renda = window.MB.Renda.createTracker();
    const rivalChar = window.MB.Sprites.CHARACTERS.find((c) => c.id !== char.id) || window.MB.Sprites.CHARACTERS[2];
    const spacing = 14.0; // meters between ice pillars
    const blocks = [];
    const rivalBlocks = [];
    for (let i = 1; i <= 40; i++) {
      blocks.push({ dist: i * spacing, broken: false });
      rivalBlocks.push({ dist: i * spacing, broken: false });
    }

    return {
      meta: EVENT_LIST[1],
      renda,
      phase: "demo",
      demoTimer: 1.9,
      countdown: 2.0,
      lastCountNum: 4,
      timeLeft: 18.0,
      distance: 0,
      speed: 0,
      brokenCount: 0,
      combo: 0,
      smashAnim: 0,
      stumbleTimer: 0,
      rivalDist: 0,
      rivalCount: 0,
      rivalSmash: 0,
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
          const r = this.renda.register(type, this.speed / 34);
          const gain = (this.stumbleTimer > 0 ? 1.8 : 3.8) * r.effectiveGain * char.mashMult * char.speedMult * bonus;
          this.speed = Math.min(40, this.speed + gain);
          Audio.mash(this.speed / 36);
          Juice.spawnBurst(245, 492, 4, char.trailColors, 190, { angleBase: Math.PI, spread: 0.5, upBias: 35, kind: "spark" });
        } else if (type === "action") {
          this.smashAnim = 0.28;
          // Check closest unbroken ice pillar in sweet spot!
          const next = blocks.find((b) => !b.broken && b.dist >= this.distance - 1.5 && b.dist <= this.distance + 8.5);
          if (next) {
            next.broken = true;
            this.brokenCount += 1;
            this.combo += 1;
            const err = Math.abs(next.dist - (this.distance + 2.8));
            const isPerfect = err < 2.2;
            this.speed = Math.min(42, this.speed + (isPerfect ? 6.5 : 3.2) * char.powerMult);
            Audio.impactHeavy();
            if (PixiFX) PixiFX.spawnIceShatter(350, 420, isPerfect ? 34 : 20);
            Juice.feedback(isPerfect ? "medium" : "small", 350, 420, "#38f3ff");
            Juice.spawnBurst(350, 420, isPerfect ? 22 : 12, ["#38f3ff", "#b8f8ff", "#ffffff"], 380, { kind: "rock", upBias: 130 });
            Juice.spawnText(390, 330, isPerfect ? `NICE!! x${this.combo}` : "CRUSH!", isPerfect ? "#38f3ff" : "#ffee33", isPerfect ? 34 : 26);

            if (this.combo >= 5 && !this.megaActive) {
              this.megaActive = true;
              Audio.megaMash();
              Audio.setBgm("fever");
              Juice.triggerCutIn(char, "MEGA CRUSH!!", "UNSTOPPABLE ICE BREAKER!", "#38f3ff");
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
            Juice.spawnText(480, 210, "GO!! SMASH THE ICE!", "#38f3ff", 48);
          }
          return;
        }

        if (this.phase === "race") {
          this.timeLeft = Math.max(0, this.timeLeft - dt);
          if (this.smashAnim > 0) this.smashAnim = Math.max(0, this.smashAnim - dt);
          if (this.stumbleTimer > 0) this.stumbleTimer = Math.max(0, this.stumbleTimer - dt);
          if (this.rivalSmash > 0) this.rivalSmash = Math.max(0, this.rivalSmash - dt);

          this.speed = Math.max(0, this.speed - (10.5 + this.speed * 0.25) * dt);
          this.distance += this.speed * dt;
          this.runPhase += dt * (0.7 + this.speed * 0.16);
          Juice.speedLineIntensity = Math.max(0, Math.min(1, (this.speed - 18) / 20));

          // Collision with un-smashed pillar slows player down & breaks it clumsily
          const hit = blocks.find((b) => !b.broken && b.dist <= this.distance + 1.0);
          if (hit) {
            hit.broken = true;
            this.combo = 0;
            this.stumbleTimer = 0.35;
            this.speed = Math.max(4, this.speed * 0.38);
            Audio.impactMedium();
            Juice.addTrauma(0.32);
            Juice.spawnBurst(310, 430, 10, ["#38f3ff", "#ffffff"], 210, { kind: "rock" });
            Juice.spawnText(360, 345, "BUMP! PRESS [SPACE]!", "#ff5566", 24);
          }

          // Upper Lane: CPU Rival advances & smashes ice pillars!
          const rivalSpd = 12.2;
          this.rivalDist += rivalSpd * dt;
          const rHit = rivalBlocks.find((b) => !b.broken && b.dist <= this.rivalDist + 2.2);
          if (rHit) {
            rHit.broken = true;
            this.rivalCount += 1;
            this.rivalSmash = 0.25;
            if (PixiFX) PixiFX.spawnIceShatter(320 + (rHit.dist - this.distance) * 32, 330, 12);
          }

          if (this.speed > 22) {
            this.ghostTimer += dt;
            if (this.ghostTimer > 0.065) {
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
              peakCps: this.renda.peakCps,
              recordText: `${pcs} PCS`,
              detailText: pcs >= this.rivalCount
                ? `CPU 라이벌(${this.rivalCount} PCS)을 꺾고 얼음 격파 우승!`
                : passed
                  ? `합격! (CPU 라이벌 ${this.rivalCount} PCS 추격 성공 직전)`
                  : `얼음 기둥 10개 이상 격파가 필요합니다. (현재 ${pcs} PCS)`,
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
        Sprites.drawStageBg(ctx, W, H, scrollX, "glacier");

        // Dual Industrial Cryo Catwalks (Upper = CPU Rival, Lower = Player)
        Sprites.drawROZPerspectiveFloor(ctx, W, 385, 330, scrollX, "#17304d", "#1e4266", "rgba(56,243,255,0.22)");
        Sprites.drawROZPerspectiveFloor(ctx, W, H, 425, scrollX, "#1b3a5c", "#0f2238", "rgba(120,240,255,0.28)");

        // Glowing steel catwalk divider beam
        ctx.fillStyle = "#0b1526";
        ctx.fillRect(0, 384, W, 42);
        ctx.fillStyle = "#38f3ff";
        ctx.fillRect(0, 384, W, 3);
        ctx.fillRect(0, 424, W, 3);

        // Upper Lane: CPU Rival + Ice Pillars
        rivalBlocks.forEach((b) => {
          if (b.broken) return;
          const bx = 265 + (b.dist - this.distance) * 36;
          if (bx < -100 || bx > W + 100) return;
          Sprites.drawIceBlock(ctx, bx, 380, 120, false);
        });
        const rX = 265 + (this.rivalDist - this.distance) * 36;
        if (rX > -140 && rX < W + 140) {
          Sprites.drawCharacter(ctx, rivalChar, rX, 382, {
            scale: 0.78,
            pose: this.rivalSmash > 0 ? "punch" : "run",
            phase: this.runPhase * 0.9,
            mega: false,
          });
        }

        // Lower Lane: Player's Ice Pillars + Glowing Floor Timing Markers!
        blocks.forEach((b) => {
          if (b.broken) return;
          const bx = 265 + (b.dist - this.distance) * 36;
          if (bx < -120 || bx > W + 120) return;
          const inSweet = b.dist >= this.distance - 1.0 && b.dist <= this.distance + 8.0;
          // Floor marker cue (like Mach Breakers Ice Crusher!)
          ctx.fillStyle = inSweet ? "rgba(255, 238, 51, 0.45)" : "rgba(56, 243, 255, 0.22)";
          ctx.fillRect(bx - 95, 488, 90, 14);
          Sprites.drawIceBlock(ctx, bx, 496, 165, inSweet);
        });

        Juice.drawAfterimages(ctx);
        Sprites.drawCharacter(ctx, char, 265, 496, {
          scale: 1.06,
          pose: this.phase === "finish" ? (this.result.passed ? "win" : "fail") : (this.smashAnim > 0 ? "smash" : (this.speed > 1 ? "run" : "idle")),
          phase: this.runPhase,
          mega: this.megaActive,
        });

        // Bold Red/Cyan Arcade LED Score Counters on Right (Mach Breakers Ice Crusher tribute!)
        ctx.save();
        ctx.textAlign = "right";
        ctx.font = "900 44px monospace";
        ctx.strokeStyle = "#080c1c";
        ctx.lineWidth = 6;
        ctx.strokeText(String(this.rivalCount).padStart(2, "0"), W - 26, 366);
        ctx.fillStyle = "#ff2255";
        ctx.fillText(String(this.rivalCount).padStart(2, "0"), W - 26, 366);

        ctx.strokeText(String(this.brokenCount).padStart(2, "0"), W - 26, 488);
        ctx.fillStyle = "#38f3ff";
        ctx.fillText(String(this.brokenCount).padStart(2, "0"), W - 26, 488);
        ctx.restore();

        // Top HUD
        drawHudPanel(ctx, 18, 14, 242, 66, "#38f3ff");
        ctx.fillStyle = "#8ce0ff";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("ICE CRUSHER // 2-LANE", 38, 34);
        ctx.fillStyle = this.timeLeft < 5 ? "#ff3355" : "#ffee33";
        ctx.font = "900 30px monospace";
        ctx.fillText(`${this.timeLeft.toFixed(1)}s`, 36, 68);

        drawPowerBar(ctx, 284, 18, 384, 26, this.brokenCount / 22, `CRUSHED: ${this.brokenCount} PCS  (COMBO x${this.combo})`, this.megaActive);
        drawPowerBar(ctx, 284, 52, 384, 20, this.speed / 40, `SPEED: ${Math.round(this.speed * 18)} km/h`, false);

        drawHudPanel(ctx, 694, 14, 248, 66, "#ffee33");
        ctx.fillStyle = "#ffffff";
        ctx.font = "italic 900 14px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`YOU ${this.brokenCount}  vs  CPU ${this.rivalCount}`, 818, 40);
        ctx.fillStyle = "#38f3ff";
        ctx.font = "italic 900 12px 'Segoe UI', sans-serif";
        ctx.fillText("QUALIFY 10+  |  GOLD 16+", 818, 63);

        drawRendaMonitor(ctx, this.renda);
        if (this.phase === "demo") drawDemoOverlay(ctx, W, this.meta, this.demoTimer);
      },
    };
  }

  function createEvent(id, char, powerBonus) {
    if (id === "sprint") return createSprintEvent(char, powerBonus);
    if (id === "ice") return createIceEvent(char, powerBonus);
    if (id === "meteor") return createMeteorEvent(char, powerBonus);
    return createTrainEvent(char, powerBonus);
  }

  window.MB.Events = {
    LIST: EVENT_LIST,
    createEvent,
  };
})();

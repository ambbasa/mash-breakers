// 3 Iconic Superhuman Events for MASH BREAKERS
window.MB = window.MB || {};

(function () {
  const EVENT_LIST = [
    {
      id: "sprint",
      name: "MACH SPRINT",
      krName: "100m 음속 질주",
      desc: "A / D 번갈아 연타로 음속 돌파! 중간에 [SPACE]로 소닉 부스트!",
      targetLabel: "QUALIFY < 4.50s",
      theme: "day",
    },
    {
      id: "meteor",
      name: "METEOR BREAKER",
      krName: "거대 운석 격파",
      desc: "5초간 미친 연타로 파워 충전 후, 타이밍 바 중앙에서 [SPACE] 어퍼컷!",
      targetLabel: "QUALIFY >= 300 TONS",
      theme: "sunset",
    },
    {
      id: "train",
      name: "TRAIN STOP",
      krName: "폭주 열차 멈추기",
      desc: "열차가 노란 존에 들어올 때 [SPACE]로 캐치! 그다음 폭풍 연타로 정지!",
      targetLabel: "QUALIFY >= 5.0m LEFT",
      theme: "night",
    },
  ];

  // Shared HUD helper
  function drawPowerBar(ctx, x, y, w, h, ratio, label, mega) {
    ctx.save();
    ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
    ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.strokeStyle = mega ? "#ffee33" : "#4a548f";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);

    const clamped = Math.max(0, Math.min(1, ratio));
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    if (mega) {
      grad.addColorStop(0, "#ff2255");
      grad.addColorStop(0.5, "#ffee22");
      grad.addColorStop(1, "#33ffff");
    } else {
      grad.addColorStop(0, "#2299ff");
      grad.addColorStop(0.6, "#ffaa00");
      grad.addColorStop(1, "#ff2244");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w * clamped, h);

    ctx.fillStyle = "#fff";
    ctx.font = "900 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 8, y + h - 6);

    if (mega) {
      ctx.fillStyle = "#ffee33";
      ctx.textAlign = "right";
      ctx.fillText("MEGA MASH!!", x + w - 8, y + h - 6);
    }
    ctx.restore();
  }

  // =========================================================
  // EVENT 1: MACH SPRINT (100m 음속 질주)
  // =========================================================
  function createSprintEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    return {
      meta: EVENT_LIST[0],
      phase: "countdown", // countdown -> race -> finish
      countdown: 2.4,
      lastCountNum: 4,
      elapsed: 0,
      distance: 0, // 0..100m
      speed: 0, // m/s (target peak ~36-45 m/s)
      lastMashKey: null,
      megaActive: false,
      boostAvailable: false,
      boostUsed: false,
      boostWindowPos: 0, // 0..1
      runPhase: 0,
      finishTimer: 0,
      result: null,

      onInput(type) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        if (this.phase !== "race") return;

        if (type === "left" || type === "right") {
          const isAlt = this.lastMashKey !== type;
          this.lastMashKey = type;
          const gain = (isAlt ? 4.4 : 1.8) * char.mashMult * char.speedMult * bonus;
          this.speed = Math.min(54, this.speed + gain);
          Audio.mash(this.speed / 48);
          Juice.spawnBurst(240, 448, 2, ["#ffee66", "#ffffff"], 110, { angleBase: Math.PI, spread: 0.6, upBias: 30 });
          if (this.speed > 36 && !this.megaActive) {
            this.megaActive = true;
            Audio.megaMash();
            Juice.feedback("medium", 280, 390, "#33ffff");
            Juice.spawnText(480, 175, "MEGA MASH!! MACH 1!", "#ffee33", 38);
          }
        } else if (type === "action" && this.boostAvailable && !this.boostUsed) {
          this.boostUsed = true;
          this.boostAvailable = false;
          const distFromCenter = Math.abs(this.boostWindowPos - 0.5);
          if (distFromCenter < 0.16) {
            this.speed = Math.min(60, this.speed + 16 * char.powerMult);
            this.megaActive = true;
            Audio.boost();
            Juice.feedback("large", 320, 400, "#33ffff");
            Juice.spawnText(480, 190, "SONIC BOOM!! +MAX SPEED", "#44ffff", 34);
          } else if (distFromCenter < 0.32) {
            this.speed = Math.min(56, this.speed + 9);
            Audio.boost();
            Juice.feedback("medium", 320, 400, "#ffee44");
            Juice.spawnText(480, 200, "TURBO BOOST!", "#ffee44", 30);
          } else {
            this.speed = Math.max(8, this.speed * 0.72);
            Audio.fail();
            Juice.spawnText(480, 200, "STUMBLE!", "#ff5566", 28);
          }
        }
      },

      update(dt) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;

        if (this.phase === "countdown") {
          this.countdown -= dt;
          const num = Math.ceil(this.countdown);
          if (num < this.lastCountNum && num > 0) {
            this.lastCountNum = num;
            Audio.countdown(false);
            Juice.spawnText(480, 230, String(num), "#ffee33", 68);
          }
          if (this.countdown <= 0) {
            this.phase = "race";
            Audio.countdown(true);
            Juice.spawnText(480, 220, "GO!! MASH A / D!", "#55ff88", 52);
            Juice.addTrauma(0.25);
          }
          return;
        }

        if (this.phase === "race") {
          this.elapsed += dt;
          // Natural friction
          this.speed = Math.max(0, this.speed - (11.5 + this.speed * 0.28) * dt);
          this.distance += this.speed * dt;
          this.runPhase += dt * (0.6 + this.speed * 0.14);
          Juice.speedLineIntensity = Math.max(0, Math.min(1, (this.speed - 20) / 24));

          // Trigger Sonic Boost window around 42m..72m
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
            const t = this.elapsed;
            const passed = t <= 4.5;
            const medal = t <= 3.15 ? "S-RANK" : t <= 3.55 ? "GOLD" : t <= 4.05 ? "SILVER" : passed ? "BRONZE" : "FAIL";
            const score = Math.max(100, Math.round((6.5 - Math.min(6.4, t)) * 1200));
            if (passed) Audio.win(); else Audio.fail();
            Juice.feedback(passed ? "large" : "medium", 480, 380, passed ? "#ffee33" : "#ff3355");
            this.result = {
              passed,
              medal,
              score,
              recordText: `${t.toFixed(2)} sec`,
              detailText: passed ? "음속 돌파 성공! 관중석이 열광합니다!" : "4.50초 이내 기록에 아쉽게 실패했습니다.",
            };
          }
        } else if (this.phase === "finish") {
          this.finishTimer += dt;
          this.speed = Math.max(0, this.speed - 38 * dt);
          this.runPhase += dt * 0.8;
        }
      },

      draw(ctx, W, H) {
        const Sprites = window.MB.Sprites;
        const scrollX = this.distance * 46;
        Sprites.drawStadiumBg(ctx, W, H, scrollX, "day");

        // Track surface
        ctx.fillStyle = "#c9422e";
        ctx.fillRect(0, 350, W, 190);
        ctx.fillStyle = "#a83322";
        ctx.fillRect(0, 350, W, 18);
        // Lane lines
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.fillRect(0, 405, W, 4);
        ctx.fillRect(0, 470, W, 4);

        // Distance markers every 10m
        for (let m = 0; m <= 100; m += 10) {
          const mx = 260 + (m - this.distance) * 46;
          if (mx < -60 || mx > W + 60) continue;
          ctx.fillStyle = m === 100 ? "#ffee33" : "rgba(255,255,255,0.7)";
          ctx.fillRect(mx, 354, m === 100 ? 12 : 4, 180);
          ctx.font = "900 18px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(m === 100 ? "GOAL" : `${m}m`, mx, 386);
        }

        // Player character
        const charX = this.phase === "finish" ? Math.min(640, 260 + this.finishTimer * 180) : 260;
        const stretch = 1 + Math.min(0.28, this.speed * 0.006);
        Sprites.drawCharacter(ctx, char, charX, 452, {
          scale: 1.25,
          pose: this.phase === "finish" ? (this.result.passed ? "win" : "fail") : (this.speed > 1 ? "run" : "idle"),
          phase: this.runPhase,
          mega: this.megaActive,
          scaleX: stretch,
          scaleY: 1 / Math.sqrt(stretch),
        });

        // Sonic Boost Timing Bar
        if (this.boostAvailable) {
          const bx = 280, by = 110, bw = 400, bh = 30;
          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.fillRect(bx - 6, by - 28, bw + 12, bh + 38);
          ctx.fillStyle = "#ffee33";
          ctx.font = "900 15px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("PRESS [SPACE] AT CENTER FOR SONIC BOOM!", 480, by - 9);
          // Sweet spot
          ctx.fillStyle = "#22305a";
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = "#ffaa00";
          ctx.fillRect(bx + bw * 0.25, by, bw * 0.5, bh);
          ctx.fillStyle = "#44ffff";
          ctx.fillRect(bx + bw * 0.38, by, bw * 0.24, bh);
          // Moving cursor
          const cx = bx + this.boostWindowPos * bw;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(cx - 4, by - 5, 8, bh + 10);
        }

        // Top HUD
        ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
        ctx.fillRect(20, 16, 250, 62);
        ctx.strokeStyle = "#4a548f";
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 16, 250, 62);
        ctx.fillStyle = "#98a0c8";
        ctx.font = "900 13px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("MACH SPRINT 100M", 32, 36);
        ctx.fillStyle = "#ffee33";
        ctx.font = "900 28px monospace";
        ctx.fillText(`${this.elapsed.toFixed(2)}s`, 32, 68);

        // Speedometer & Progress
        const kmh = Math.round(this.speed * 28);
        drawPowerBar(ctx, 300, 22, 360, 24, this.speed / 45, `SPEED: ${kmh} km/h`, this.megaActive);
        drawPowerBar(ctx, 300, 56, 360, 18, this.distance / 100, `DIST: ${Math.floor(this.distance)} / 100m`, false);

        // Target Box
        ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
        ctx.fillRect(690, 16, 250, 62);
        ctx.strokeStyle = "#4a548f";
        ctx.strokeRect(690, 16, 250, 62);
        ctx.fillStyle = "#fff";
        ctx.font = "900 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("TARGET: < 4.50s", 815, 42);
        ctx.fillStyle = "#44ffff";
        ctx.font = "900 13px sans-serif";
        ctx.fillText("GOLD: < 3.55s", 815, 64);
      },
    };
  }

  // =========================================================
  // EVENT 2: METEOR BREAKER (거대 운석 격파)
  // =========================================================
  function createMeteorEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    return {
      meta: EVENT_LIST[1],
      phase: "countdown", // countdown -> charge -> aim -> impact -> finish
      countdown: 2.2,
      lastCountNum: 4,
      chargeTime: 5.0,
      power: 0, // 0..100+
      lastMashKey: null,
      megaActive: false,
      aimPos: 0, // 0..1 ping-pong
      aimDir: 1,
      aimTimer: 0,
      meteorY: 165,
      shattered: false,
      shatterT: 0,
      animPhase: 0,
      finishTimer: 0,
      result: null,

      onInput(type) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;

        if (this.phase === "charge" && (type === "left" || type === "right")) {
          const isAlt = this.lastMashKey !== type;
          this.lastMashKey = type;
          const gain = (isAlt ? 3.4 : 1.5) * char.mashMult * bonus;
          this.power = Math.min(125, this.power + gain);
          Audio.mash(this.power / 100);
          Juice.addTrauma(0.08);
          Juice.spawnBurst(480, 420, 3, [char.aura, "#ffffff"], 170, { upBias: 120 });
          if (this.power >= 85 && !this.megaActive) {
            this.megaActive = true;
            Audio.megaMash();
            Juice.feedback("medium", 480, 410, "#ffee33");
            Juice.spawnText(480, 290, "MEGA MASH!! MAX CHARGE!", "#ffee33", 36);
          }
        } else if (this.phase === "aim" && type === "action") {
          this.executeStrike();
        }
      },

      executeStrike() {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        this.phase = "finish";
        const err = Math.abs(this.aimPos - 0.5);
        const timingMult = err < 0.08 ? 1.45 : err < 0.18 ? 1.15 : err < 0.32 ? 0.82 : 0.45;
        const timingLabel = err < 0.08 ? "PERFECT UPPERCUT!!" : err < 0.18 ? "GREAT HIT!" : err < 0.32 ? "GOOD" : "GLANCING BLOW...";
        const tons = Math.round(this.power * 4.8 * char.powerMult * timingMult);
        const passed = tons >= 300;

        this.shattered = passed;
        Audio.impactHeavy();
        Juice.feedback("large", 480, 235, passed ? "#ffee33" : "#ff4455");
        Juice.spawnBurst(480, 235, passed ? 48 : 16, ["#ff8822", "#ffee44", "#8a6d66", "#ffffff"], 460);
        Juice.spawnText(480, 150, timingLabel, err < 0.18 ? "#44ffff" : "#ffaa44", 36);
        Juice.spawnText(480, 200, `${tons} TONS!!`, "#ffee33", 48);

        const medal = tons >= 700 ? "S-RANK" : tons >= 560 ? "GOLD" : tons >= 420 ? "SILVER" : passed ? "BRONZE" : "FAIL";
        const score = Math.round(tons * 8.5);
        setTimeout(() => { if (passed) Audio.win(); else Audio.fail(); }, 280);

        this.result = {
          passed,
          medal,
          score,
          recordText: `${tons} TONS`,
          detailText: passed ? "거대 운석을 맨주먹으로 산산조각 냈습니다!" : "파워가 부족해 운석이 부서지지 않았습니다. (300 TONS 필요)",
        };
      },

      update(dt) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        this.animPhase += dt;

        if (this.phase === "countdown") {
          this.countdown -= dt;
          const num = Math.ceil(this.countdown);
          if (num < this.lastCountNum && num > 0) {
            this.lastCountNum = num;
            Audio.countdown(false);
            Juice.spawnText(480, 250, String(num), "#ffee33", 68);
          }
          if (this.countdown <= 0) {
            this.phase = "charge";
            Audio.countdown(true);
            Juice.spawnText(480, 240, "MASH A / D TO CHARGE!", "#ff8833", 44);
          }
          return;
        }

        if (this.phase === "charge") {
          this.chargeTime -= dt;
          this.meteorY = 145 + (1 - this.chargeTime / 5.0) * 95;
          Juice.speedLineIntensity = Math.min(1, this.power / 95);
          if (this.chargeTime <= 0) {
            this.chargeTime = 0;
            this.phase = "aim";
            Audio.countdown(true);
            Juice.spawnText(480, 120, "NOW!! PRESS [SPACE]!", "#44ffff", 42);
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
        Sprites.drawStadiumBg(ctx, W, H, 0, "sunset");

        // Cracked arena floor
        ctx.fillStyle = "#5c4d49";
        ctx.fillRect(0, 350, W, 190);
        ctx.fillStyle = "#3f3330";
        ctx.fillRect(0, 350, W, 16);
        // Pedestal ring
        ctx.strokeStyle = "#ffcc33";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(480, 456, 95, 22, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Giant Meteor
        Sprites.drawMeteor(ctx, 480, this.meteorY, 84, this.power / 100, this.shattered, this.shatterT);

        // Player character beneath meteor
        const pose =
          this.phase === "charge" ? "charge" :
          this.phase === "aim" ? "charge" :
          this.phase === "finish" ? (this.finishTimer < 0.45 ? "punch" : (this.result.passed ? "win" : "fail")) : "idle";
        const punchJump = this.phase === "finish" && this.finishTimer < 0.45 ? -75 * Math.sin((this.finishTimer / 0.45) * Math.PI) : 0;

        Sprites.drawCharacter(ctx, char, 480, 456 + punchJump, {
          scale: 1.32,
          pose,
          phase: this.animPhase,
          mega: this.megaActive,
        });

        // Aiming Timing Bar
        if (this.phase === "aim") {
          const bx = 250, by = 320, bw = 460, bh = 34;
          ctx.fillStyle = "rgba(8, 10, 24, 0.9)";
          ctx.fillRect(bx - 8, by - 32, bw + 16, bh + 42);
          ctx.strokeStyle = "#ffee33";
          ctx.lineWidth = 3;
          ctx.strokeRect(bx - 8, by - 32, bw + 16, bh + 42);
          ctx.fillStyle = "#fff";
          ctx.font = "900 16px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("HIT [SPACE] IN THE CYAN ZONE!", 480, by - 10);

          ctx.fillStyle = "#332238";
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = "#ff8822";
          ctx.fillRect(bx + bw * 0.25, by, bw * 0.5, bh);
          ctx.fillStyle = "#ffee33";
          ctx.fillRect(bx + bw * 0.36, by, bw * 0.28, bh);
          ctx.fillStyle = "#44ffff";
          ctx.fillRect(bx + bw * 0.44, by, bw * 0.12, bh);

          const cx = bx + this.aimPos * bw;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(cx - 5, by - 6, 10, bh + 12);
        }

        // Top HUD
        ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
        ctx.fillRect(20, 16, 230, 62);
        ctx.strokeStyle = "#4a548f";
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 16, 230, 62);
        ctx.fillStyle = "#98a0c8";
        ctx.font = "900 13px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("METEOR BREAKER", 32, 36);
        ctx.fillStyle = "#ff8833";
        ctx.font = "900 26px monospace";
        ctx.fillText(this.phase === "charge" ? `${this.chargeTime.toFixed(1)}s` : (this.phase === "aim" ? "STRIKE!" : "DONE"), 32, 67);

        drawPowerBar(ctx, 275, 24, 410, 32, this.power / 100, `GIGA POWER: ${Math.round(this.power)}%`, this.megaActive);

        ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
        ctx.fillRect(710, 16, 230, 62);
        ctx.strokeStyle = "#4a548f";
        ctx.strokeRect(710, 16, 230, 62);
        ctx.fillStyle = "#fff";
        ctx.font = "900 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("TARGET: 300+ TONS", 825, 42);
        ctx.fillStyle = "#44ffff";
        ctx.font = "900 13px sans-serif";
        ctx.fillText("GOLD: 560+ TONS", 825, 64);
      },
    };
  }

  // =========================================================
  // EVENT 3: TRAIN STOP (폭주 열차 멈추기)
  // =========================================================
  function createTrainEvent(char, powerBonus) {
    const bonus = powerBonus || 1.0;
    return {
      meta: EVENT_LIST[2],
      phase: "countdown", // countdown -> approach -> push -> finish
      countdown: 2.2,
      lastCountNum: 4,
      trainDist: 820, // pixels ahead of player catch point (catch at 0..90)
      trainSpeed: 540, // px/s during approach, then converted to momentum
      remainingMeters: 50.0, // distance left to red danger wall (0m = crash)
      scrollTrack: 0,
      lastMashKey: null,
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

        if (this.phase === "approach" && type === "action") {
          if (this.trainDist <= 135 && this.trainDist >= -25) {
            const err = Math.abs(this.trainDist - 42);
            if (err < 35) {
              this.catchQuality = "PERFECT CATCH!!";
              this.trainSpeed = 19.5; // m/s remaining momentum
              Juice.feedback("large", 360, 405, "#44ffff");
              Juice.spawnText(480, 180, "PERFECT CATCH!! -35% SPEED!", "#44ffff", 34);
            } else {
              this.catchQuality = "GOOD CATCH!";
              this.trainSpeed = 24.5;
              Juice.feedback("medium", 360, 405, "#ffee33");
              Juice.spawnText(480, 190, "GOOD CATCH! NOW MASH A / D!", "#ffee33", 32);
            }
            Audio.impactHeavy();
            this.trainDist = 0;
            this.phase = "push";
          } else if (this.trainDist < 260) {
            // Early whiff penalty
            this.catchQuality = "EARLY GUARD";
            this.trainSpeed = 28.5;
            this.trainDist = 0;
            Audio.impactMedium();
            Juice.feedback("medium", 360, 405, "#ff8844");
            Juice.spawnText(480, 190, "EARLY CATCH! MASH HARD!!", "#ff8844", 30);
            this.phase = "push";
          }
        } else if (this.phase === "push" && (type === "left" || type === "right")) {
          const isAlt = this.lastMashKey !== type;
          this.lastMashKey = type;
          const brake = (isAlt ? 1.55 : 0.65) * char.mashMult * char.powerMult * bonus;
          this.trainSpeed = Math.max(0, this.trainSpeed - brake);
          this.pushPower = Math.min(100, this.pushPower + (isAlt ? 7 : 3));
          Audio.mash(this.pushPower / 100);
          Juice.addTrauma(0.09);
          Juice.spawnBurst(330, 456, 4, ["#ffee44", "#ff6622", "#ffffff"], 210, { angleBase: Math.PI * 0.85, spread: 0.5, upBias: 90 });

          if (this.pushPower >= 80 && !this.megaActive) {
            this.megaActive = true;
            Audio.megaMash();
            Juice.spawnText(480, 170, "MEGA MASH!! SUPER BRAKE!", "#ffee33", 36);
          }
        }
      },

      finishTrain(passed) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        this.phase = "finish";
        Juice.speedLineIntensity = 0;
        const m = Math.max(0, this.remainingMeters);
        const ok = passed && m >= 5.0;
        const medal = m >= 30 ? "S-RANK" : m >= 22 ? "GOLD" : m >= 13 ? "SILVER" : ok ? "BRONZE" : "FAIL";
        const score = ok ? Math.round(1800 + m * 140) : Math.round(m * 100);
        if (ok) Audio.win(); else Audio.fail();
        Juice.feedback("large", 360, 400, ok ? "#55ff88" : "#ff2244");

        this.result = {
          passed: ok,
          medal,
          score,
          recordText: ok ? `${m.toFixed(1)}m LEFT` : "CRASHED!",
          detailText: ok
            ? `폭주 열차를 위험선 앞 ${m.toFixed(1)}m에서 완벽히 멈췄습니다!`
            : "열차의 기세를 막지 못했습니다! (5.0m 이상 남기고 정지 필요)",
        };
      },

      update(dt) {
        const Audio = window.MB.Audio;
        const Juice = window.MB.Juice;
        this.animPhase += dt;

        if (this.phase === "countdown") {
          this.countdown -= dt;
          const num = Math.ceil(this.countdown);
          if (num < this.lastCountNum && num > 0) {
            this.lastCountNum = num;
            Audio.countdown(false);
            Juice.spawnText(480, 230, String(num), "#ffee33", 68);
          }
          if (this.countdown <= 0) {
            this.phase = "approach";
            Audio.countdown(true);
            Juice.spawnText(480, 200, "WAIT FOR YELLOW ZONE -> [SPACE]!", "#ffee33", 32);
          }
          return;
        }

        if (this.phase === "approach") {
          this.trainDist -= this.trainSpeed * dt;
          Juice.speedLineIntensity = 0.55;
          if (this.trainDist <= -30) {
            // Missed catch: slammed into push with high momentum
            this.trainDist = 0;
            this.trainSpeed = 30.5;
            this.catchQuality = "MISSED CATCH!";
            Audio.impactHeavy();
            Juice.feedback("large", 340, 410, "#ff3355");
            Juice.spawnText(480, 190, "MISSED CATCH! MASH A / D NOW!!", "#ff4455", 32);
            this.phase = "push";
          }
        } else if (this.phase === "push") {
          this.pushPower = Math.max(0, this.pushPower - 24 * dt);
          // Train slides left, consuming remainingMeters
          this.remainingMeters -= this.trainSpeed * dt;
          this.scrollTrack -= this.trainSpeed * 28 * dt;
          Juice.speedLineIntensity = Math.min(1, this.trainSpeed / 22);

          this.sparkTimer += dt;
          if (this.sparkTimer > 0.08 && this.trainSpeed > 2) {
            this.sparkTimer = 0;
            Audio.screech();
            Juice.spawnBurst(355, 456, 3, ["#ffee44", "#ff8822"], 180, { angleBase: -2.6, spread: 0.6 });
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
        Sprites.drawStadiumBg(ctx, W, H, this.scrollTrack, "night");

        // Railway bed & tracks
        ctx.fillStyle = "#2b2d3c";
        ctx.fillRect(0, 350, W, 190);
        // Wooden/concrete ties
        const tieOff = ((this.scrollTrack % 40) + 40) % 40;
        ctx.fillStyle = "#191b26";
        for (let x = -40 + tieOff; x < W + 40; x += 40) {
          ctx.fillRect(x, 452, 18, 22);
        }
        // Steel rails
        ctx.fillStyle = "#9aa7c7";
        ctx.fillRect(0, 456, W, 6);
        ctx.fillRect(0, 468, W, 6);

        // Red Danger Line on the left (approaches as remainingMeters -> 0)
        const dangerX = 300 - this.remainingMeters * 14;
        if (dangerX > -40) {
          ctx.fillStyle = "#ff2244";
          ctx.fillRect(dangerX - 8, 350, 14, 190);
          ctx.fillStyle = "#ffee33";
          ctx.font = "900 16px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("DANGER", dangerX, 376);
        }

        // Catch Zone indicator during approach
        if (this.phase === "approach") {
          ctx.save();
          ctx.fillStyle = "rgba(255, 220, 40, 0.25)";
          ctx.fillRect(340, 345, 130, 135);
          ctx.strokeStyle = "#ffee33";
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 6]);
          ctx.strokeRect(340, 345, 130, 135);
          ctx.setLineDash([]);
          ctx.fillStyle = "#ffee33";
          ctx.font = "900 15px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("CATCH ZONE [SPACE]", 405, 336);
          ctx.restore();
        }

        // Player bracing against the train
        const playerX = 320;
        const pose =
          this.phase === "push" ? "brace" :
          this.phase === "finish" ? (this.result.passed ? "win" : "fail") : "idle";
        Sprites.drawCharacter(ctx, char, playerX, 458, {
          scale: 1.25,
          pose,
          phase: this.animPhase,
          mega: this.megaActive,
        });

        // Hyper-Bullet Train
        const trainFrontX = playerX + 44 + Math.max(0, this.trainDist);
        Sprites.drawHyperTrain(ctx, trainFrontX, 462, this.phase === "approach" ? 1 : this.trainSpeed / 25);

        // Top HUD
        ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
        ctx.fillRect(20, 16, 240, 62);
        ctx.strokeStyle = "#4a548f";
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 16, 240, 62);
        ctx.fillStyle = "#98a0c8";
        ctx.font = "900 13px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("TRAIN STOP", 32, 36);
        ctx.fillStyle = this.remainingMeters < 10 ? "#ff3355" : "#55ff88";
        ctx.font = "900 26px monospace";
        ctx.fillText(`${this.remainingMeters.toFixed(1)}m LEFT`, 32, 67);

        const kmh = this.phase === "approach" ? 999 : Math.round(this.trainSpeed * 32);
        drawPowerBar(ctx, 285, 22, 385, 24, this.phase === "approach" ? 1 : this.trainSpeed / 28, `TRAIN SPEED: ${kmh} km/h`, false);
        drawPowerBar(ctx, 285, 56, 385, 18, this.pushPower / 100, `BRAKE POWER`, this.megaActive);

        ctx.fillStyle = "rgba(8, 10, 24, 0.85)";
        ctx.fillRect(695, 16, 245, 62);
        ctx.strokeStyle = "#4a548f";
        ctx.strokeRect(695, 16, 245, 62);
        ctx.fillStyle = "#fff";
        ctx.font = "900 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("TARGET: >= 5.0m LEFT", 817, 42);
        ctx.fillStyle = "#44ffff";
        ctx.font = "900 13px sans-serif";
        ctx.fillText("GOLD: >= 22.0m LEFT", 817, 64);
      },
    };
  }

  function createEvent(id, char, powerBonus) {
    if (id === "sprint") return createSprintEvent(char, powerBonus);
    if (id === "meteor") return createMeteorEvent(char, powerBonus);
    return createTrainEvent(char, powerBonus);
  }

  window.MB.Events = {
    LIST: EVENT_LIST,
    createEvent,
  };
})();

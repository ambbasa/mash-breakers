// Game-Feel / Juice Engine: Trauma Shake, Overlapping-safe Hit-Stop, Flash Limiter, Particles
window.MB = window.MB || {};

(function () {
  const MAX_PARTICLES = 180;
  const particles = [];
  const texts = [];
  const rings = [];

  const Juice = {
    trauma: 0,
    shakeTime: 0,
    shakeX: 0,
    shakeY: 0,
    shakeRot: 0,
    strength: 1.0, // Accessibility setting: 1.0 (full), 0.4 (reduced), 0.0 (off)
    reduceFlash: false,

    // Hit-stop state (real-time managed)
    timeScale: 1.0,
    _hitStopRemaining: 0,
    _hitStopId: 0,

    // Flash state (WCAG <= 3 flashes / sec)
    flashAlpha: 0,
    flashColor: "#ffffff",
    _flashTimestamps: [],

    // Speed lines
    speedLineIntensity: 0,

    reset() {
      this.trauma = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeRot = 0;
      this.timeScale = 1.0;
      this._hitStopRemaining = 0;
      this.flashAlpha = 0;
      this.speedLineIntensity = 0;
      particles.length = 0;
      texts.length = 0;
      rings.length = 0;
    },

    cycleAccessibility() {
      if (this.strength > 0.7) {
        this.strength = 0.4;
        this.reduceFlash = true;
        return "LOW";
      } else if (this.strength > 0.1) {
        this.strength = 0.0;
        this.reduceFlash = true;
        return "OFF";
      } else {
        this.strength = 1.0;
        this.reduceFlash = false;
        return "100%";
      }
    },

    addTrauma(amount) {
      this.trauma = Math.min(1.0, this.trauma + amount);
    },

    hitStop(duration, slow) {
      // Do not stack freeze forever; newest call owns restore
      this._hitStopId += 1;
      this.timeScale = slow !== undefined ? slow : 0.05;
      this._hitStopRemaining = Math.max(this._hitStopRemaining, duration || 0.07);
    },

    flash(color, alpha) {
      const now = performance.now();
      this._flashTimestamps = this._flashTimestamps.filter((t) => now - t < 1000);
      if (this._flashTimestamps.length >= 3) return; // WCAG 2.3.1 cap
      this._flashTimestamps.push(now);
      this.flashColor = color || "#ffffff";
      this.flashAlpha = this.reduceFlash ? Math.min(0.2, (alpha || 0.5) * 0.35) : (alpha || 0.55);
    },

    feedback(tier, x, y, color) {
      if (tier === "small") {
        this.addTrauma(0.14);
        this.spawnBurst(x, y, 4, color || "#ffee66", 140);
      } else if (tier === "medium") {
        this.addTrauma(0.42);
        this.hitStop(0.05, 0.08);
        this.flash(color || "#ffffff", 0.35);
        this.spawnBurst(x, y, 12, color || "#ffcc22", 260);
        this.spawnRing(x, y, color || "#ffcc22", 18, 95, 0.24);
      } else if (tier === "large") {
        this.addTrauma(0.9);
        this.hitStop(0.12, 0.04);
        this.flash(color || "#ffffff", 0.65);
        this.spawnBurst(x, y, 32, color || "#ff6622", 420);
        this.spawnRing(x, y, "#ffffff", 24, 190, 0.35);
        this.spawnRing(x, y, color || "#ffcc00", 12, 140, 0.42);
      }
    },

    spawnBurst(x, y, count, color, speed, opts) {
      const gravity = opts && opts.gravity !== undefined ? opts.gravity : 480;
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const angle = (opts && opts.angleBase !== undefined)
          ? opts.angleBase + (Math.random() - 0.5) * (opts.spread || 1.2)
          : Math.random() * Math.PI * 2;
        const spd = (0.35 + Math.random() * 0.85) * (speed || 220);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - (opts && opts.upBias ? opts.upBias : 60),
          size: 3 + Math.random() * 6,
          color: Array.isArray(color) ? color[i % color.length] : (color || "#ffdd44"),
          life: 0.28 + Math.random() * 0.38,
          maxLife: 0.66,
          gravity,
        });
      }
    },

    spawnRing(x, y, color, r0, r1, dur) {
      rings.push({ x, y, color: color || "#fff", r0, r1, t: 0, dur: dur || 0.3 });
    },

    spawnText(x, y, text, color, size) {
      texts.push({
        x,
        y,
        vy: -75,
        text,
        color: color || "#ffdd33",
        size: size || 26,
        t: 0,
        dur: 0.85,
      });
    },

    update(realDt) {
      // Real-time hit-stop decay
      if (this._hitStopRemaining > 0) {
        this._hitStopRemaining -= realDt;
        if (this._hitStopRemaining <= 0) {
          this._hitStopRemaining = 0;
          this.timeScale = 1.0;
        }
      }

      // Real-time trauma shake decay (never freezes off-center)
      if (this.trauma > 0) {
        this.trauma = Math.max(0, this.trauma - 1.55 * realDt);
        const s = this.trauma * this.trauma * this.strength;
        this.shakeTime += realDt * 34;
        this.shakeX = 16 * s * Math.sin(this.shakeTime * 1.7);
        this.shakeY = 12 * s * Math.sin(this.shakeTime * 2.3);
        this.shakeRot = 0.025 * s * Math.sin(this.shakeTime * 1.1);
        if (this.trauma <= 0) {
          this.shakeX = 0;
          this.shakeY = 0;
          this.shakeRot = 0;
        }
      }

      if (this.flashAlpha > 0) {
        this.flashAlpha = Math.max(0, this.flashAlpha - realDt * 2.6);
      }

      const simDt = realDt * this.timeScale;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= simDt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.vy += p.gravity * simDt;
        p.x += p.vx * simDt;
        p.y += p.vy * simDt;
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.t += realDt;
        if (r.t >= r.dur) rings.splice(i, 1);
      }

      for (let i = texts.length - 1; i >= 0; i--) {
        const tx = texts[i];
        tx.t += realDt;
        tx.y += tx.vy * realDt;
        tx.vy *= 0.94;
        if (tx.t >= tx.dur) texts.splice(i, 1);
      }

      return simDt;
    },

    drawEffects(ctx, W, H) {
      // Anime speed lines around borders when speedLineIntensity > 0
      if (this.speedLineIntensity > 0.05) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * this.speedLineIntensity})`;
        ctx.lineWidth = 3;
        const count = Math.floor(18 * this.speedLineIntensity);
        const cx = W * 0.5;
        const cy = H * 0.5;
        const seed = Math.floor(performance.now() / 45);
        for (let i = 0; i < count; i++) {
          const ang = ((i * 1.618 + seed * 0.37) % 1) * Math.PI * 2;
          const rIn = 230 + ((i * 53 + seed * 19) % 120);
          const rOut = 580;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * rIn, cy + Math.sin(ang) * rIn);
          ctx.lineTo(cx + Math.cos(ang) * rOut, cy + Math.sin(ang) * rOut);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Shockwave rings
      for (const r of rings) {
        const p = r.t / r.dur;
        const ease = 1 - Math.pow(1 - p, 3);
        const rad = r.r0 + (r.r1 - r.r0) * ease;
        ctx.save();
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = Math.max(0, 1 - p);
        ctx.lineWidth = Math.max(2, 8 * (1 - p));
        ctx.beginPath();
        ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Pixel debris / spark particles
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.35));
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - p.size * 0.5), Math.round(p.y - p.size * 0.5), Math.round(p.size), Math.round(p.size));
        ctx.restore();
      }

      // Pop-up arcade texts
      for (const tx of texts) {
        const p = tx.t / tx.dur;
        const popScale = p < 0.18 ? 0.6 + (p / 0.18) * 0.65 : Math.max(1, 1.25 - (p - 0.18) * 0.6);
        ctx.save();
        ctx.translate(tx.x, tx.y);
        ctx.scale(popScale, popScale);
        ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
        ctx.font = `900 ${tx.size}px "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#000";
        ctx.strokeText(tx.text, 0, 0);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.text, 0, 0);
        ctx.restore();
      }

      // Flash overlay
      if (this.flashAlpha > 0.01) {
        ctx.save();
        ctx.fillStyle = this.flashColor;
        ctx.globalAlpha = this.flashAlpha;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    },
  };

  window.MB.Juice = Juice;
})();

// Modern Neo-Arcade Game-Feel / Juice Engine
// Trauma Shake, Overlapping-safe Hit-Stop, Dynamic Camera Zoom, Anime Cut-Ins,
// Afterimage Ghosts, Velocity-Stretched Sparks, Rock Debris, Lightning & WCAG Flash Limiter
window.MB = window.MB || {};

(function () {
  const MAX_PARTICLES = 240;
  const particles = [];
  const texts = [];
  const rings = [];
  const afterimages = [];
  const bolts = [];

  const Juice = {
    trauma: 0,
    shakeTime: 0,
    shakeX: 0,
    shakeY: 0,
    shakeRot: 0,
    strength: 1.0, // Accessibility: 1.0 (100%), 0.4 (LOW), 0.0 (OFF)
    reduceFlash: false,

    // Dynamic camera zoom punch
    zoom: 1.0,
    zoomTarget: 1.0,
    zoomVel: 0,

    // Hit-stop state (real-time managed, overlapping-safe)
    timeScale: 1.0,
    _hitStopRemaining: 0,
    _hitStopId: 0,

    // Flash state (WCAG 2.3.1 <= 3 flashes / sec)
    flashAlpha: 0,
    flashColor: "#ffffff",
    _flashTimestamps: [],

    // Speed lines & chromatic impact pulse
    speedLineIntensity: 0,
    speedLineColor: "#ffffff",
    chromaPulse: 0,

    // Anime portrait cut-in banner
    cutIn: null,

    reset() {
      this.trauma = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeRot = 0;
      this.zoom = 1.0;
      this.zoomTarget = 1.0;
      this.zoomVel = 0;
      this.timeScale = 1.0;
      this._hitStopRemaining = 0;
      this.flashAlpha = 0;
      this.speedLineIntensity = 0;
      this.speedLineColor = "#ffffff";
      this.chromaPulse = 0;
      this.cutIn = null;
      particles.length = 0;
      texts.length = 0;
      rings.length = 0;
      afterimages.length = 0;
      bolts.length = 0;
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

    addZoomKick(amount) {
      if (this.strength <= 0.05) return;
      this.zoom = Math.min(1.14, this.zoom + amount * this.strength);
    },

    hitStop(duration, slow) {
      this._hitStopId += 1;
      this.timeScale = slow !== undefined ? slow : 0.04;
      this._hitStopRemaining = Math.max(this._hitStopRemaining, duration || 0.07);
    },

    flash(color, alpha) {
      const now = performance.now();
      this._flashTimestamps = this._flashTimestamps.filter((t) => now - t < 1000);
      if (this._flashTimestamps.length >= 3) return; // WCAG 2.3.1 cap
      this._flashTimestamps.push(now);
      this.flashColor = color || "#ffffff";
      this.flashAlpha = this.reduceFlash
        ? Math.min(0.16, (alpha || 0.45) * 0.3)
        : (alpha || 0.5);
    },

    triggerCutIn(char, title, subtitle, accentColor) {
      this.cutIn = {
        char,
        title: title || "MEGA MASH!!",
        subtitle: subtitle || char.title,
        accent: accentColor || char.aura || "#ffee33",
        t: 0,
        dur: 0.92,
      };
    },

    spawnAfterimage(x, y, char, opts) {
      if (afterimages.length > 10) afterimages.shift();
      afterimages.push({
        x,
        y,
        char,
        opts: Object.assign({}, opts, { mega: false }),
        t: 0,
        dur: 0.24,
        color: char.aura || "#44ffff",
      });
    },

    spawnLightning(x1, y1, x2, y2, color) {
      const pts = [{ x: x1, y: y1 }];
      const segs = 6;
      for (let i = 1; i < segs; i++) {
        const f = i / segs;
        pts.push({
          x: x1 + (x2 - x1) * f + (Math.random() - 0.5) * 32,
          y: y1 + (y2 - y1) * f + (Math.random() - 0.5) * 32,
        });
      }
      pts.push({ x: x2, y: y2 });
      bolts.push({ pts, color: color || "#ffee44", t: 0, dur: 0.16 });
    },

    feedback(tier, x, y, color) {
      if (tier === "small") {
        this.addTrauma(0.14);
        this.spawnBurst(x, y, 5, color || "#ffee66", 170, { kind: "spark" });
      } else if (tier === "medium") {
        this.addTrauma(0.42);
        this.addZoomKick(0.035);
        this.hitStop(0.05, 0.08);
        this.flash(color || "#ffffff", 0.32);
        this.spawnBurst(x, y, 16, [color || "#ffcc22", "#ffffff"], 310, { kind: "spark" });
        this.spawnRing(x, y, color || "#ffcc22", 18, 120, 0.26);
      } else if (tier === "large") {
        this.addTrauma(0.92);
        this.addZoomKick(0.075);
        this.chromaPulse = 1.0;
        this.hitStop(0.11, 0.03);
        this.flash(color || "#ffffff", 0.58);
        this.spawnBurst(x, y, 36, [color || "#ff6622", "#ffee44", "#ffffff"], 480, { kind: "spark" });
        this.spawnBurst(x, y, 10, ["#ffffff", "rgba(255,220,160,0.8)"], 190, { kind: "smoke", gravity: -40 });
        this.spawnRing(x, y, "#ffffff", 26, 230, 0.36);
        this.spawnRing(x, y, color || "#ffcc00", 12, 165, 0.44);
      }
    },

    spawnBurst(x, y, count, color, speed, opts) {
      const o = opts || {};
      const gravity = o.gravity !== undefined ? o.gravity : 480;
      const kind = o.kind || "spark";
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const angle =
          o.angleBase !== undefined
            ? o.angleBase + (Math.random() - 0.5) * (o.spread || 1.2)
            : Math.random() * Math.PI * 2;
        const spd = (0.35 + Math.random() * 0.85) * (speed || 240);
        const life = kind === "smoke" ? 0.38 + Math.random() * 0.32 : 0.24 + Math.random() * 0.36;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - (o.upBias !== undefined ? o.upBias : 60),
          size: kind === "smoke" ? 12 + Math.random() * 18 : kind === "rock" ? 7 + Math.random() * 11 : 3 + Math.random() * 5,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 12,
          color: Array.isArray(color) ? color[i % color.length] : (color || "#ffdd44"),
          life,
          maxLife: life,
          gravity,
          kind,
        });
      }
    },

    spawnRing(x, y, color, r0, r1, dur) {
      rings.push({ x, y, color: color || "#fff", r0, r1, t: 0, dur: dur || 0.32 });
    },

    spawnText(x, y, text, color, size) {
      texts.push({
        x,
        y,
        vy: -88,
        text,
        color: color || "#ffdd33",
        size: size || 28,
        t: 0,
        dur: 0.88,
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

      // Smooth spring back for camera zoom
      this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, realDt * 11);
      if (Math.abs(this.zoom - this.zoomTarget) < 0.0005) this.zoom = this.zoomTarget;

      // Real-time trauma shake decay
      if (this.trauma > 0) {
        this.trauma = Math.max(0, this.trauma - 1.6 * realDt);
        const s = this.trauma * this.trauma * this.strength;
        this.shakeTime += realDt * 36;
        this.shakeX = 18 * s * Math.sin(this.shakeTime * 1.7);
        this.shakeY = 13 * s * Math.sin(this.shakeTime * 2.3);
        this.shakeRot = 0.024 * s * Math.sin(this.shakeTime * 1.1);
        if (this.trauma <= 0) {
          this.shakeX = 0;
          this.shakeY = 0;
          this.shakeRot = 0;
        }
      }

      if (this.flashAlpha > 0) {
        this.flashAlpha = Math.max(0, this.flashAlpha - realDt * 2.8);
      }
      if (this.chromaPulse > 0) {
        this.chromaPulse = Math.max(0, this.chromaPulse - realDt * 3.8);
      }

      if (this.cutIn) {
        this.cutIn.t += realDt;
        if (this.cutIn.t >= this.cutIn.dur) this.cutIn = null;
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
        p.rot += p.vrot * simDt;
        if (p.kind === "smoke") {
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.size += 28 * simDt;
        }
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
        tx.vy *= 0.92;
        if (tx.t >= tx.dur) texts.splice(i, 1);
      }

      for (let i = afterimages.length - 1; i >= 0; i--) {
        afterimages[i].t += realDt;
        if (afterimages[i].t >= afterimages[i].dur) afterimages.splice(i, 1);
      }

      for (let i = bolts.length - 1; i >= 0; i--) {
        bolts[i].t += realDt;
        if (bolts[i].t >= bolts[i].dur) bolts.splice(i, 1);
      }

      return simDt;
    },

    drawAfterimages(ctx) {
      const Sprites = window.MB.Sprites;
      if (!Sprites) return;
      for (const g of afterimages) {
        const alpha = (1 - g.t / g.dur) * 0.42;
        ctx.save();
        ctx.globalAlpha = alpha;
        Sprites.drawCharacter(ctx, g.char, g.x, g.y, Object.assign({}, g.opts, { ghostTint: g.color }));
        ctx.restore();
      }
    },

    drawCutIn(ctx, W, H) {
      const c = this.cutIn;
      if (!c) return;
      const p = c.t / c.dur;
      // Fast ease-in, hold, fast slide-out
      let slide = 0;
      if (p < 0.16) {
        const k = 1 - Math.pow(1 - p / 0.16, 3);
        slide = (1 - k) * -W;
      } else if (p > 0.78) {
        const k = Math.pow((p - 0.78) / 0.22, 2);
        slide = k * W;
      }

      const bandY = H * 0.34;
      const bandH = 122;

      ctx.save();
      ctx.translate(slide, 0);

      // Diagonal anime slash strip
      ctx.beginPath();
      ctx.moveTo(-40, bandY + 14);
      ctx.lineTo(W + 40, bandY - 14);
      ctx.lineTo(W + 40, bandY + bandH - 14);
      ctx.lineTo(-40, bandY + bandH + 14);
      ctx.closePath();

      const bgGrad = ctx.createLinearGradient(0, bandY, W, bandY + bandH);
      bgGrad.addColorStop(0, "#090c1e");
      bgGrad.addColorStop(0.55, c.char.suit);
      bgGrad.addColorStop(1, "#090c1e");
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Clip interior for speed-lines + portrait
      ctx.save();
      ctx.clip();

      // Animated high-contrast speed streaks inside banner
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      const shift = (c.t * 1400) % 240;
      for (let i = -1; i < 7; i++) {
        ctx.fillRect(i * 180 + shift - 120, bandY + (i % 3) * 34 - 10, 110, 6);
        ctx.fillRect(i * 210 + shift * 1.3 - 150, bandY + 18 + (i % 4) * 26, 75, 3);
      }

      // Hero portrait on left side of cut-in
      const img = window.MB.Sprites && window.MB.Sprites.getPortrait(c.char.id);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        // Skewed portrait frame
        ctx.beginPath();
        ctx.moveTo(80, bandY - 25);
        ctx.lineTo(295, bandY - 25);
        ctx.lineTo(260, bandY + bandH + 25);
        ctx.lineTo(45, bandY + bandH + 25);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 55, bandY - 38, 240, 240);
        ctx.restore();

        // Rim glow border on portrait frame
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(295, bandY - 25);
        ctx.lineTo(260, bandY + bandH + 25);
        ctx.stroke();
      }

      // Bold skewed kinetic typography
      ctx.save();
      ctx.translate(315, bandY + 62);
      ctx.transform(1, -0.028, -0.18, 1, 0, 0);
      ctx.textAlign = "left";
      ctx.font = "900 44px 'Arial Black', Impact, sans-serif";
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#080a16";
      ctx.strokeText(c.title, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(c.title, 0, 0);

      ctx.font = "900 18px 'Segoe UI', sans-serif";
      ctx.fillStyle = c.accent;
      ctx.strokeStyle = "#080a16";
      ctx.lineWidth = 5;
      ctx.strokeText(`${c.char.name} // ${c.subtitle}`, 6, 30);
      ctx.fillText(`${c.char.name} // ${c.subtitle}`, 6, 30);
      ctx.restore();

      ctx.restore(); // end clip

      // Crisp thick neon borders on top/bottom of slash
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-40, bandY + 14);
      ctx.lineTo(W + 40, bandY - 14);
      ctx.moveTo(-40, bandY + bandH + 14);
      ctx.lineTo(W + 40, bandY + bandH - 14);
      ctx.stroke();

      ctx.restore();
    },

    drawEffects(ctx, W, H) {
      // Anime radial speed lines + edge vignette
      if (this.speedLineIntensity > 0.05 && this.strength > 0.05) {
        ctx.save();
        const inten = this.speedLineIntensity * this.strength;
        const count = Math.floor(28 * inten);
        const cx = W * 0.5;
        const cy = H * 0.5;
        const seed = Math.floor(performance.now() / 36);
        for (let i = 0; i < count; i++) {
          const ang = ((i * 1.61803 + seed * 0.29) % 1) * Math.PI * 2;
          const rIn = 235 + ((i * 61 + seed * 23) % 135);
          const rOut = 620;
          ctx.strokeStyle = i % 3 === 0 ? `rgba(68, 255, 255, ${0.32 * inten})` : `rgba(255, 255, 255, ${0.42 * inten})`;
          ctx.lineWidth = i % 4 === 0 ? 4.5 : 2.2;
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
        ctx.lineWidth = Math.max(2, 11 * (1 - p));
        ctx.beginPath();
        ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Lightning bolts
      for (const b of bolts) {
        const alpha = 1 - b.t / b.dur;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        b.pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();
      }

      // Rich layered particles
      for (const p of particles) {
        const ratio = Math.max(0, Math.min(1, p.life / p.maxLife));
        ctx.save();
        if (p.kind === "smoke") {
          ctx.globalAlpha = ratio * 0.42;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "rock") {
          ctx.globalAlpha = Math.min(1, ratio * 1.6);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.strokeStyle = "#160d0c";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-p.size, -p.size * 0.5);
          ctx.lineTo(p.size * 0.6, -p.size * 0.8);
          ctx.lineTo(p.size, p.size * 0.4);
          ctx.lineTo(-p.size * 0.4, p.size * 0.9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Velocity-stretched glowing laser spark!
          ctx.globalAlpha = Math.min(1, ratio * 1.5);
          const spd = Math.hypot(p.vx, p.vy);
          const len = Math.max(p.size * 1.8, Math.min(34, spd * 0.055));
          const ang = Math.atan2(p.vy, p.vx);
          ctx.translate(p.x, p.y);
          ctx.rotate(ang);
          ctx.fillStyle = p.color;
          ctx.fillRect(-len * 0.5, -p.size * 0.38, len, p.size * 0.76);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-len * 0.25, -p.size * 0.16, len * 0.5, p.size * 0.32);
        }
        ctx.restore();
      }

      // Anime Cut-In Banner
      this.drawCutIn(ctx, W, H);

      // Pop-up kinetic arcade texts (skewed & shadowed)
      for (const tx of texts) {
        const p = tx.t / tx.dur;
        const popScale = p < 0.16 ? 0.55 + (p / 0.16) * 0.75 : Math.max(1, 1.3 - (p - 0.16) * 0.65);
        ctx.save();
        ctx.translate(tx.x, tx.y);
        ctx.transform(popScale, 0, -0.14 * popScale, popScale, 0, 0);
        ctx.globalAlpha = p > 0.72 ? (1 - p) / 0.28 : 1;
        ctx.font = `900 ${tx.size}px "Arial Black", "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.lineWidth = 7;
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#080a16";
        ctx.strokeText(tx.text, 0, 0);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.text, 0, 0);
        ctx.restore();
      }

      // Chromatic border impact pulse (non-flashing stylized edge energy)
      if (this.chromaPulse > 0.02 && this.strength > 0.1) {
        ctx.save();
        ctx.strokeStyle = `rgba(68, 255, 255, ${0.45 * this.chromaPulse * this.strength})`;
        ctx.lineWidth = 14 * this.chromaPulse;
        ctx.strokeRect(4, 4, W - 8, H - 8);
        ctx.strokeStyle = `rgba(255, 40, 90, ${0.4 * this.chromaPulse * this.strength})`;
        ctx.lineWidth = 6 * this.chromaPulse;
        ctx.strokeRect(10, 10, W - 20, H - 20);
        ctx.restore();
      }

      // WCAG-capped flash overlay
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

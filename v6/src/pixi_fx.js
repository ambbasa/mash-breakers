// Optional PixiJS WebGL 2D GPU-Accelerated Additive VFX Layer
// Renders glowing GPU sparks, ice crystal shatters, and shockwaves on top of the 16:9 stage
// Automatically falls back gracefully if WebGL or PixiJS CDN is unavailable.
window.MB = window.MB || {};

(function () {
  const W = 960;
  const H = 540;
  let app = null;
  let gfx = null;
  const gpuParticles = [];

  const PixiFX = {
    enabled: false,

    init() {
      try {
        if (!window.PIXI) return;
        const wrap = document.getElementById("stage-wrap");
        if (!wrap) return;
        app = new window.PIXI.Application({
          width: W,
          height: H,
          backgroundAlpha: 0,
          antialias: true,
          powerPreference: "high-performance",
        });
        const view = app.view;
        view.id = "pixi-fx-canvas";
        view.style.position = "absolute";
        view.style.inset = "0";
        view.style.width = "100%";
        view.style.height = "100%";
        view.style.maxWidth = "100%";
        view.style.maxHeight = "100%";
        view.style.objectFit = "contain";
        view.style.pointerEvents = "none";
        view.style.zIndex = "5";
        wrap.appendChild(view);

        gfx = new window.PIXI.Graphics();
        gfx.blendMode = window.PIXI.BLEND_MODES.ADD;
        app.stage.addChild(gfx);
        this.enabled = true;
      } catch (_) {
        this.enabled = false;
      }
    },

    spawnIceShatter(x, y, count) {
      if (!this.enabled) return;
      const cols = [0x38f3ff, 0x99f6ff, 0xffffff, 0x00aaff];
      const n = count || 26;
      for (let i = 0; i < n; i++) {
        const ang = (Math.random() - 0.5) * 1.6 - 0.35;
        const spd = 220 + Math.random() * 440;
        gpuParticles.push({
          x,
          y: y + (Math.random() - 0.5) * 110,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 120,
          size: 6 + Math.random() * 14,
          color: cols[i % cols.length],
          life: 0.38 + Math.random() * 0.35,
          maxLife: 0.72,
          kind: "shard",
        });
      }
    },

    spawnGlowBurst(x, y, colorHex, count) {
      if (!this.enabled) return;
      const n = count || 18;
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 160 + Math.random() * 380;
        gpuParticles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 60,
          size: 4 + Math.random() * 7,
          color: colorHex || 0xffee33,
          life: 0.25 + Math.random() * 0.28,
          maxLife: 0.53,
          kind: "glow",
        });
      }
    },

    updateAndDraw(dt) {
      if (!this.enabled || !gfx) return;
      gfx.clear();
      for (let i = gpuParticles.length - 1; i >= 0; i--) {
        const p = gpuParticles[i];
        p.life -= dt;
        if (p.life <= 0) {
          gpuParticles.splice(i, 1);
          continue;
        }
        p.vy += 680 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));

        if (p.kind === "shard") {
          gfx.beginFill(p.color, alpha * 0.85);
          gfx.moveTo(p.x, p.y - p.size * 0.7);
          gfx.lineTo(p.x + p.size * 0.8, p.y);
          gfx.lineTo(p.x, p.y + p.size * 0.7);
          gfx.lineTo(p.x - p.size * 0.5, p.y);
          gfx.closePath();
          gfx.endFill();
        } else {
          gfx.beginFill(p.color, alpha * 0.75);
          gfx.drawCircle(p.x, p.y, p.size * alpha);
          gfx.endFill();
        }
      }
    },
  };

  window.MB.PixiFX = PixiFX;
})();

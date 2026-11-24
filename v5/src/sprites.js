// MASH BREAKERS V3 — High-Density Cel-Shaded RGBA Sprite, Colossal Prop & Stage Renderer
// Benchmarked against Mach Breakers: Numan Athletics 2 (1995) with modern 2026 Neo-Arcade fidelity
window.MB = window.MB || {};

(function () {
  const CHARACTERS = [
    {
      id: "rex",
      name: "REX VOLT",
      country: "USA",
      title: "LIGHTNING SPRINTER",
      suit: "#e62642",
      suitDark: "#961228",
      trim: "#ffd426",
      aura: "#ffe033",
      trailColors: ["#ffee33", "#ff9900", "#ffffff"],
      portraitPath: "assets/rex.jpg",
      spritePath: "assets/sprite_rex.webp",
      speedStat: 9,
      mashStat: 8,
      powerStat: 8,
      speedMult: 1.08,
      mashMult: 1.0,
      powerMult: 1.0,
    },
    {
      id: "hana",
      name: "HANA KAGE",
      country: "JPN",
      title: "TURBO MASHER",
      suit: "#14b8f0",
      suitDark: "#0b6e9e",
      trim: "#e8fbff",
      aura: "#38f3ff",
      trailColors: ["#38f3ff", "#0088ff", "#ffffff"],
      portraitPath: "assets/hana.jpg",
      spritePath: "assets/sprite_hana.webp",
      speedStat: 8,
      mashStat: 10,
      powerStat: 7,
      speedMult: 1.02,
      mashMult: 1.12,
      powerMult: 0.96,
    },
    {
      id: "bruno",
      name: "BRUNO IRON",
      country: "GER",
      title: "TITAN BREAKER",
      suit: "#1ea855",
      suitDark: "#0e6432",
      trim: "#ffcc29",
      aura: "#4dff88",
      trailColors: ["#4dff88", "#ffee33", "#ffffff"],
      portraitPath: "assets/bruno.jpg",
      spritePath: "assets/sprite_bruno.webp",
      speedStat: 7,
      mashStat: 8,
      powerStat: 10,
      speedMult: 0.96,
      mashMult: 1.0,
      powerMult: 1.15,
    },
  ];

  const imageCache = {};
  function loadImg(key, path) {
    const img = new Image();
    const inlineMap = window.MB_INLINE_ASSETS || {};
    img.src = inlineMap[key] || path;
    imageCache[key] = img;
    return img;
  }

  CHARACTERS.forEach((c) => {
    loadImg(c.id, c.portraitPath);
    loadImg("sprite_" + c.id, c.spritePath);
  });
  loadImg("stadium", "assets/stadium.jpg");
  loadImg("stage_volcano", "assets/stage_volcano.jpg");
  loadImg("stage_viaduct", "assets/stage_viaduct.jpg");
  loadImg("prop_train", "assets/prop_train.webp");
  loadImg("prop_meteor", "assets/prop_meteor.webp");
  loadImg("prop_racer", "assets/prop_racer.webp");
  loadImg("rex_run_sheet", "assets/rex_run_sheet.webp");
  loadImg("rex_smash", "assets/rex_smash.webp");
  loadImg("prop_iceblock", "assets/prop_iceblock.webp");
  loadImg("stage_glacier", "assets/stage_glacier.jpg");

  function getPortrait(id) {
    return imageCache[id] || null;
  }

  function getAsset(key) {
    return imageCache[key] || null;
  }

  // =========================================================
  // HIGH-DENSITY FULL-BODY CEL-SHADED CHARACTER RENDERER
  // =========================================================
  function drawCharacter(ctx, char, x, y, opts) {
    const o = opts || {};
    const scale = o.scale || 1;
    const pose = o.pose || "idle";
    const phase = o.phase || 0;
    const mega = !!o.mega;
    const sx = (o.scaleX || 1) * (o.flip ? -1 : 1);
    const sy = o.scaleY || 1;
    const ghostTint = o.ghostTint || null;

    const sprite = imageCache["sprite_" + char.id];
    const ready = sprite && sprite.complete && sprite.naturalWidth > 0;

    ctx.save();
    ctx.translate(x, y);

    // Rich grounded contact shadow
    if (!ghostTint) {
      const shW = (char.id === "bruno" ? 66 : 56) * scale;
      const shGrad = ctx.createRadialGradient(0, 2, 4, 0, 2, shW);
      shGrad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
      shGrad.addColorStop(0.65, "rgba(0, 0, 0, 0.35)");
      shGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = shGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, shW, 14 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // MEGA MASH!! Blazing Superhuman Aura behind hero
    if (mega && !ghostTint) {
      const t = performance.now() * 0.016;
      const pulse = 1 + Math.sin(t * 1.6) * 0.1;
      ctx.save();
      const auraGrad = ctx.createRadialGradient(0, -78 * scale, 10, 0, -78 * scale, 112 * scale * pulse);
      auraGrad.addColorStop(0, "rgba(255,255,255,0.72)");
      auraGrad.addColorStop(0.45, char.aura + "88");
      auraGrad.addColorStop(1, char.aura + "00");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.ellipse(0, -78 * scale, 88 * scale * pulse, 108 * scale * pulse, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic anime energy flame spikes
      ctx.strokeStyle = char.aura;
      ctx.lineWidth = 3.5;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + t * 0.4;
        const rx = Math.cos(ang) * 52 * scale;
        const ry = -78 * scale + Math.sin(ang) * 68 * scale;
        const spike = (18 + ((i * 9 + Math.floor(t * 5)) % 22)) * scale;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx * 1.25, ry - spike);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Pose-driven kinetic transform on the illustrated full-body sprite
    let rot = 0;
    let bobY = 0;
    let dynSX = sx;
    let dynSY = sy;

    if (pose === "run") {
      const stride = Math.sin(phase * 14);
      bobY = -Math.abs(stride) * 14 * scale;
      rot = 0.08 + stride * 0.06;
      dynSX *= 1 + Math.abs(stride) * 0.06;
      dynSY *= 1 - Math.abs(stride) * 0.04;
    } else if (pose === "charge") {
      bobY = Math.sin(phase * 42) * 4 * scale;
      rot = -0.06 + Math.sin(phase * 32) * 0.03;
      dynSX *= 1.06;
      dynSY *= 0.94;
    } else if (pose === "punch") {
      rot = -0.34;
      dynSX *= 0.92;
      dynSY *= 1.14;
    } else if (pose === "brace") {
      bobY = Math.sin(phase * 36) * 2.5 * scale;
      rot = -0.22;
      dynSX *= 1.04;
      dynSY *= 0.96;
    } else if (pose === "win") {
      bobY = -Math.abs(Math.sin(phase * 7.5)) * 18 * scale;
      rot = Math.sin(phase * 7.5) * 0.06;
    } else if (pose === "fail") {
      rot = 0.25;
      dynSY *= 0.88;
    } else {
      bobY = Math.sin(phase * 3.8) * 3 * scale;
    }

    ctx.translate(0, bobY);
    ctx.rotate(rot);
    ctx.scale(dynSX, dynSY);

    const rexSheet = char.id === "rex" ? imageCache.rex_run_sheet : null;
    const rexSmash = char.id === "rex" ? imageCache.rex_smash : null;
    const useRunSheet = pose === "run" && rexSheet && rexSheet.complete && rexSheet.naturalWidth > 0;
    const useSmashPose = (pose === "punch" || pose === "smash") && rexSmash && rexSmash.complete && rexSmash.naturalWidth > 0;

    if (useRunSheet || useSmashPose || ready) {
      if (ghostTint) {
        ctx.filter = "brightness(1.9) saturate(2.5)";
      } else if (mega) {
        ctx.shadowColor = char.aura;
        ctx.shadowBlur = 18;
      }

      let drawW = 160 * scale, drawH = 160 * scale;
      if (useRunSheet) {
        const fw = rexSheet.naturalWidth / 4;
        const fh = rexSheet.naturalHeight;
        const frameIdx = Math.abs(Math.floor(phase * 12)) % 4;
        drawH = 166 * scale;
        drawW = drawH * (fw / fh);
        ctx.drawImage(rexSheet, frameIdx * fw, 0, fw, fh, -drawW * 0.5, -drawH + 8 * scale, drawW, drawH);
      } else if (useSmashPose) {
        drawH = 172 * scale;
        drawW = drawH * (rexSmash.naturalWidth / rexSmash.naturalHeight);
        ctx.drawImage(rexSmash, -drawW * 0.45, -drawH + 10 * scale, drawW, drawH);
      } else {
        const baseH = (char.id === "bruno" ? 168 : 158) * scale;
        const aspect = sprite.naturalWidth / sprite.naturalHeight;
        drawW = baseH * aspect;
        drawH = baseH;
        ctx.drawImage(sprite, -drawW * 0.5, -drawH + 8 * scale, drawW, drawH);
      }
      ctx.filter = "none";
      ctx.shadowBlur = 0;

      // Blazing uppercut fist flare when punching
      if (pose === "punch" && !ghostTint) {
        const fg = ctx.createRadialGradient(drawW * 0.26, -drawH * 0.65, 4, drawW * 0.26, -drawH * 0.65, 58 * scale);
        fg.addColorStop(0, "rgba(255,255,255,0.95)");
        fg.addColorStop(0.45, char.aura + "aa");
        fg.addColorStop(1, char.aura + "00");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(drawW * 0.26, -drawH * 0.65, 58 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Fallback silhouette only while image initializes
      ctx.fillStyle = char.suit;
      ctx.fillRect(-24 * scale, -110 * scale, 48 * scale, 110 * scale);
    }

    ctx.restore();
  }

  // =========================================================
  // DEDICATED HIGH-RES ANIME STAGE BACKDROPS PER EVENT
  // =========================================================
  function drawStageBg(ctx, W, H, scrollX, stageKey) {
    const t = performance.now() * 0.001;

    if (stageKey === "volcano") {
      const img = imageCache.stage_volcano;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, W, H);
      } else {
        ctx.fillStyle = "#261018";
        ctx.fillRect(0, 0, W, H);
      }
      // Animated rising volcanic heat glow & floating ember sparks
      ctx.save();
      const heat = ctx.createLinearGradient(0, H * 0.6, 0, H);
      heat.addColorStop(0, "rgba(255, 90, 20, 0)");
      heat.addColorStop(1, "rgba(255, 80, 10, 0.24)");
      ctx.fillStyle = heat;
      ctx.fillRect(0, H * 0.6, W, H * 0.4);
      for (let i = 0; i < 18; i++) {
        const ex = ((i * 67 + t * (28 + (i % 4) * 14)) % (W + 40)) - 20;
        const ey = H - ((i * 53 + t * (45 + (i % 5) * 18)) % (H * 0.85));
        ctx.fillStyle = i % 2 === 0 ? "rgba(255, 220, 80, 0.7)" : "rgba(255, 110, 30, 0.6)";
        ctx.fillRect(ex, ey, 3.5, 3.5);
      }
      ctx.restore();
      return;
    }

    if (stageKey === "glacier") {
      const img = imageCache.stage_glacier;
      if (img && img.complete && img.naturalWidth > 0) {
        const shift = ((-scrollX * 0.24) % W + W) % W;
        ctx.drawImage(img, shift - W, 0, W, H);
        ctx.drawImage(img, shift, 0, W, H);
      } else {
        ctx.fillStyle = "#0b1a36";
        ctx.fillRect(0, 0, W, H);
      }
      return;
    }

    if (stageKey === "viaduct") {
      const img = imageCache.stage_viaduct;
      if (img && img.complete && img.naturalWidth > 0) {
        // Parallax horizontal seamless tile scroll on the viaduct!
        const shift = ((scrollX * 0.28) % W + W) % W;
        ctx.drawImage(img, shift - W, 0, W, H);
        ctx.drawImage(img, shift, 0, W, H);
      } else {
        ctx.fillStyle = "#0a0e22";
        ctx.fillRect(0, 0, W, H);
      }
      // Subtle animated neon searchlight shimmer
      ctx.save();
      const sway = Math.sin(t * 1.4) * 90;
      const g = ctx.createLinearGradient(480, 260, 480 + sway, 0);
      g.addColorStop(0, "rgba(56, 243, 255, 0.14)");
      g.addColorStop(1, "rgba(56, 243, 255, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(465, 260);
      ctx.lineTo(495, 260);
      ctx.lineTo(570 + sway, 0);
      ctx.lineTo(390 + sway, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    // Default: Neo-Tokyo Megadome scrolling panorama for MACH SPRINT
    const stadium = imageCache.stadium;
    if (stadium && stadium.complete && stadium.naturalWidth > 0) {
      const shift = ((-scrollX * 0.22) % W + W) % W;
      ctx.drawImage(stadium, shift - W, -24, W, 388);
      ctx.drawImage(stadium, shift, -24, W, 388);
      // Horizon blend into high-speed track
      const fade = ctx.createLinearGradient(0, 285, 0, 354);
      fade.addColorStop(0, "rgba(10, 14, 34, 0)");
      fade.addColorStop(1, "rgba(10, 14, 34, 0.85)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 285, W, 70);
    } else {
      ctx.fillStyle = "#123478";
      ctx.fillRect(0, 0, W, 355);
    }

    // Glowing LED speed ribbon along stadium track wall
    const wallY = 322;
    ctx.fillStyle = "#080c1e";
    ctx.fillRect(0, wallY, W, 28);
    const boardOff = ((-scrollX * 0.9) % 300 + 300) % 300;
    for (let x = boardOff - 300; x < W + 300; x += 300) {
      const g1 = ctx.createLinearGradient(x + 6, wallY, x + 144, wallY);
      g1.addColorStop(0, "#ff1e56");
      g1.addColorStop(1, "#ff8800");
      ctx.fillStyle = g1;
      ctx.fillRect(x + 6, wallY + 4, 140, 20);
      const g2 = ctx.createLinearGradient(x + 154, wallY, x + 292, wallY);
      g2.addColorStop(0, "#0088ff");
      g2.addColorStop(1, "#38f3ff");
      ctx.fillStyle = g2;
      ctx.fillRect(x + 154, wallY + 4, 140, 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 900 11px 'Arial Black', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("MASH BREAKERS ⚡", x + 76, wallY + 18);
      ctx.fillText("NEO-TOKYO CUP", x + 224, wallY + 18);
    }
  }

  // =========================================================
  // COLOSSAL HERO PROP 1: VOLCANIC MAGMA METEOR (65% SCREEN SCALE)
  // =========================================================
  function drawMeteor(ctx, x, y, diameter, crackLevel, shattered, shatterT) {
    const img = imageCache.prop_meteor;
    const ready = img && img.complete && img.naturalWidth > 0;
    const r = diameter * 0.5;

    ctx.save();
    ctx.translate(x, y);

    if (shattered) {
      // Split the actual colossal meteor sprite cleanly into two flying molten halves!
      const sep = shatterT * 310;
      const rot = shatterT * 1.75;
      [-1, 1].forEach((dir) => {
        ctx.save();
        ctx.translate(dir * sep, -shatterT * 125 + shatterT * shatterT * 240);
        ctx.rotate(dir * rot);
        ctx.beginPath();
        if (dir < 0) ctx.rect(-r * 1.2, -r * 1.2, r * 1.2, r * 2.4);
        else ctx.rect(0, -r * 1.2, r * 1.2, r * 2.4);
        ctx.clip();
        if (ready) {
          ctx.drawImage(img, -r, -r, diameter, diameter);
        }
        // Blazing molten split seam
        ctx.strokeStyle = "#ffee44";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.85);
        ctx.lineTo(0, r * 0.85);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
      return;
    }

    // Fiery atmospheric re-entry shock cone behind colossal meteor
    const pulse = 1 + Math.sin(performance.now() * 0.025) * 0.07;
    const halo = ctx.createRadialGradient(0, r * 0.12, r * 0.45, 0, -r * 0.1, r * 1.5 * pulse);
    halo.addColorStop(0, `rgba(255, 240, 120, ${0.55 + crackLevel * 0.35})`);
    halo.addColorStop(0.5, `rgba(255, 85, 15, ${0.42 + crackLevel * 0.3})`);
    halo.addColorStop(1, "rgba(255, 20, 0, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.45 * pulse, r * 1.38 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle threatening rumble rotation
    const wobble = Math.sin(performance.now() * 0.015) * 0.035;
    ctx.rotate(wobble);

    if (ready) {
      if (crackLevel > 0.65) {
        ctx.shadowColor = "#ffaa22";
        ctx.shadowBlur = 24;
      }
      ctx.drawImage(img, -r, -r, diameter, diameter);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // =========================================================
  // COLOSSAL HERO PROP 2: NEO-SHINKANSEN HYPER-TRAIN (70% SCREEN SCALE)
  // =========================================================
  function drawHyperTrain(ctx, frontX, groundY, speedRatio) {
    const img = imageCache.prop_train;
    const ready = img && img.complete && img.naturalWidth > 0;
    const drawW = 740;
    const drawH = ready ? drawW * (img.naturalHeight / img.naturalWidth) : 318;
    const topY = groundY - drawH + 14;

    ctx.save();

    // Volumetric Twin Headlight Cone slicing through the cyber-night!
    const beamGrad = ctx.createLinearGradient(frontX + 95, groundY - 125, frontX - 420, groundY - 40);
    beamGrad.addColorStop(0, "rgba(255, 250, 190, 0.65)");
    beamGrad.addColorStop(0.45, "rgba(56, 243, 255, 0.24)");
    beamGrad.addColorStop(1, "rgba(56, 243, 255, 0)");
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(frontX + 95, groundY - 142);
    ctx.lineTo(frontX + 95, groundY - 108);
    ctx.lineTo(frontX - 420, groundY + 25);
    ctx.lineTo(frontX - 420, groundY - 220);
    ctx.closePath();
    ctx.fill();

    // Aerodynamic Mach wind-shear ribbons over massive nose
    if (speedRatio > 0.08) {
      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = i % 2 === 0
          ? `rgba(56, 243, 255, ${0.65 * speedRatio})`
          : `rgba(255, 255, 255, ${0.52 * speedRatio})`;
        ctx.lineWidth = i === 0 ? 4.5 : 2.5;
        ctx.beginPath();
        ctx.moveTo(frontX - 24, topY + 55 + i * 42);
        ctx.quadraticCurveTo(frontX + 90, topY + 20 + i * 42, frontX + 270 + i * 50, topY + 30 + i * 42);
        ctx.stroke();
      }
    }

    if (ready) {
      // Draw the colossal armored bullet train + seamless rear body extension
      ctx.drawImage(img, frontX, topY, drawW, drawH);
      // Extend rear car seamlessly to right edge of viewport
      if (frontX + drawW < 1050) {
        ctx.drawImage(img, img.naturalWidth * 0.72, 0, img.naturalWidth * 0.28, img.naturalHeight, frontX + drawW - 6, topY, 320, drawH);
      }
    }

    ctx.restore();
  }

  // =========================================================
  // HERO PROP 3: CYBER ROCKET DRAG-RACER (MACH SPRINT CPU RIVAL)
  // =========================================================
  function drawCyberRacer(ctx, x, y, speedRatio) {
    const img = imageCache.prop_racer;
    const ready = img && img.complete && img.naturalWidth > 0;
    const drawW = 285;
    const drawH = ready ? drawW * (img.naturalHeight / img.naturalWidth) : 68;

    ctx.save();
    ctx.translate(x, y);

    // Ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.ellipse(0, 2, drawW * 0.45, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Roaring jet turbine afterburner flame behind car!
    if (speedRatio > 0.05) {
      const flicker = 0.85 + Math.sin(performance.now() * 0.06) * 0.22;
      const flameLen = (95 + speedRatio * 125) * flicker;
      const fg = ctx.createLinearGradient(-drawW * 0.48, -drawH * 0.48, -drawW * 0.48 - flameLen, -drawH * 0.48);
      fg.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      fg.addColorStop(0.3, "rgba(56, 243, 255, 0.85)");
      fg.addColorStop(0.7, "rgba(255, 30, 120, 0.55)");
      fg.addColorStop(1, "rgba(255, 30, 120, 0)");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-drawW * 0.46, -drawH * 0.66);
      ctx.lineTo(-drawW * 0.46 - flameLen, -drawH * 0.46);
      ctx.lineTo(-drawW * 0.46, -drawH * 0.26);
      ctx.closePath();
      ctx.fill();
    }

    if (ready) {
      ctx.drawImage(img, -drawW * 0.5, -drawH + 6, drawW, drawH);
    }

    ctx.restore();
  }


  // =========================================================
  // ROZ (ROTATION & ZOOM) 2.5D PERSPECTIVE FLOOR GRID & 3-LAYER AUDIENCE
  // Inspired by Namco NB-2 mb1_rot0/1 (ROZ) & AUDIENCE_1/2/3 architecture
  // =========================================================
  function drawROZPerspectiveFloor(ctx, W, H, topY, scrollX, colorA, colorB, lineCol) {
    const h = H - topY;
    const grad = ctx.createLinearGradient(0, topY, 0, H);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);
    ctx.fillStyle = grad;
    ctx.fillRect(0, topY, W, h);

    // Perspective converging speed-stripes (pseudo-3D ROZ floor projection)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, topY, W, h);
    ctx.clip();
    const vanishX = W * 0.5;
    const vanishY = topY - 120;
    const stride = 76;
    const off = ((-scrollX * 1.15) % stride + stride) % stride;
    ctx.strokeStyle = lineCol || "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    for (let x = -W + off; x < W * 2; x += stride) {
      const t = (x - vanishX) / (W * 0.5);
      const bx = vanishX + t * W * 1.35;
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(bx, H);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw3LayerAudience(ctx, W, baseY, scrollX) {
    const t = performance.now() * 0.006;
    const colors = ["#ff3366", "#ffee33", "#38f3ff", "#55ff88", "#ffffff", "#ff8833"];
    // AUDIENCE_1 (far), AUDIENCE_2 (mid), AUDIENCE_3 (near) parallax depth layers
    const layers = [
      { speed: 0.25, step: 14, size: 5, y: baseY - 22, alpha: 0.45 },
      { speed: 0.42, step: 18, size: 7, y: baseY - 11, alpha: 0.68 },
      { speed: 0.65, step: 24, size: 9, y: baseY + 1, alpha: 0.9 },
    ];
    ctx.save();
    layers.forEach((L, li) => {
      const off = ((-scrollX * L.speed) % (L.step * 4) + L.step * 4) % (L.step * 4);
      ctx.globalAlpha = L.alpha;
      for (let x = off - L.step * 4; x < W + L.step * 4; x += L.step) {
        const idx = Math.abs(Math.floor((x + li * 31) / L.step)) % colors.length;
        const hop = Math.sin(t + idx * 1.3 + li) > 0.25 ? -3 : 0;
        ctx.fillStyle = colors[idx];
        ctx.fillRect(x, L.y + hop, L.size, L.size);
      }
    });
    ctx.restore();
  }


  function drawIceBlock(ctx, x, y, heightPx, highlight) {
    const img = imageCache.prop_iceblock;
    const ready = img && img.complete && img.naturalWidth > 0;
    const drawH = heightPx || 168;
    const drawW = ready ? drawH * (img.naturalWidth / img.naturalHeight) : drawH * 0.62;
    ctx.save();
    ctx.translate(x, y);
    // Floor frost shadow
    ctx.fillStyle = "rgba(0, 30, 60, 0.55)";
    ctx.beginPath();
    ctx.ellipse(0, 2, drawW * 0.48, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    if (highlight) {
      ctx.shadowColor = "#38f3ff";
      ctx.shadowBlur = 22;
    }
    if (ready) {
      ctx.drawImage(img, -drawW * 0.5, -drawH + 4, drawW, drawH);
    } else {
      ctx.fillStyle = "#44eeff";
      ctx.fillRect(-drawW * 0.4, -drawH, drawW * 0.8, drawH);
    }
    ctx.restore();
  }

  window.MB.Sprites = {
    CHARACTERS,
    getPortrait,
    getAsset,
    drawCharacter,
    drawStageBg,
    drawStadiumBg: drawStageBg,
    drawMeteor,
    drawHyperTrain,
    drawCyberRacer,
    drawROZPerspectiveFloor,
    draw3LayerAudience,
    drawIceBlock,
  };
})();

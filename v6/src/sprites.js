// MASH BREAKERS V6: OVERDRIVE MISSION — Original IP Cel-Shaded Sprites, Props & Neo-City Stages
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
  loadImg("rex_run_sheet", "assets/rex_run_sheet.webp");
  loadImg("rex_smash", "assets/rex_smash.webp");
  loadImg("stage_overpass", "assets/stage_overpass.jpg");
  loadImg("stage_corridor", "assets/stage_corridor.jpg");
  loadImg("stage_rooftop", "assets/stage_rooftop.jpg");
  loadImg("stage_tunnel", "assets/stage_tunnel.jpg");
  loadImg("prop_hoverbike", "assets/prop_hoverbike.webp");
  loadImg("prop_barrier", "assets/prop_barrier.webp");
  loadImg("prop_satellite", "assets/prop_satellite.webp");
  loadImg("prop_drill", "assets/prop_drill.webp");

  function getPortrait(id) {
    return imageCache[id] || null;
  }

  function getAsset(key) {
    return imageCache[key] || null;
  }

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

    let rot = 0, bobY = 0, dynSX = sx, dynSY = sy;
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
    } else if (pose === "punch" || pose === "smash") {
      rot = pose === "punch" ? -0.34 : 0.05;
      dynSX *= pose === "punch" ? 0.92 : 1.08;
      dynSY *= pose === "punch" ? 1.14 : 0.96;
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

      if ((pose === "punch" || pose === "smash") && !ghostTint) {
        const fg = ctx.createRadialGradient(drawW * 0.28, -drawH * 0.6, 4, drawW * 0.28, -drawH * 0.6, 56 * scale);
        fg.addColorStop(0, "rgba(255,255,255,0.95)");
        fg.addColorStop(0.45, char.aura + "aa");
        fg.addColorStop(1, char.aura + "00");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(drawW * 0.28, -drawH * 0.6, 56 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // =========================================================
  // 4 DEDICATED NEO-CITY MISSION STAGES
  // =========================================================
  function drawStageBg(ctx, W, H, scrollX, stageKey) {
    const t = performance.now() * 0.001;

    if (stageKey === "overpass") {
      const img = imageCache.stage_overpass;
      if (img && img.complete && img.naturalWidth > 0) {
        const shift = ((-scrollX * 0.25) % W + W) % W;
        ctx.drawImage(img, shift - W, 0, W, H);
        ctx.drawImage(img, shift, 0, W, H);
      } else {
        ctx.fillStyle = "#0a1026";
        ctx.fillRect(0, 0, W, H);
      }
      // Animated diagonal cyberpunk rain streaks!
      ctx.save();
      ctx.strokeStyle = "rgba(140, 220, 255, 0.24)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 36; i++) {
        const rx = ((i * 39 - t * 320 - scrollX * 0.4) % (W + 80) + (W + 80)) % (W + 80) - 40;
        const ry = ((i * 73 + t * 760) % (H + 60)) - 30;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 14, ry + 32);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (stageKey === "corridor") {
      const img = imageCache.stage_corridor;
      if (img && img.complete && img.naturalWidth > 0) {
        const shift = ((-scrollX * 0.28) % W + W) % W;
        ctx.drawImage(img, shift - W, 0, W, H);
        ctx.drawImage(img, shift, 0, W, H);
      } else {
        ctx.fillStyle = "#0a1829";
        ctx.fillRect(0, 0, W, H);
      }
      return;
    }

    if (stageKey === "rooftop") {
      const img = imageCache.stage_rooftop;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, W, H);
      } else {
        ctx.fillStyle = "#2b1224";
        ctx.fillRect(0, 0, W, H);
      }
      // Subtle sunset atmosphere embers
      ctx.save();
      for (let i = 0; i < 16; i++) {
        const ex = ((i * 71 + t * 34) % (W + 40)) - 20;
        const ey = H - ((i * 49 + t * 52) % (H * 0.8));
        ctx.fillStyle = "rgba(255, 220, 120, 0.55)";
        ctx.fillRect(ex, ey, 3, 3);
      }
      ctx.restore();
      return;
    }

    if (stageKey === "tunnel") {
      const img = imageCache.stage_tunnel;
      if (img && img.complete && img.naturalWidth > 0) {
        const shift = ((scrollX * 0.3) % W + W) % W;
        ctx.drawImage(img, shift - W, 0, W, H);
        ctx.drawImage(img, shift, 0, W, H);
      } else {
        ctx.fillStyle = "#0c1220";
        ctx.fillRect(0, 0, W, H);
      }
      // Pulsing emergency red alert wash in tunnel
      const pulse = 0.06 + Math.sin(t * 7) * 0.05;
      ctx.fillStyle = `rgba(255, 30, 60, ${pulse})`;
      ctx.fillRect(0, 0, W, H);
      return;
    }
  }

  function drawROZPerspectiveFloor(ctx, W, H, topY, scrollX, colorA, colorB, lineCol) {
    const h = H - topY;
    const grad = ctx.createLinearGradient(0, topY, 0, H);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);
    ctx.fillStyle = grad;
    ctx.fillRect(0, topY, W, h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, topY, W, h);
    ctx.clip();
    const vanishX = W * 0.5;
    const stride = 76;
    const off = ((-scrollX * 1.15) % stride + stride) % stride;
    ctx.strokeStyle = lineCol || "rgba(56,243,255,0.2)";
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

  // =========================================================
  // 4 ORIGINAL IP COLOSSAL PROPS
  // =========================================================
  function drawHoverbike(ctx, x, y, speedRatio) {
    const img = imageCache.prop_hoverbike;
    const ready = img && img.complete && img.naturalWidth > 0;
    const drawW = 240;
    const drawH = ready ? drawW * (img.naturalHeight / img.naturalWidth) : 94;
    const hoverY = Math.sin(performance.now() * 0.012) * 5;

    ctx.save();
    ctx.translate(x, y + hoverY);

    // Neon anti-gravity ground reflection glow
    const g = ctx.createRadialGradient(0, 8 - hoverY, 4, 0, 8 - hoverY, 105);
    g.addColorStop(0, "rgba(255, 30, 180, 0.55)");
    g.addColorStop(0.6, "rgba(56, 243, 255, 0.25)");
    g.addColorStop(1, "rgba(56, 243, 255, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 8 - hoverY, 105, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rear plasma jet tail
    if (speedRatio > 0.05) {
      const fl = (70 + speedRatio * 115) * (0.85 + Math.sin(performance.now() * 0.07) * 0.2);
      const fg = ctx.createLinearGradient(-drawW * 0.42, -drawH * 0.42, -drawW * 0.42 - fl, -drawH * 0.42);
      fg.addColorStop(0, "rgba(255,255,255,0.95)");
      fg.addColorStop(0.35, "rgba(255,40,200,0.85)");
      fg.addColorStop(1, "rgba(56,243,255,0)");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-drawW * 0.4, -drawH * 0.56);
      ctx.lineTo(-drawW * 0.4 - fl, -drawH * 0.42);
      ctx.lineTo(-drawW * 0.4, -drawH * 0.28);
      ctx.closePath();
      ctx.fill();
    }

    if (ready) {
      ctx.drawImage(img, -drawW * 0.5, -drawH - 2, drawW, drawH);
    }
    ctx.restore();
  }

  function drawEnergyBarrier(ctx, x, y, heightPx, isGold, highlight) {
    const img = imageCache.prop_barrier;
    const ready = img && img.complete && img.naturalWidth > 0;
    const drawH = heightPx || 168;
    const drawW = ready ? drawH * (img.naturalWidth / img.naturalHeight) : drawH * 0.45;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = isGold ? "rgba(255, 200, 30, 0.45)" : "rgba(56, 243, 255, 0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 2, drawW * 0.65, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isGold) {
      ctx.shadowColor = "#ffee33";
      ctx.shadowBlur = 24;
      ctx.filter = "hue-rotate(-142deg) saturate(2.5) brightness(1.22)";
    } else if (highlight) {
      ctx.shadowColor = "#38f3ff";
      ctx.shadowBlur = 20;
    }

    if (ready) {
      ctx.drawImage(img, -drawW * 0.5, -drawH + 4, drawW, drawH);
    }
    ctx.filter = "none";
    ctx.shadowBlur = 0;

    if (isGold) {
      ctx.fillStyle = "#ffee33";
      ctx.font = "italic 900 12px 'Arial Black', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★ GOLD ★", 0, -drawH - 6);
    }
    ctx.restore();
  }

  function drawOrbitalSatellite(ctx, x, y, diameter, heatLevel, launched, launchT) {
    const img = imageCache.prop_satellite;
    const ready = img && img.complete && img.naturalWidth > 0;
    const r = diameter * 0.5;

    ctx.save();
    if (launched) {
      // ORBITAL HOME RUN! Rockets straight UP back out of the atmosphere!
      const liftY = y - launchT * launchT * 980 - launchT * 320;
      const shrink = Math.max(0.18, 1 - launchT * 0.52);
      ctx.translate(x, liftY);
      ctx.scale(shrink, shrink);
      ctx.rotate(launchT * 5.2);

      // Massive upward rocket-launch plasma plume below satellite!
      const plume = ctx.createLinearGradient(0, r * 0.4, 0, r * 2.6);
      plume.addColorStop(0, "rgba(255,255,255,0.95)");
      plume.addColorStop(0.35, "rgba(56,243,255,0.8)");
      plume.addColorStop(1, "rgba(255,100,20,0)");
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, r * 0.3);
      ctx.lineTo(r * 0.5, r * 0.3);
      ctx.lineTo(0, r * 2.7);
      ctx.closePath();
      ctx.fill();

      if (ready) ctx.drawImage(img, -r, -r * 0.88, diameter, diameter * 0.88);
      ctx.restore();
      return;
    }

    ctx.translate(x, y);
    // Atmospheric re-entry red-hot plasma glow behind satellite
    const pulse = 1 + Math.sin(performance.now() * 0.025) * 0.08;
    const halo = ctx.createRadialGradient(0, r * 0.1, r * 0.4, 0, -r * 0.1, r * 1.5 * pulse);
    halo.addColorStop(0, `rgba(255, 220, 100, ${0.45 + heatLevel * 0.4})`);
    halo.addColorStop(0.5, `rgba(255, 60, 20, ${0.4 + heatLevel * 0.35})`);
    halo.addColorStop(1, "rgba(255, 20, 0, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.45 * pulse, r * 1.35 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(Math.sin(performance.now() * 0.016) * 0.04);
    if (ready) {
      if (heatLevel > 0.7) {
        ctx.shadowColor = "#ff4422";
        ctx.shadowBlur = 24;
      }
      ctx.drawImage(img, -r, -r * 0.88, diameter, diameter * 0.88);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawSiegeDrill(ctx, frontX, groundY, speedRatio, coreFlash) {
    const img = imageCache.prop_drill;
    const ready = img && img.complete && img.naturalWidth > 0;
    const drawW = 680;
    const drawH = ready ? drawW * (img.naturalHeight / img.naturalWidth) : 322;
    const jitterY = speedRatio > 0.08 ? Math.sin(performance.now() * 0.09) * 3.5 * speedRatio : 0;
    const topY = groundY - drawH + 16 + jitterY;

    ctx.save();
    // Swirling plasma friction aura around spinning spiral drill nose
    if (speedRatio > 0.08) {
      const dg = ctx.createRadialGradient(frontX + 95, groundY - 125, 12, frontX + 95, groundY - 125, 160);
      dg.addColorStop(0, `rgba(255, 170, 40, ${0.55 * speedRatio})`);
      dg.addColorStop(1, "rgba(255, 60, 0, 0)");
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(frontX + 95, groundY - 125, 160, 0, Math.PI * 2);
      ctx.fill();
    }

    if (ready) {
      ctx.drawImage(img, frontX, topY, drawW, drawH);
    }

    // CORE OVERHEAT COUNTER FLASH RING right over the cyan reactor core!
    if (coreFlash) {
      const cx = frontX + drawW * 0.56;
      const cy = topY + drawH * 0.48;
      const p = 1 + Math.sin(performance.now() * 0.03) * 0.18;
      ctx.strokeStyle = "#ffee33";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#38f3ff";
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(cx, cy, 48 * p, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffee33";
      ctx.font = "italic 900 18px 'Arial Black', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚡ [SPACE] COUNTER!", cx, cy - 58);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  window.MB.Sprites = {
    CHARACTERS,
    getPortrait,
    getAsset,
    drawCharacter,
    drawStageBg,
    drawROZPerspectiveFloor,
    drawHoverbike,
    drawEnergyBarrier,
    drawOrbitalSatellite,
    drawSiegeDrill,
  };
})();

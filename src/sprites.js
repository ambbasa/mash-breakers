// Modern Neo-Arcade Cel-Shaded 2D Character, Stadium & Hero Prop Renderer
// Street Fighter 6 × Hi-Fi Rush × Studio Trigger stylized crisp vector + cel-shading
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
      skin: "#f0b488",
      skinDark: "#c78358",
      hair: "#241d26",
      aura: "#ffe033",
      accent: "#ffaa00",
      portraitPath: "assets/rex.jpg",
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
      skin: "#f8caa8",
      skinDark: "#d49874",
      hair: "#151d36",
      aura: "#38f3ff",
      accent: "#00d4ff",
      portraitPath: "assets/hana.jpg",
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
      skin: "#e5a375",
      skinDark: "#b57249",
      hair: "#f2c63d",
      aura: "#4dff88",
      accent: "#00e676",
      portraitPath: "assets/bruno.jpg",
      speedStat: 7,
      mashStat: 8,
      powerStat: 10,
      speedMult: 0.96,
      mashMult: 1.0,
      powerMult: 1.15,
    },
  ];

  // Image asset cache (supports external paths AND inlined data URIs for standalone Canvas builds)
  const imageCache = {};
  function loadImg(key, path) {
    const img = new Image();
    const inlineMap = window.MB_INLINE_ASSETS || {};
    img.src = inlineMap[key] || path;
    imageCache[key] = img;
    return img;
  }

  CHARACTERS.forEach((c) => loadImg(c.id, c.portraitPath));
  loadImg("stadium", "assets/stadium.jpg");

  function getPortrait(id) {
    return imageCache[id] || null;
  }

  function getAsset(key) {
    return imageCache[key] || null;
  }

  // Cel-shaded capsule limb helper with thick anime ink outline
  function drawLimb(ctx, x1, y1, x2, y2, r1, r2, fill, shadow, outline) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(ang);

    ctx.beginPath();
    ctx.moveTo(0, -r1);
    ctx.lineTo(len, -r2);
    ctx.arc(len, 0, r2, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.lineTo(0, r1);
    ctx.arc(0, 0, r1, Math.PI * 0.5, -Math.PI * 0.5);
    ctx.closePath();

    ctx.fillStyle = fill;
    ctx.fill();

    // Cel shadow bottom strip
    if (shadow) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = shadow;
      ctx.fillRect(-r1, 0, len + r1 + r2, Math.max(r1, r2) + 2);
      ctx.restore();
    }

    ctx.lineWidth = 2.6;
    ctx.strokeStyle = outline || "#0b0d1a";
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================
  // CEL-SHADED MULTI-JOINTED SUPERHUMAN CHARACTER RENDERER
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

    const isBruno = char.id === "bruno";
    const isHana = char.id === "hana";
    const isRex = char.id === "rex";

    const bulk = isBruno ? 1.24 : isHana ? 0.88 : 1.0;
    const outline = ghostTint || "#090b18";

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * sx, scale * sy);

    // Ground contact shadow (elliptical soft gradient)
    if (!ghostTint) {
      const shGrad = ctx.createRadialGradient(0, 4, 2, 0, 4, 34 * bulk);
      shGrad.addColorStop(0, "rgba(0,0,0,0.58)");
      shGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shGrad;
      ctx.beginPath();
      ctx.ellipse(0, 4, 34 * bulk, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // MEGA MASH!! Stylized Multi-Layer Energy Aura
    if (mega && !ghostTint) {
      const t = performance.now() * 0.015;
      const pulse = 1 + Math.sin(t * 1.4) * 0.1;
      ctx.save();
      const auraGrad = ctx.createRadialGradient(0, -48, 8, 0, -48, 66 * pulse);
      auraGrad.addColorStop(0, "rgba(255,255,255,0.65)");
      auraGrad.addColorStop(0.45, char.aura + "88");
      auraGrad.addColorStop(1, char.aura + "00");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.ellipse(0, -48, 52 * pulse * bulk, 70 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rising anime flame-spikes
      ctx.strokeStyle = char.aura;
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + t * 0.35;
        const rx = Math.cos(ang) * 32 * bulk;
        const ry = -46 + Math.sin(ang) * 44;
        const spike = 12 + ((i * 7 + Math.floor(t * 4)) % 14);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx * 1.25, ry - spike);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Dynamic body posture angles
    const lean =
      pose === "run" ? 0.32 :
      pose === "brace" ? -0.34 :
      pose === "punch" ? 0.16 :
      pose === "charge" ? 0.08 : 0;

    const bob =
      pose === "run" ? Math.abs(Math.sin(phase * 13)) * -9 :
      pose === "charge" ? Math.sin(phase * 34) * 3.5 :
      pose === "win" ? Math.abs(Math.sin(phase * 7.5)) * -12 :
      pose === "brace" ? Math.sin(phase * 28) * 2 :
      Math.sin(phase * 3.5) * 2;

    const runCycle = phase * 13;
    const legA = pose === "run" ? Math.sin(runCycle) : 0;
    const legB = pose === "run" ? Math.sin(runCycle + Math.PI) : 0;

    ctx.translate(0, bob);
    ctx.rotate(lean);

    const suitCol = ghostTint || char.suit;
    const suitDark = ghostTint || char.suitDark;
    const skinCol = ghostTint || char.skin;
    const skinDark = ghostTint || char.skinDark;
    const trimCol = ghostTint || char.trim;
    const hairCol = ghostTint || char.hair;

    // 1. FLOWING BACK ACCESSORIES (Scarf for Rex, Long Ponytail for Hana)
    if (isRex) {
      const wave1 = Math.sin(phase * 18) * 7;
      const wave2 = Math.cos(phase * 18 - 1.2) * 11;
      ctx.save();
      ctx.fillStyle = trimCol;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-6, -64);
      ctx.quadraticCurveTo(-30, -68 + wave1, -56, -56 + wave2);
      ctx.lineTo(-48, -44 + wave2);
      ctx.quadraticCurveTo(-24, -56 + wave1, -4, -54);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (isHana) {
      const wave1 = Math.sin(phase * 19) * 8;
      const wave2 = Math.cos(phase * 19 - 1.0) * 12;
      ctx.save();
      // Ponytail hair sweep
      ctx.fillStyle = hairCol;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-8, -86);
      ctx.quadraticCurveTo(-34, -96 + wave1, -54, -70 + wave2);
      ctx.quadraticCurveTo(-30, -72 + wave1 * 0.6, -12, -74);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Glowing cyan energy ribbon tails
      ctx.strokeStyle = ghostTint || char.aura;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-10, -86);
      ctx.quadraticCurveTo(-30, -76 + wave1, -52, -84 + wave2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. BACK LEG (Thigh -> Shin -> Boot)
    const hipY = -30;
    let bKneeX = -6, bKneeY = -14, bFootX = -8, bFootY = 2;
    if (pose === "run") {
      bKneeX = legB * 18;
      bKneeY = hipY + 14 - Math.max(0, legB) * 8;
      bFootX = bKneeX - 10 + legB * 12;
      bFootY = bKneeY + 16 - Math.max(0, -legB) * 8;
    } else if (pose === "brace") {
      bKneeX = -20; bKneeY = -12; bFootX = -30; bFootY = 2;
    } else if (pose === "charge") {
      bKneeX = -15; bKneeY = -14; bFootX = -20; bFootY = 2;
    } else if (pose === "punch") {
      bKneeX = -14; bKneeY = -12; bFootX = -20; bFootY = 4;
    }
    drawLimb(ctx, -4, hipY, bKneeX, bKneeY, 7 * bulk, 5.5 * bulk, suitDark, "#0c0f22", outline);
    drawLimb(ctx, bKneeX, bKneeY, bFootX, bFootY, 5.5 * bulk, 5 * bulk, suitDark, "#0c0f22", outline);
    // Back boot
    ctx.fillStyle = trimCol;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(bFootX - 6, bFootY - 5, 19 * bulk, 9, 4);
    ctx.fill();
    ctx.stroke();

    // 3. BACK ARM
    const shY = -58;
    if (pose === "run") {
      const baX = -legA * 18;
      const baY = shY + 14;
      drawLimb(ctx, -4, shY, baX, baY, 5.5 * bulk, 4.5 * bulk, skinDark, null, outline);
      drawLimb(ctx, baX, baY, baX + 12, baY + 4, 4.5 * bulk, 4.5 * bulk, trimCol, null, outline);
    } else if (pose === "brace") {
      drawLimb(ctx, 4, shY + 4, 24, shY + 4, 6 * bulk, 5.5 * bulk, skinDark, null, outline);
      drawLimb(ctx, 24, shY + 4, 40, shY + 2, 6 * bulk, 6.5 * bulk, trimCol, null, outline);
    }

    // 4. FRONT LEG
    let fKneeX = 7, fKneeY = -14, fFootX = 9, fFootY = 2;
    if (pose === "run") {
      fKneeX = legA * 20;
      fKneeY = hipY + 14 - Math.max(0, legA) * 9;
      fFootX = fKneeX - 9 + legA * 13;
      fFootY = fKneeY + 16 - Math.max(0, -legA) * 9;
    } else if (pose === "brace") {
      fKneeX = 14; fKneeY = -13; fFootX = 22; fFootY = 2;
    } else if (pose === "charge") {
      fKneeX = 16; fKneeY = -14; fFootX = 20; fFootY = 2;
    } else if (pose === "punch") {
      fKneeX = 14; fKneeY = -16; fFootX = 12; fFootY = 2;
    }
    drawLimb(ctx, 4, hipY, fKneeX, fKneeY, 7.5 * bulk, 6 * bulk, suitCol, suitDark, outline);
    drawLimb(ctx, fKneeX, fKneeY, fFootX, fFootY, 6 * bulk, 5.2 * bulk, suitCol, suitDark, outline);
    // Front athletic boot with sole highlight
    ctx.fillStyle = trimCol;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.roundRect(fFootX - 6, fFootY - 5, 21 * bulk, 10, 4);
    ctx.fill();
    ctx.stroke();

    // 5. TORSO (Tapered athletic V-silhouette with cel shading & armor trim)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-16 * bulk, -64);
    ctx.lineTo(17 * bulk, -64);
    ctx.lineTo(11 * bulk, -27);
    ctx.lineTo(-11 * bulk, -27);
    ctx.closePath();
    ctx.fillStyle = suitCol;
    ctx.fill();

    // Cel shadow on back half of torso
    ctx.save();
    ctx.clip();
    ctx.fillStyle = suitDark;
    ctx.fillRect(-20 * bulk, -66, 16 * bulk, 44);
    // Chest accent stripe / armor plate
    ctx.fillStyle = trimCol;
    if (isBruno) {
      ctx.fillRect(-16 * bulk, -62, 32 * bulk, 8);
      ctx.fillRect(-6, -54, 12, 16);
    } else if (isHana) {
      ctx.beginPath();
      ctx.moveTo(-12, -62);
      ctx.lineTo(14, -62);
      ctx.lineTo(4, -36);
      ctx.lineTo(-4, -36);
      ctx.closePath();
      ctx.fill();
    } else {
      // Rex lightning chevron
      ctx.beginPath();
      ctx.moveTo(-14, -55);
      ctx.lineTo(15, -59);
      ctx.lineTo(15, -51);
      ctx.lineTo(-14, -47);
      ctx.closePath();
      ctx.fill();
    }
    // Rim highlight on front edge
    if (!ghostTint) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(11 * bulk, -64, 5, 36);
    }
    ctx.restore();

    ctx.lineWidth = 2.8;
    ctx.strokeStyle = outline;
    ctx.stroke();

    // Belt
    ctx.fillStyle = "#121528";
    ctx.fillRect(-11 * bulk, -33, 22 * bulk, 7);
    ctx.fillStyle = trimCol;
    ctx.fillRect(-4, -33, 9, 7);
    ctx.strokeRect(-11 * bulk, -33, 22 * bulk, 7);
    ctx.restore();

    // 6. HEAD (Distinct hair, visor/eyes, jawline per character)
    const headX = 2;
    const headY = -78;
    ctx.save();
    ctx.translate(headX, headY);

    // Neck
    ctx.fillStyle = skinDark;
    ctx.fillRect(-4, 6, 8, 9);

    // Head shape
    ctx.fillStyle = skinCol;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.roundRect(-11, -12, 23, 23, 8);
    ctx.fill();
    ctx.stroke();

    // Character-specific hair & facial gear
    if (isRex) {
      // Spiky swept-back dark hair
      ctx.fillStyle = hairCol;
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(-18, -16);
      ctx.lineTo(-6, -15);
      ctx.lineTo(-2, -23);
      ctx.lineTo(6, -15);
      ctx.lineTo(15, -18);
      ctx.lineTo(13, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Glowing yellow cyber visor
      ctx.fillStyle = ghostTint || "#ffee33";
      ctx.beginPath();
      ctx.roundRect(-2, -6, 16, 8, 3);
      ctx.fill();
      ctx.stroke();
      if (!ghostTint) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(2, -4, 9, 2.5);
      }
    } else if (isHana) {
      // Sleek anime bangs + headband ribbon knot
      ctx.fillStyle = hairCol;
      ctx.beginPath();
      ctx.moveTo(-12, -2);
      ctx.quadraticCurveTo(-13, -18, 2, -17);
      ctx.quadraticCurveTo(15, -16, 13, -3);
      ctx.lineTo(7, -8);
      ctx.lineTo(3, -2);
      ctx.lineTo(-2, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Glowing cyan eyes
      ctx.fillStyle = "#111";
      ctx.fillRect(2, -2, 4, 4);
      ctx.fillRect(8, -2, 3.5, 4);
      if (!ghostTint) {
        ctx.fillStyle = "#38f3ff";
        ctx.fillRect(3, -1, 2, 2);
        ctx.fillRect(9, -1, 2, 2);
      }
    } else if (isBruno) {
      // Blonde sculpted pompadour hair!
      ctx.fillStyle = hairCol;
      ctx.beginPath();
      ctx.moveTo(-11, -5);
      ctx.lineTo(-11, -15);
      ctx.quadraticCurveTo(0, -26, 18, -19);
      ctx.quadraticCurveTo(20, -10, 11, -7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Fierce brow & eyes
      ctx.fillStyle = "#111";
      ctx.fillRect(2, -2, 4, 3.5);
      ctx.fillRect(9, -2, 3.5, 3.5);
      ctx.strokeStyle = "#8a5a14";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(13, -3);
      ctx.stroke();
    }

    // Mouth expression
    if (pose === "charge" || pose === "brace" || pose === "punch" || mega) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.6;
      ctx.fillRect(2, 4, 8, 4);
      ctx.strokeRect(2, 4, 8, 4);
    } else if (pose === "win") {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(6, 5, 4, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.fillStyle = "#6e2c2c";
      ctx.fillRect(3, 6, 6, 2);
    }
    ctx.restore();

    // 7. FRONT ARM (Gauntlets / Cyber wraps / Uppercut)
    const gauntletR = isBruno ? 8.5 : 6;
    if (pose === "punch") {
      // Massive heroic sky-piercing uppercut!
      drawLimb(ctx, 8, shY, 15, shY - 22, 6.5 * bulk, 6 * bulk, skinCol, skinDark, outline);
      drawLimb(ctx, 15, shY - 22, 16, shY - 46, 6.5 * bulk, gauntletR, trimCol, suitDark, outline);
      if (!ghostTint) {
        ctx.fillStyle = char.aura;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(16, shY - 50, 14 * bulk, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    } else if (pose === "brace") {
      // Bracing both arms forward against train
      drawLimb(ctx, 6, shY + 2, 26, shY + 8, 6.5 * bulk, 6 * bulk, skinCol, skinDark, outline);
      drawLimb(ctx, 26, shY + 8, 42, shY + 6, 6.5 * bulk, gauntletR, trimCol, suitDark, outline);
    } else if (pose === "charge") {
      const jit = Math.sin(phase * 44) * 2.5;
      drawLimb(ctx, -12 * bulk, shY + 2, -22 * bulk + jit, shY + 18, 6 * bulk, gauntletR, trimCol, suitDark, outline);
      drawLimb(ctx, 12 * bulk, shY + 2, 22 * bulk - jit, shY + 18, 6 * bulk, gauntletR, trimCol, suitDark, outline);
    } else if (pose === "win") {
      drawLimb(ctx, -10 * bulk, shY, -22 * bulk, shY - 24, 6 * bulk, gauntletR, trimCol, suitDark, outline);
      drawLimb(ctx, 10 * bulk, shY, 22 * bulk, shY - 24, 6 * bulk, gauntletR, trimCol, suitDark, outline);
    } else if (pose === "run") {
      const faX = legA * 19;
      const faY = shY + 13;
      drawLimb(ctx, 2, shY, faX, faY, 6 * bulk, 5.2 * bulk, skinCol, skinDark, outline);
      drawLimb(ctx, faX, faY, faX + 13, faY - 4, 5.2 * bulk, gauntletR * 0.85, trimCol, suitDark, outline);
    } else {
      drawLimb(ctx, 8 * bulk, shY + 2, 12 * bulk, shY + 20, 6 * bulk, gauntletR * 0.85, trimCol, suitDark, outline);
    }

    ctx.restore();
  }

  // =========================================================
  // MULTI-LAYER MODERN NEO-ARCADE STADIUM BACKGROUNDS
  // =========================================================
  function drawStadiumBg(ctx, W, H, scrollX, theme) {
    const t = performance.now() * 0.001;

    // 1. Rich Atmospheric Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
    if (theme === "sunset") {
      sky.addColorStop(0, "#140b30");
      sky.addColorStop(0.38, "#6e1b52");
      sky.addColorStop(0.72, "#e04838");
      sky.addColorStop(1, "#ffbc42");
    } else if (theme === "night") {
      sky.addColorStop(0, "#050716");
      sky.addColorStop(0.5, "#0d163b");
      sky.addColorStop(0.85, "#1a2e66");
      sky.addColorStop(1, "#2a478c");
    } else {
      sky.addColorStop(0, "#082d86");
      sky.addColorStop(0.45, "#1676e6");
      sky.addColorStop(0.82, "#4cc3ff");
      sky.addColorStop(1, "#c4f3ff");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.66);

    // 2. Stylized Cel-Shaded Clouds or Night Stars / Volumetric Beams
    if (theme === "night") {
      // Sweeping volumetric stadium searchlights
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const bx = 140 + i * 230;
        const sway = Math.sin(t * (0.9 + i * 0.25) + i) * 110;
        const beamGrad = ctx.createLinearGradient(bx, 220, bx + sway, 0);
        beamGrad.addColorStop(0, i % 2 === 0 ? "rgba(56, 243, 255, 0.24)" : "rgba(255, 51, 119, 0.2)");
        beamGrad.addColorStop(1, "rgba(56, 243, 255, 0)");
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(bx - 12, 220);
        ctx.lineTo(bx + 12, 220);
        ctx.lineTo(bx + sway + 70, 0);
        ctx.lineTo(bx + sway - 70, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else {
      // Stylized anime clouds
      const cloudOff = -((scrollX * 0.06) % 360);
      ctx.save();
      ctx.fillStyle = theme === "sunset" ? "rgba(255, 200, 110, 0.45)" : "rgba(255, 255, 255, 0.72)";
      for (let x = cloudOff - 360; x < W + 360; x += 360) {
        ctx.beginPath();
        ctx.ellipse(x + 90, 96, 84, 24, -0.06, 0, Math.PI * 2);
        ctx.ellipse(x + 150, 86, 56, 22, 0.04, 0, Math.PI * 2);
        ctx.ellipse(x + 280, 128, 70, 18, -0.03, 0, Math.PI * 2);
        ctx.fill();
      }
      // Volumetric sunlight rays
      const rayColor = theme === "sunset" ? "rgba(255, 196, 80, 0.14)" : "rgba(255, 255, 255, 0.14)";
      ctx.fillStyle = rayColor;
      for (let i = 0; i < 3; i++) {
        const rx = 200 + i * 280;
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx + 85, 0);
        ctx.lineTo(rx - 95, 240);
        ctx.lineTo(rx - 155, 240);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Distant Neo-Tokyo Futuristic Skyline
    const cityOff = -((scrollX * 0.12) % 240);
    ctx.fillStyle = theme === "night" ? "#0b112c" : theme === "sunset" ? "#2e1238" : "rgba(18, 42, 102, 0.48)";
    for (let x = cityOff - 240; x < W + 240; x += 240) {
      ctx.fillRect(x + 10, 122, 46, 110);
      ctx.fillRect(x + 62, 86, 58, 146);
      ctx.fillRect(x + 128, 108, 44, 124);
      ctx.fillRect(x + 178, 72, 52, 160);
      if (theme === "night") {
        // Glowing cyberpunk skyscraper windows
        ctx.fillStyle = "rgba(68, 240, 255, 0.35)";
        for (let wy = 96; wy < 200; wy += 16) {
          ctx.fillRect(x + 70, wy, 42, 4);
          ctx.fillRect(x + 186, wy - 12, 36, 4);
        }
        ctx.fillStyle = "#0b112c";
      }
    }

    // 4. Futuristic Curved Megadome Roof Arches & Floodlight Towers
    const archOff = -((scrollX * 0.26) % 320);
    ctx.save();
    for (let x = archOff - 320; x < W + 320; x += 320) {
      ctx.strokeStyle = theme === "night" ? "#1e3268" : theme === "sunset" ? "#4a1c44" : "#1d3d82";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(x + 160, 245, 165, Math.PI, 0);
      ctx.stroke();

      ctx.strokeStyle = theme === "night" ? "#38f3ff" : "#ffe066";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + 160, 245, 158, Math.PI, 0);
      ctx.stroke();

      // Floodlight bank
      ctx.fillStyle = "#161c36";
      ctx.fillRect(x + 136, 74, 48, 20);
      ctx.fillStyle = theme === "sunset" ? "#ffdd88" : "#ffffff";
      for (let lx = 0; lx < 4; lx++) {
        ctx.fillRect(x + 141 + lx * 10, 79, 7, 10);
      }
    }
    ctx.restore();

    // 5. Multi-Tier Stadium Stands with Dynamic Lightstick Crowd
    const standY = 205;
    const standGrad = ctx.createLinearGradient(0, standY, 0, 326);
    standGrad.addColorStop(0, "#121630");
    standGrad.addColorStop(1, "#1e254c");
    ctx.fillStyle = standGrad;
    ctx.fillRect(0, standY, W, 122);

    const crowdOff = -((scrollX * 0.48) % 64);
    const wavePhase = Math.floor(t * 7);
    const lightColors = ["#ff3366", "#ffee33", "#38f3ff", "#55ff88", "#ffffff", "#ff8822"];
    for (let row = 0; row < 5; row++) {
      const ry = standY + 12 + row * 21;
      ctx.fillStyle = row % 2 === 0 ? "#252d5c" : "#1b2147";
      ctx.fillRect(0, ry + 9, W, 8);
      for (let x = crowdOff - 64; x < W + 64; x += 16) {
        const idx = Math.abs(Math.floor((x + row * 29) / 16)) % lightColors.length;
        const hop = ((idx + wavePhase + row) % 2) * -3;
        ctx.fillStyle = lightColors[idx];
        ctx.fillRect(x + (row % 2) * 7, ry + hop, 8, 8);
        // Subtle cheering glow stick
        if (idx % 2 === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fillRect(x + (row % 2) * 7 + 2, ry + hop - 4, 3, 4);
        }
      }
    }

    // 6. Sleek Glowing LED Ribbon Ad Boards along Track Wall
    const wallY = 320;
    ctx.fillStyle = "#090c1c";
    ctx.fillRect(0, wallY, W, 30);
    const boardOff = -((scrollX * 0.85) % 300);
    for (let x = boardOff - 300; x < W + 300; x += 300) {
      // Red/Orange neon panel
      const g1 = ctx.createLinearGradient(x + 6, wallY, x + 144, wallY);
      g1.addColorStop(0, "#ff2255");
      g1.addColorStop(1, "#ff8800");
      ctx.fillStyle = g1;
      ctx.fillRect(x + 6, wallY + 4, 140, 22);

      // Cyan/Blue neon panel
      const g2 = ctx.createLinearGradient(x + 154, wallY, x + 292, wallY);
      g2.addColorStop(0, "#0088ff");
      g2.addColorStop(1, "#00e5ff");
      ctx.fillStyle = g2;
      ctx.fillRect(x + 154, wallY + 4, 140, 22);

      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 900 12px 'Arial Black', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("MASH BREAKERS ⚡", x + 76, wallY + 19);
      ctx.fillText("SUPERHUMAN CUP", x + 224, wallY + 19);
    }
  }

  // =========================================================
  // HERO PROP 1: VOLCANIC RE-ENTRY METEOR (Event 2)
  // =========================================================
  function drawMeteor(ctx, x, y, radius, crackLevel, shattered, shatterT) {
    ctx.save();
    ctx.translate(x, y);

    if (shattered) {
      // Dramatic glowing split halves + molten core flash!
      const sep = shatterT * 290;
      const rot = shatterT * 1.9;
      [-1, 1].forEach((dir) => {
        ctx.save();
        ctx.translate(dir * sep, -shatterT * 110 + shatterT * shatterT * 210);
        ctx.rotate(dir * rot);

        ctx.fillStyle = "#3c2b2b";
        ctx.strokeStyle = "#0b080a";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.78, dir < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, dir < 0 ? Math.PI * 1.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing molten split edge
        ctx.strokeStyle = "#ffee44";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.74);
        ctx.lineTo(0, radius * 0.74);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
      return;
    }

    // Atmospheric re-entry fiery shock cone!
    const pulse = 1 + Math.sin(performance.now() * 0.025) * 0.08;
    const coneGrad = ctx.createRadialGradient(0, 12, radius * 0.55, 0, -20, radius * 1.8 * pulse);
    coneGrad.addColorStop(0, "rgba(255, 240, 120, 0.85)");
    coneGrad.addColorStop(0.45, "rgba(255, 95, 20, 0.55)");
    coneGrad.addColorStop(1, "rgba(255, 20, 0, 0)");
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.ellipse(0, -10, radius * 1.55 * pulse, radius * 1.65 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jagged cel-shaded basalt rock body
    const pts = 16;
    ctx.beginPath();
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = radius * (i % 2 === 0 ? 1.03 : 0.87 + (i % 3) * 0.03);
      const px0 = Math.cos(a) * r;
      const py0 = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px0, py0);
      else ctx.lineTo(px0, py0);
    }
    ctx.closePath();
    const rockGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    rockGrad.addColorStop(0, "#634c4c");
    rockGrad.addColorStop(0.55, "#3d2c2e");
    rockGrad.addColorStop(1, "#1e1318");
    ctx.fillStyle = rockGrad;
    ctx.fill();

    // Hot orange rim light along bottom edge (facing player/entry)
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = "#ff8822";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 6, radius * 0.94, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Sculpted craters
    const craters = [
      [-0.34, -0.22, 0.24],
      [0.3, 0.12, 0.2],
      [-0.08, 0.34, 0.16],
      [0.18, -0.4, 0.14],
    ];
    craters.forEach(([cx, cy, cr]) => {
      ctx.fillStyle = "#24181c";
      ctx.beginPath();
      ctx.arc(cx * radius, cy * radius, cr * radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7a5e5a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx * radius, cy * radius, cr * radius, Math.PI * 0.9, Math.PI * 1.8);
      ctx.stroke();
    });
    ctx.restore();

    // Thick ink outline
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = "#120a0d";
    ctx.stroke();

    // Pulsing magma cracks proportional to charge level
    if (crackLevel > 0.1) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = crackLevel > 0.72 ? "#ffffff" : "#ffee44";
      ctx.shadowColor = "#ff6600";
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3 + crackLevel * 4.5;
      ctx.beginPath();
      ctx.moveTo(0, radius * 0.88);
      ctx.lineTo(-radius * 0.22, radius * 0.2);
      ctx.lineTo(radius * 0.18, -radius * 0.22);
      ctx.lineTo(-radius * 0.12, -radius * 0.78);
      if (crackLevel > 0.45) {
        ctx.moveTo(-radius * 0.22, radius * 0.2);
        ctx.lineTo(-radius * 0.68, 0.02 * radius);
        ctx.moveTo(radius * 0.18, -radius * 0.22);
        ctx.lineTo(radius * 0.7, -0.12 * radius);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // =========================================================
  // HERO PROP 2: FUTURISTIC NEO-SHINKANSEN HYPER-TRAIN (Event 3)
  // =========================================================
  function drawHyperTrain(ctx, frontX, groundY, speedRatio) {
    ctx.save();
    const h = 118;
    const topY = groundY - h - 8;

    // Volumetric Twin Headlight Cone cutting through the night!
    ctx.save();
    const beamGrad = ctx.createLinearGradient(frontX + 18, groundY - 36, frontX - 380, groundY - 10);
    beamGrad.addColorStop(0, "rgba(255, 245, 160, 0.55)");
    beamGrad.addColorStop(0.5, "rgba(68, 240, 255, 0.18)");
    beamGrad.addColorStop(1, "rgba(68, 240, 255, 0)");
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(frontX + 18, groundY - 42);
    ctx.lineTo(frontX + 18, groundY - 26);
    ctx.lineTo(frontX - 360, groundY + 12);
    ctx.lineTo(frontX - 360, groundY - 115);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Aerodynamic Mach wind-shear ribbons over nose
    if (speedRatio > 0.08) {
      ctx.save();
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = i % 2 === 0
          ? `rgba(68, 245, 255, ${0.65 * speedRatio})`
          : `rgba(255, 255, 255, ${0.5 * speedRatio})`;
        ctx.lineWidth = i === 0 ? 4 : 2.5;
        ctx.beginPath();
        ctx.moveTo(frontX - 18, topY + 24 + i * 21);
        ctx.quadraticCurveTo(frontX + 55, topY + 8 + i * 20, frontX + 170 + i * 45, topY + 14 + i * 20);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Metallic Shinkansen hull with cel-shaded gradient
    const hullGrad = ctx.createLinearGradient(0, topY, 0, groundY - 12);
    hullGrad.addColorStop(0, "#ffffff");
    hullGrad.addColorStop(0.32, "#e4eeff");
    hullGrad.addColorStop(0.68, "#b7c8e8");
    hullGrad.addColorStop(1, "#5c6f9c");

    ctx.beginPath();
    ctx.moveTo(frontX, groundY - 20);
    ctx.bezierCurveTo(frontX + 18, topY + 18, frontX + 78, topY, frontX + 150, topY);
    ctx.lineTo(frontX + 960, topY);
    ctx.lineTo(frontX + 960, groundY - 12);
    ctx.lineTo(frontX + 6, groundY - 12);
    ctx.closePath();
    ctx.fillStyle = hullGrad;
    ctx.fill();

    // Clip details inside hull
    ctx.save();
    ctx.clip();

    // Specular roof highlight strip
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(frontX + 110, topY + 4, 850, 7);

    // High-contrast cyber crimson & cyan racing stripes
    ctx.fillStyle = "#ff1e4d";
    ctx.fillRect(frontX + 44, topY + 60, 920, 17);
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(frontX + 20, topY + 79, 940, 8);

    // Sleek panoramic cockpit glass with reflection
    ctx.fillStyle = "#0e1b38";
    ctx.beginPath();
    ctx.moveTo(frontX + 56, topY + 44);
    ctx.lineTo(frontX + 122, topY + 14);
    ctx.lineTo(frontX + 174, topY + 14);
    ctx.lineTo(frontX + 146, topY + 44);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#38f3ff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Cockpit diagonal glass glint
    ctx.fillStyle = "rgba(180, 245, 255, 0.45)";
    ctx.beginPath();
    ctx.moveTo(frontX + 92, topY + 42);
    ctx.lineTo(frontX + 132, topY + 16);
    ctx.lineTo(frontX + 146, topY + 16);
    ctx.lineTo(frontX + 106, topY + 42);
    ctx.closePath();
    ctx.fill();

    // Glowing passenger windows
    for (let wx = frontX + 204; wx < frontX + 920; wx += 74) {
      ctx.fillStyle = "#14264f";
      ctx.fillRect(wx, topY + 22, 52, 24);
      ctx.fillStyle = "rgba(120, 225, 255, 0.35)";
      ctx.fillRect(wx + 4, topY + 25, 44, 6);
    }
    ctx.restore();

    // Crisp outer ink outline
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#090e20";
    ctx.stroke();

    // Glowing plasma headlight lens
    ctx.fillStyle = "#fff799";
    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(frontX + 26, groundY - 36, 13, 7, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Armored bumper & glowing friction wheels
    ctx.fillStyle = "#181d30";
    ctx.fillRect(frontX + 4, groundY - 16, 56, 12);
    for (let wx = frontX + 98; wx < frontX + 860; wx += 140) {
      ctx.fillStyle = "#181d30";
      ctx.beginPath();
      ctx.arc(wx, groundY - 8, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = speedRatio > 0.2 ? "#ff6622" : "#6c7ea8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(wx, groundY - 8, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  window.MB.Sprites = {
    CHARACTERS,
    getPortrait,
    getAsset,
    drawCharacter,
    drawStadiumBg,
    drawMeteor,
    drawHyperTrain,
  };
})();

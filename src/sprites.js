// Retro 90s Arcade Character Roster & Procedural Pixel-Style Renderer
window.MB = window.MB || {};

(function () {
  const CHARACTERS = [
    {
      id: "rex",
      name: "REX VOLT",
      country: "USA",
      title: "LIGHTNING SPRINTER",
      suit: "#e62e45",
      trim: "#ffcc22",
      skin: "#f2b88a",
      hair: "#2a1a12",
      aura: "#ffdd33",
      // Gameplay stat multipliers
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
      suit: "#17a8e8",
      trim: "#ffffff",
      skin: "#f7c7a3",
      hair: "#161a2e",
      aura: "#44eeff",
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
      suit: "#28b85c",
      trim: "#ffd23f",
      skin: "#e8a87c",
      hair: "#c88a2e",
      aura: "#55ff88",
      speedStat: 7,
      mashStat: 8,
      powerStat: 10,
      speedMult: 0.96,
      mashMult: 1.0,
      powerMult: 1.15,
    },
  ];

  // Helper: draw crisp pixel block
  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Draw animated superhuman character
  // pose: "idle" | "run" | "charge" | "punch" | "brace" | "win" | "fail"
  function drawCharacter(ctx, char, x, y, opts) {
    const o = opts || {};
    const scale = o.scale || 1;
    const pose = o.pose || "idle";
    const phase = o.phase || 0;
    const mega = !!o.mega;
    const sx = (o.scaleX || 1) * (o.flip ? -1 : 1);
    const sy = o.scaleY || 1;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(scale * sx, scale * sy);

    // Shadow on ground
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // MEGA MASH!! Superhuman Aura
    if (mega) {
      const pulse = 1 + Math.sin(performance.now() * 0.03) * 0.14;
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = char.aura;
      ctx.beginPath();
      ctx.ellipse(0, -44, 34 * pulse, 54 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -44, 26 * pulse, 46 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const lean =
      pose === "run" ? 0.24 :
      pose === "brace" ? -0.32 :
      pose === "punch" ? 0.12 : 0;
    ctx.rotate(lean);

    const bob =
      pose === "run" ? Math.abs(Math.sin(phase * 12)) * -7 :
      pose === "charge" ? Math.sin(phase * 30) * 3 :
      pose === "win" ? Math.abs(Math.sin(phase * 8)) * -10 :
      Math.sin(phase * 4) * 2;

    const legSwing = pose === "run" ? Math.sin(phase * 12) * 18 : 0;
    const armSwing = pose === "run" ? Math.cos(phase * 12) * 18 : 0;

    // Back leg
    ctx.save();
    ctx.translate(-6, -24 + bob);
    if (pose === "run") ctx.rotate((-legSwing * Math.PI) / 180);
    if (pose === "brace") ctx.rotate(0.45);
    px(ctx, -5, 0, 10, 22, "#1c1f35");
    px(ctx, -6, 18, 14, 7, char.trim);
    ctx.restore();

    // Front leg
    ctx.save();
    ctx.translate(6, -24 + bob);
    if (pose === "run") ctx.rotate((legSwing * Math.PI) / 180);
    if (pose === "brace") ctx.rotate(-0.45);
    px(ctx, -5, 0, 10, 22, char.suit);
    px(ctx, -4, 18, 15, 7, char.trim);
    ctx.restore();

    // Torso
    const torsoY = -58 + bob;
    px(ctx, -14, torsoY, 28, 34, char.suit);
    // Chest emblem / stripe
    px(ctx, -14, torsoY + 6, 28, 6, char.trim);
    px(ctx, -5, torsoY + 12, 10, 10, "#ffffff");
    // Belt
    px(ctx, -14, torsoY + 28, 28, 6, "#141626");
    px(ctx, -4, torsoY + 28, 8, 6, char.trim);

    // Head
    const headY = torsoY - 22;
    px(ctx, -11, headY, 22, 22, char.skin);
    // Hair
    px(ctx, -13, headY - 6, 26, 9, char.hair);
    px(ctx, -13, headY - 2, 6, 12, char.hair);
    // Headband (90s arcade icon!)
    px(ctx, -12, headY + 3, 24, 5, char.trim);
    // Flowing headband tails
    const tailWave = Math.sin(phase * 18) * 4;
    px(ctx, -22, headY + 4 + tailWave * 0.4, 11, 4, char.trim);
    px(ctx, -27, headY + 7 + tailWave, 8, 3, char.trim);
    // Eyes
    px(ctx, 3, headY + 10, 4, 4, "#111");
    px(ctx, 10, headY + 10, 3, 4, "#111");
    // Determined mouth
    if (pose === "charge" || pose === "brace" || pose === "punch" || mega) {
      px(ctx, 3, headY + 16, 8, 4, "#7a1420");
    } else {
      px(ctx, 4, headY + 17, 6, 2, "#6a2e2e");
    }

    // Arms
    if (pose === "punch") {
      // Massive uppercut fist!
      px(ctx, 6, torsoY - 38, 12, 42, char.skin);
      px(ctx, 3, torsoY - 46, 18, 15, char.trim);
      px(ctx, -22, torsoY + 6, 12, 18, char.skin);
    } else if (pose === "brace") {
      // Both arms pushing forward against the train
      px(ctx, 12, torsoY + 2, 24, 10, char.skin);
      px(ctx, 32, torsoY, 10, 14, char.trim);
      px(ctx, 10, torsoY + 14, 24, 10, char.skin);
      px(ctx, 30, torsoY + 12, 10, 14, char.trim);
    } else if (pose === "charge") {
      // Powering up fists clenched
      const j = Math.sin(phase * 40) * 2;
      px(ctx, -22 + j, torsoY + 4, 10, 22, char.skin);
      px(ctx, -23 + j, torsoY + 20, 12, 9, char.trim);
      px(ctx, 12 - j, torsoY + 4, 10, 22, char.skin);
      px(ctx, 11 - j, torsoY + 20, 12, 9, char.trim);
    } else if (pose === "win") {
      px(ctx, -22, torsoY - 18, 10, 26, char.skin);
      px(ctx, 12, torsoY - 18, 10, 26, char.skin);
    } else {
      // Run / Idle swinging arm
      ctx.save();
      ctx.translate(4, torsoY + 6);
      ctx.rotate((armSwing * Math.PI) / 180);
      px(ctx, -4, 0, 9, 22, char.skin);
      px(ctx, -5, 18, 11, 8, char.trim);
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw vibrant 90s Arcade Stadium Background
  function drawStadiumBg(ctx, W, H, scrollX, theme) {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
    if (theme === "sunset") {
      sky.addColorStop(0, "#1c1240");
      sky.addColorStop(0.55, "#b33054");
      sky.addColorStop(1, "#ff9933");
    } else if (theme === "night") {
      sky.addColorStop(0, "#090b22");
      sky.addColorStop(0.6, "#162052");
      sky.addColorStop(1, "#2a3c7c");
    } else {
      sky.addColorStop(0, "#1045a8");
      sky.addColorStop(0.6, "#2c8cf0");
      sky.addColorStop(1, "#8ce0ff");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.65);

    // Distant skyline / stadium roof
    const off1 = -((scrollX * 0.15) % 160);
    ctx.fillStyle = theme === "night" ? "#0d1330" : "rgba(18, 24, 58, 0.45)";
    for (let x = off1 - 160; x < W + 160; x += 160) {
      ctx.fillRect(x, 125, 130, 120);
      ctx.fillRect(x + 24, 98, 82, 30);
    }

    // Stadium stands & colorful animated crowd dots
    const standY = 215;
    ctx.fillStyle = "#1c203c";
    ctx.fillRect(0, standY, W, 115);

    const off2 = -((scrollX * 0.45) % 48);
    const cheer = Math.floor(performance.now() / 160) % 2;
    const crowdColors = ["#ff4466", "#ffdd33", "#33ccff", "#55ff88", "#ffffff", "#ff8833"];
    for (let row = 0; row < 4; row++) {
      const ry = standY + 14 + row * 22;
      ctx.fillStyle = row % 2 === 0 ? "#252b4f" : "#1f2444";
      ctx.fillRect(0, ry + 8, W, 8);
      for (let x = off2 - 48; x < W + 48; x += 24) {
        const idx = Math.abs(Math.floor((x + row * 37) / 24)) % crowdColors.length;
        const hop = ((idx + cheer) % 2) * -3;
        px(ctx, x + (row % 2) * 10, ry + hop, 10, 10, crowdColors[idx]);
      }
    }

    // Advertising boards along stadium wall
    const wallY = 322;
    ctx.fillStyle = "#0e1124";
    ctx.fillRect(0, wallY, W, 28);
    const off3 = -((scrollX * 0.8) % 240);
    for (let x = off3 - 240; x < W + 240; x += 240) {
      px(ctx, x + 6, wallY + 4, 110, 20, "#ff3355");
      px(ctx, x + 122, wallY + 4, 110, 20, "#2299ff");
      ctx.fillStyle = "#fff";
      ctx.font = "900 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("MASH BREAKERS", x + 61, wallY + 18);
      ctx.fillText("MEGA MASH!!", x + 177, wallY + 18);
    }
  }

  // Draw Giant Glowing Meteor (Event 2)
  function drawMeteor(ctx, x, y, radius, crackLevel, shattered, shatterT) {
    ctx.save();
    ctx.translate(x, y);

    if (shattered) {
      // Two huge glowing halves flying apart!
      const sep = shatterT * 260;
      const rot = shatterT * 1.6;
      [-1, 1].forEach((dir) => {
        ctx.save();
        ctx.translate(dir * sep, -shatterT * 90 + shatterT * shatterT * 180);
        ctx.rotate(dir * rot);
        ctx.fillStyle = "#5c4a46";
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.72, dir < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, dir < 0 ? Math.PI * 1.5 : Math.PI * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ff9922";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
      return;
    }

    // Fiery halo
    const grad = ctx.createRadialGradient(0, 0, radius * 0.6, 0, 0, radius * 1.45);
    grad.addColorStop(0, "rgba(255, 130, 30, 0.75)");
    grad.addColorStop(1, "rgba(255, 40, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.45, 0, Math.PI * 2);
    ctx.fill();

    // Jagged rock body
    ctx.fillStyle = "#4b3c3a";
    ctx.beginPath();
    const pts = 14;
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = radius * (i % 2 === 0 ? 1.0 : 0.88);
      const px0 = Math.cos(a) * r;
      const py0 = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px0, py0);
      else ctx.lineTo(px0, py0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#261c1b";
    ctx.stroke();

    // Craters
    ctx.fillStyle = "#352827";
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.22, 0, Math.PI * 2);
    ctx.arc(radius * 0.28, radius * 0.15, radius * 0.18, 0, Math.PI * 2);
    ctx.arc(-radius * 0.08, radius * 0.36, radius * 0.14, 0, Math.PI * 2);
    ctx.fill();

    // Glowing magma cracks based on charge
    if (crackLevel > 0.15) {
      ctx.strokeStyle = crackLevel > 0.75 ? "#ffee44" : "#ff6622";
      ctx.lineWidth = 3 + crackLevel * 4;
      ctx.beginPath();
      ctx.moveTo(0, radius * 0.85);
      ctx.lineTo(-radius * 0.2, radius * 0.2);
      ctx.lineTo(radius * 0.18, -radius * 0.25);
      ctx.lineTo(-radius * 0.1, -radius * 0.75);
      if (crackLevel > 0.5) {
        ctx.moveTo(-radius * 0.2, radius * 0.2);
        ctx.lineTo(-radius * 0.65, 0);
        ctx.moveTo(radius * 0.18, -radius * 0.25);
        ctx.lineTo(radius * 0.68, -radius * 0.1);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Hyper-Bullet Train (Event 3)
  function drawHyperTrain(ctx, frontX, groundY, speedRatio) {
    ctx.save();
    const h = 112;
    const topY = groundY - h - 8;

    // Speed wind streaks over nose
    if (speedRatio > 0.1) {
      ctx.strokeStyle = `rgba(180, 235, 255, ${0.55 * speedRatio})`;
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(frontX - 10, topY + 20 + i * 24);
        ctx.lineTo(frontX + 120 + i * 40, topY + 12 + i * 24);
        ctx.stroke();
      }
    }

    // Train body extending to the right
    ctx.fillStyle = "#eef4ff";
    ctx.beginPath();
    ctx.moveTo(frontX, groundY - 22);
    ctx.quadraticCurveTo(frontX + 20, topY, frontX + 130, topY);
    ctx.lineTo(frontX + 950, topY);
    ctx.lineTo(frontX + 950, groundY - 12);
    ctx.lineTo(frontX + 8, groundY - 12);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#18223d";
    ctx.stroke();

    // Racing stripes
    ctx.fillStyle = "#ff2244";
    ctx.fillRect(frontX + 55, topY + 58, 895, 16);
    ctx.fillStyle = "#1155dd";
    ctx.fillRect(frontX + 32, topY + 76, 918, 10);

    // Cockpit glass
    ctx.fillStyle = "#1a2b4c";
    ctx.beginPath();
    ctx.moveTo(frontX + 52, topY + 38);
    ctx.lineTo(frontX + 108, topY + 14);
    ctx.lineTo(frontX + 148, topY + 14);
    ctx.lineTo(frontX + 126, topY + 38);
    ctx.closePath();
    ctx.fill();

    // Passenger windows
    ctx.fillStyle = "#263a66";
    for (let wx = frontX + 185; wx < frontX + 900; wx += 74) {
      ctx.fillRect(wx, topY + 22, 48, 24);
    }

    // Glowing headlight
    ctx.fillStyle = "#ffee55";
    ctx.beginPath();
    ctx.ellipse(frontX + 26, groundY - 36, 12, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Heavy bumper / wheels
    ctx.fillStyle = "#23273b";
    ctx.fillRect(frontX + 4, groundY - 16, 48, 12);
    for (let wx = frontX + 95; wx < frontX + 850; wx += 140) {
      ctx.beginPath();
      ctx.arc(wx, groundY - 8, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8896b8";
      ctx.beginPath();
      ctx.arc(wx, groundY - 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#23273b";
    }

    ctx.restore();
  }

  window.MB.Sprites = {
    CHARACTERS,
    drawCharacter,
    drawStadiumBg,
    drawMeteor,
    drawHyperTrain,
  };
})();

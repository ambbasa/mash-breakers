// Namco-Inspired Non-Linear RENDA (Button-Mashing) Input Physics Engine
// Implements KOUGO (alternating), DOUJI (simultaneous), LEFT/RIGHT weights,
// COEFFICIENT, and non-linear CURVE acceleration + live CPS telemetry.
window.MB = window.MB || {};

(function () {
  const DEFAULT_CONFIG = {
    weightKougo: 1.0,    // L -> R -> L alternating mash (100% max efficiency)
    weightDouji: 0.68,   // L + R simultaneous press within 48ms window
    weightLeft: 0.42,    // Repeated single left key
    weightRight: 0.42,   // Repeated single right key
    doujiWindowMs: 48,   // Simultaneous press detection threshold
    coefficient: 1.08,   // Global multiplier
    curvePower: 1.65,    // Non-linear saturation curve exponent
    lowEndBoost: 1.28,   // Snappy early acceleration burst
  };

  function createRendaTracker(customCfg) {
    const cfg = Object.assign({}, DEFAULT_CONFIG, customCfg || {});
    return {
      cfg,
      lastKey: null,
      lastTime: 0,
      lastMode: "IDLE", // KOUGO | DOUJI | LEFT | RIGHT
      timestamps: [],
      cps: 0,
      peakCps: 0,
      totalHits: 0,
      kougoStreak: 0,

      reset() {
        this.lastKey = null;
        this.lastTime = 0;
        this.lastMode = "IDLE";
        this.timestamps.length = 0;
        this.cps = 0;
        this.peakCps = 0;
        this.totalHits = 0;
        this.kougoStreak = 0;
      },

      // Register a 'left' or 'right' mash and compute non-linear gain
      register(key, currentRatio) {
        const now = performance.now();
        const dtMs = this.lastTime ? now - this.lastTime : 999;

        let weight = cfg.weightKougo;
        if (this.lastKey === null) {
          weight = cfg.weightKougo;
          this.lastMode = "KOUGO";
          this.kougoStreak = 1;
        } else if (this.lastKey !== key) {
          if (dtMs <= cfg.doujiWindowMs) {
            weight = cfg.weightDouji;
            this.lastMode = "DOUJI";
          } else {
            weight = cfg.weightKougo;
            this.lastMode = "KOUGO";
            this.kougoStreak += 1;
          }
        } else {
          weight = key === "left" ? cfg.weightLeft : cfg.weightRight;
          this.lastMode = key === "left" ? "LEFT" : "RIGHT";
          this.kougoStreak = 0;
        }

        this.lastKey = key;
        this.lastTime = now;
        this.totalHits += 1;

        this.timestamps.push(now);
        this.timestamps = this.timestamps.filter((t) => now - t <= 1000);
        this.cps = this.timestamps.length;
        if (this.cps > this.peakCps) this.peakCps = this.cps;

        // Non-linear CURVE: explosive low-end launch, weighty high-end saturation
        const r = Math.max(0, Math.min(1.2, currentRatio || 0));
        const curveFactor = Math.max(0.42, cfg.lowEndBoost - 0.62 * Math.pow(Math.min(1, r), cfg.curvePower));
        // Small KOUGO rhythm streak bonus (up to +14%)
        const streakBonus = 1 + Math.min(0.14, this.kougoStreak * 0.012);

        return {
          effectiveGain: weight * cfg.coefficient * curveFactor * streakBonus,
          mode: this.lastMode,
          cps: this.cps,
          streak: this.kougoStreak,
          curveFactor,
        };
      },

      update() {
        const now = performance.now();
        this.timestamps = this.timestamps.filter((t) => now - t <= 1000);
        this.cps = this.timestamps.length;
      },
    };
  }

  window.MB.Renda = {
    DEFAULT_CONFIG,
    createTracker: createRendaTracker,
  };
})();

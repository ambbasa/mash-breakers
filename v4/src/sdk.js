// Portal SDK Adapter (Ready for Poki / CrazyGames integration)
window.MB = window.MB || {};

(function () {
  let adActive = false;

  const SDK = {
    platform: "local",

    init() {
      if (window.PokiSDK) {
        this.platform = "poki";
        window.PokiSDK.init().catch(() => {});
      } else if (window.CrazyGames && window.CrazyGames.SDK) {
        this.platform = "crazygames";
      }
    },

    gameplayStart() {
      if (this.platform === "poki" && window.PokiSDK) {
        window.PokiSDK.gameplayStart();
      } else if (this.platform === "crazygames" && window.CrazyGames?.SDK?.game) {
        window.CrazyGames.SDK.game.gameplayStart();
      }
    },

    gameplayStop() {
      if (this.platform === "poki" && window.PokiSDK) {
        window.PokiSDK.gameplayStop();
      } else if (this.platform === "crazygames" && window.CrazyGames?.SDK?.game) {
        window.CrazyGames.SDK.game.gameplayStop();
      }
    },

    async commercialBreak() {
      if (this.platform === "poki" && window.PokiSDK) {
        await window.PokiSDK.commercialBreak();
        return;
      }
      return;
    },

    async rewardedBreak(label) {
      if (adActive) return false;
      if (this.platform === "poki" && window.PokiSDK) {
        return await window.PokiSDK.rewardedBreak();
      }
      // Local prototype simulator (1.6s preview so devs can test monetization UX)
      adActive = true;
      const overlay = document.getElementById("ad-overlay");
      const title = document.getElementById("ad-title");
      const progress = document.getElementById("ad-progress");
      if (title && label) title.textContent = label;
      if (overlay) overlay.classList.remove("hidden");

      return new Promise((resolve) => {
        const start = performance.now();
        const dur = 1600;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          if (progress) progress.style.width = `${Math.round(p * 100)}%`;
          if (p < 1) {
            requestAnimationFrame(tick);
          } else {
            if (overlay) overlay.classList.add("hidden");
            if (progress) progress.style.width = "0%";
            adActive = false;
            resolve(true);
          }
        };
        requestAnimationFrame(tick);
      });
    },

    isAdActive() {
      return adActive;
    },
  };

  window.MB.SDK = SDK;
})();

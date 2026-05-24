/**
 * Whether to defer heavy Drive video iframe (show poster / tap-to-play first).
 * @param {number} durationSec
 */
export function shouldDeferVideoIframe(durationSec = 0) {
  if (typeof navigator === "undefined") return false;
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) return durationSec > 45;
  if (c.saveData) return true;
  const t = c.effectiveType || "";
  if (t === "slow-2g" || t === "2g") return true;
  if (t === "3g") return durationSec > 20;
  if (t === "4g" && durationSec > 50) return true;
  return false;
}

export function playbackQualityLabel(deferHd) {
  return deferHd ? "Standard (tap for HD)" : "HD";
}

/**
 * Beauty ambient motion tier — signal-driven glows vs frozen baseline snapshot.
 *
 * Revert to the exact 2026-06-02 look (browser, no rebuild):
 *   localStorage.setItem('livia.beautyAmbient', 'baseline')
 *   location.reload()
 *
 * Restore signal tier:
 *   localStorage.setItem('livia.beautyAmbient', 'signal')
 *   location.reload()
 *
 * File restore (git-independent):
 *   pnpm beauty:ambient:baseline
 */

export type BeautyAmbientTier = "signal" | "baseline";

const LS_KEY = "livia.beautyAmbient";
const SNAPSHOT_ID = "2026-06-02";

export function readBeautyAmbientTier(): BeautyAmbientTier {
  if (typeof window === "undefined") return "signal";
  const env = import.meta.env.VITE_BEAUTY_AMBIENT as string | undefined;
  if (env === "baseline") return "baseline";
  const stored = window.localStorage.getItem(LS_KEY);
  if (stored === "baseline" || stored === "signal") return stored;
  return "signal";
}

export function applyBeautyAmbient(root: HTMLElement = document.documentElement): BeautyAmbientTier {
  const tier = readBeautyAmbientTier();
  root.dataset.beautyAmbient = tier;
  root.dataset.beautyAmbientSnapshot = tier === "baseline" ? SNAPSHOT_ID : "";

  const hour = new Date().getHours();
  const tod = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  root.dataset.timeOfDay = tod;

  return tier;
}

export function setBeautyAmbientTier(tier: BeautyAmbientTier): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, tier);
  applyBeautyAmbient();
}

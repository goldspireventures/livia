/**
 * W1 marketing shell — fixed Aurora editorial (not tenant presets).
 * @see docs/design/MARKETING-SURFACE-PROGRAM.md
 * @see docs/design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md §2–3
 * @see docs/design/SKIN-BRAND-INHERITANCE-SPEC.md §2 (W1–W3 never use tenant skins)
 */

export const MARKETING_SURFACE_WORLD = "w1" as const;
export const MARKETING_PLATFORM_SKIN = "aurora-editorial" as const;

/** Aligns with dashboard W2 gateway + platform-default dark Aurora locally. */
export function applyMarketingPlatformTheme() {
  const el = document.documentElement;
  el.classList.add("dark");
  el.dataset.surfaceWorld = MARKETING_SURFACE_WORLD;
  el.dataset.platformSkin = MARKETING_PLATFORM_SKIN;
  el.removeAttribute("data-vertical");
  el.removeAttribute("data-presentation");
  el.removeAttribute("data-guest-surface");
}

export function clearMarketingPlatformTheme() {
  const el = document.documentElement;
  el.classList.remove("dark");
  delete el.dataset.surfaceWorld;
  delete el.dataset.platformSkin;
}

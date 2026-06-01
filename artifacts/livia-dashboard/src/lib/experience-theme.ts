import type { BusinessVertical } from "@workspace/policy";
import { applyVerticalTheme, clearVerticalTheme, VERTICAL_THEMES } from "./vertical-theme";
import { applyMarketTheme, clearMarketTheme, MARKET_SKINS } from "./market-theme";
import { PERSONA_ACCENT, type PersonaKind } from "./persona";
import { resolveJurisdictionCode, resolveVerticalKey } from "@workspace/policy";

/** Maps W4/W5 cssPreset → document color scheme (must match policy preset tokens). */
const PRESENTATION_COLOR_MODE: Record<string, "light" | "dark"> = {
  "platform-default": "dark",
  "noir-dusk": "dark",
  "premium-dark": "dark",
  "soft-studio": "light",
  editorial: "light",
  "warm-chair": "light",
  "clean-salon": "light",
  "barber-bold": "dark",
};

export function resolvePresentationColorMode(
  cssPreset?: string | null,
): "light" | "dark" | undefined {
  if (!cssPreset) return undefined;
  return PRESENTATION_COLOR_MODE[cssPreset];
}

/** Keep next-themes `dark` class aligned with tenant presentation (fixes black shell on light beauty mocks). */
export function syncDocumentColorMode(
  colorMode?: "light" | "dark" | null,
  root?: HTMLElement | null,
) {
  if (root) return;
  const el = document.documentElement;
  if (colorMode === "light") {
    el.classList.remove("dark");
  } else if (colorMode === "dark") {
    el.classList.add("dark");
  }
}

export function applyPersonaTheme(persona?: PersonaKind | null) {
  const root = document.documentElement;
  if (!persona) {
    delete root.dataset.persona;
    root.style.removeProperty("--persona-accent");
    root.style.removeProperty("--persona-accent-soft");
    return;
  }
  root.dataset.persona = persona;
  const accent = PERSONA_ACCENT[persona];
  root.style.setProperty("--persona-accent", accent);
  root.style.setProperty("--persona-accent-soft", `${accent}22`);
}

export function applyExperienceTheme(args: {
  vertical?: string | null;
  category?: string | null;
  country?: string | null;
  persona?: PersonaKind | null;
}) {
  applyVerticalTheme(args.vertical, args.category);
  applyMarketTheme(args.country);
  applyPersonaTheme(args.persona);
}

export function clearExperienceTheme() {
  clearVerticalTheme();
  clearMarketTheme();
  applyPersonaTheme(null);
}

export function publicExperienceClassNames(args: {
  vertical?: string | null;
  category?: string | null;
  country?: string | null;
  experienceSkin?: { shell?: string; display?: string; market?: string } | null;
}): string {
  const key = resolveVerticalKey(args.vertical, args.category);
  const shell = args.experienceSkin?.shell ?? VERTICAL_THEMES[key].shell;
  const code = (
    args.experienceSkin?.market ?? resolveJurisdictionCode(args.country).toLowerCase()
  ).toLowerCase();
  return `public-booking-shell public-skin-${shell} public-market-${code}`;
}

export function marketRibbon(
  country?: string | null,
  experienceSkin?: { market?: string } | null,
): string | undefined {
  const code = experienceSkin?.market
    ? (experienceSkin.market.toUpperCase() as keyof typeof MARKET_SKINS)
    : resolveJurisdictionCode(country);
  return MARKET_SKINS[code]?.ribbon ?? MARKET_SKINS.IE?.ribbon;
}

export function applyPresentationTheme(args: {
  cssPreset?: string | null;
  brandAccentHex?: string | null;
  colorMode?: "light" | "dark" | null;
  /** Scope tokens to a panel (e.g. sign-in preview) instead of the full document. */
  root?: HTMLElement | null;
}) {
  const root = args.root ?? document.documentElement;
  if (args.cssPreset) {
    root.dataset.presentation = args.cssPreset;
  } else {
    delete root.dataset.presentation;
  }
  if (args.brandAccentHex) {
    root.style.setProperty("--brand-accent", args.brandAccentHex);
  } else {
    root.style.removeProperty("--brand-accent");
  }
  const mode = args.colorMode ?? resolvePresentationColorMode(args.cssPreset);
  syncDocumentColorMode(mode, args.root);
}

export function clearPresentationTheme(root?: HTMLElement | null) {
  applyPresentationTheme({ root });
}

/** W6 `/my` — Platform Default Aurora (same family as new signups), not tenant preset chrome. */
export function applyGuestHubPlatformTheme() {
  const el = document.documentElement;
  clearExperienceTheme();
  el.removeAttribute("data-vertical");
  el.removeAttribute("data-beauty-ambient");
  el.dataset.guestSurface = "platform";
  applyPresentationTheme({ cssPreset: "platform-default", colorMode: "dark" });
}

export function clearGuestHubPlatformTheme() {
  const el = document.documentElement;
  delete el.dataset.guestSurface;
  clearPresentationTheme();
  clearExperienceTheme();
}

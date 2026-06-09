import {
  resolveJurisdictionCode,
  resolveVerticalKey,
  resolvePresentationLayoutMorph,
  resolveBeautyOperatorCssPreset,
  resolveWellnessOperatorCssPreset,
  type BusinessVertical,
  type PresentationLayoutMorph,
} from "@workspace/policy";
import { applyVerticalTheme, clearVerticalTheme, VERTICAL_THEMES } from "./vertical-theme";
import { applyMarketTheme, clearMarketTheme, MARKET_SKINS } from "./market-theme";
import { PERSONA_ACCENT, type PersonaKind } from "./persona";
import { applyBeautyAmbient } from "./beauty-ambient";
import {
  BEAUTY_CSS_PRESETS,
  isBeautyPresentationPreset,
  isBeautyVertical,
  WELLNESS_CSS_PRESETS,
  isWellnessPresentationPreset,
  isWellnessVertical,
} from "./presentation-layout";

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
  "harbour-light": "light",
  "session-rail": "light",
  "evening-ledger": "dark",
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
    el.style.colorScheme = "light";
    el.classList.remove("dark");
  } else if (colorMode === "dark") {
    el.style.colorScheme = "dark";
    el.classList.add("dark");
  }
  el.style.backgroundColor = "hsl(var(--background))";
  if (document.body) {
    document.body.style.backgroundColor = "hsl(var(--background))";
  }
}

function withPresentationSwapLock(apply: () => void) {
  const el = document.documentElement;
  el.classList.add("presentation-swap-lock");
  try {
    apply();
  } finally {
    requestAnimationFrame(() => {
      el.classList.remove("presentation-swap-lock");
    });
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

/** Presentation preset wins over vertical inline `--primary` (vertical theme sets inline first). */
const PRESENTATION_TOKEN_OVERRIDES: Record<
  string,
  { primary: string; ring: string; sidebarPrimary?: string; accent?: string }
> = {
  "platform-default": {
    primary: "43 38% 66%",
    ring: "43 38% 66%",
    sidebarPrimary: "43 38% 66%",
    accent: "188 72% 52%",
  },
  "noir-dusk": { primary: "330 45% 72%", ring: "330 45% 72%", sidebarPrimary: "330 45% 72%" },
  "soft-studio": { primary: "330 81% 60%", ring: "330 81% 60%", sidebarPrimary: "330 81% 60%" },
  editorial: { primary: "16 52% 48%", ring: "16 52% 48%", sidebarPrimary: "16 52% 48%" },
  "premium-dark": { primary: "36 55% 62%", ring: "36 55% 62%", sidebarPrimary: "36 55% 62%" },
  "harbour-light": { primary: "174 72% 40%", ring: "174 72% 40%", sidebarPrimary: "174 72% 40%" },
  "session-rail": { primary: "222 47% 22%", ring: "222 47% 22%", sidebarPrimary: "222 47% 22%" },
  "evening-ledger": { primary: "38 55% 58%", ring: "38 55% 58%", sidebarPrimary: "38 55% 58%" },
  "warm-chair": { primary: "43 74% 52%", ring: "43 74% 52%", sidebarPrimary: "43 74% 52%" },
  "clean-salon": { primary: "210 40% 45%", ring: "210 40% 45%", sidebarPrimary: "210 40% 45%" },
  "barber-bold": { primary: "0 0% 92%", ring: "0 0% 92%", sidebarPrimary: "0 0% 92%" },
};

function applyPresentationTokenOverrides(root: HTMLElement, cssPreset?: string | null) {
  if (!cssPreset) return;
  const tokens = PRESENTATION_TOKEN_OVERRIDES[cssPreset];
  if (!tokens) return;
  root.style.setProperty("--primary", tokens.primary);
  root.style.setProperty("--ring", tokens.ring);
  root.style.setProperty("--sidebar-primary", tokens.sidebarPrimary ?? tokens.primary);
  if (tokens.accent) {
    root.style.setProperty("--accent", tokens.accent);
  } else {
    root.style.removeProperty("--accent");
  }
}

export function applyPresentationLayoutMorph(
  morph: PresentationLayoutMorph | null,
  root?: HTMLElement | null,
) {
  const el = root ?? document.documentElement;
  if (morph) {
    el.dataset.layoutMorph = morph;
  } else {
    delete el.dataset.layoutMorph;
  }
}

export function applyPresentationTheme(args: {
  cssPreset?: string | null;
  brandAccentHex?: string | null;
  colorMode?: "light" | "dark" | null;
  vertical?: string | null;
  layoutMorph?: PresentationLayoutMorph | null;
  /** Scope tokens to a panel (e.g. sign-in preview) instead of the full document. */
  root?: HTMLElement | null;
}) {
  const apply = () => {
    const root = args.root ?? document.documentElement;
    if (args.cssPreset) {
      root.dataset.presentation = args.cssPreset;
    } else {
      delete root.dataset.presentation;
    }
    const morph =
      args.layoutMorph ??
      (args.vertical && args.cssPreset
        ? resolvePresentationLayoutMorph(args.vertical as BusinessVertical, args.cssPreset)
        : null);
    applyPresentationLayoutMorph(morph, root);
    if (args.cssPreset) {
      const layoutToken =
        morph === "atrium"
          ? "spatial"
          : morph === "timeline-rail"
            ? "timeline"
            : morph === "ledger"
              ? "cards"
              : morph === "menu-card"
                ? "list"
                : morph === "cockpit" || morph === "split-inbox"
                  ? "cards"
                  : "cards";
      root.dataset.presentationLayout = layoutToken;
    } else {
      delete root.dataset.presentationLayout;
    }
    if (
      args.cssPreset &&
      (BEAUTY_CSS_PRESETS as readonly string[]).includes(args.cssPreset)
    ) {
      root.dataset.beautyNativeSkin = "1";
    } else {
      delete root.dataset.beautyNativeSkin;
    }
    if (
      args.cssPreset &&
      (WELLNESS_CSS_PRESETS as readonly string[]).includes(args.cssPreset)
    ) {
      root.dataset.wellnessNativeSkin = "1";
    } else {
      delete root.dataset.wellnessNativeSkin;
    }
    if (args.brandAccentHex) {
      root.style.setProperty("--brand-accent", args.brandAccentHex);
    } else {
      root.style.removeProperty("--brand-accent");
    }
    applyPresentationTokenOverrides(root, args.cssPreset);
    const mode = args.colorMode ?? resolvePresentationColorMode(args.cssPreset);
    syncDocumentColorMode(mode, args.root);
  };

  if (args.root) {
    apply();
  } else {
    withPresentationSwapLock(apply);
  }
}

export function clearPresentationTheme(root?: HTMLElement | null) {
  applyPresentationTheme({ root });
}

/**
 * Single hub for W4/W5 tenant skin — vertical + presentation preset + color mode.
 * Settings preview, dashboard shell, and public /b must all use this so policy/CSS
 * presets propagate without per-surface drift.
 */
export function applyTenantPresentationSurface(args: {
  vertical?: string | null;
  category?: string | null;
  country?: string | null;
  persona?: PersonaKind | null;
  cssPreset?: string | null;
  brandAccentHex?: string | null;
  colorMode?: "light" | "dark" | null;
  root?: HTMLElement | null;
}) {
  if (args.vertical != null || args.category != null || args.country != null || args.persona) {
    applyExperienceTheme({
      vertical: args.vertical,
      category: args.category,
      country: args.country,
      persona: args.persona ?? null,
    });
  }
  const cssPreset =
    args.vertical === "wellness"
      ? resolveWellnessOperatorCssPreset(args.cssPreset)
      : args.vertical === "beauty"
        ? resolveBeautyOperatorCssPreset(args.cssPreset)
        : args.cssPreset;
  if (cssPreset) {
    const mode = args.colorMode ?? resolvePresentationColorMode(cssPreset);
    applyPresentationTheme({
      cssPreset,
      brandAccentHex: args.brandAccentHex,
      colorMode: mode,
      vertical: args.vertical,
      root: args.root,
    });
    if (!args.root && isBeautyVertical(args.vertical) && isBeautyPresentationPreset(args.cssPreset)) {
      applyBeautyAmbient();
    }
  }
}

/** W6 `/my` — Platform Default Constellation (same family as new signups), not tenant preset chrome. */
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

import type { BusinessVertical } from "@workspace/policy";
import { applyVerticalTheme, clearVerticalTheme, VERTICAL_THEMES } from "./vertical-theme";
import { applyMarketTheme, clearMarketTheme, MARKET_SKINS } from "./market-theme";
import { PERSONA_ACCENT, type PersonaKind } from "./persona";
import { resolveJurisdictionCode, resolveVerticalKey } from "@workspace/policy";

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

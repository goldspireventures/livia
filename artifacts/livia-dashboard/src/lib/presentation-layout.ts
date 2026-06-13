import type { PresentationLayoutMorph } from "@workspace/policy";
import {
  guestPublicHeroTagline,
  guestPublicCatalogLayout,
  PLATFORM_DEFAULT_PRESET_ID,
} from "@workspace/policy";

export const BEAUTY_CSS_PRESETS = ["noir-dusk", "soft-studio", "editorial", "premium-dark"] as const;
export type BeautyCssPreset = (typeof BEAUTY_CSS_PRESETS)[number];

export const WELLNESS_CSS_PRESETS = ["harbour-light", "session-rail", "evening-ledger"] as const;
export type WellnessCssPreset = (typeof WELLNESS_CSS_PRESETS)[number];

export const EVENT_VENDOR_CSS_PRESETS = ["event-atelier", "wedding-ledger", "party-pop"] as const;
export type EventVendorCssPreset = (typeof EVENT_VENDOR_CSS_PRESETS)[number];

const BEAUTY_PRESETS = new Set<string>(BEAUTY_CSS_PRESETS);
const WELLNESS_PRESETS = new Set<string>(WELLNESS_CSS_PRESETS);
const EVENT_VENDOR_PRESETS = new Set<string>(EVENT_VENDOR_CSS_PRESETS);

/** Read active presentation preset from document (W4/W5). */
export function readCssPresentation(): string | null {
  if (typeof document === "undefined") return null;
  return document.documentElement.dataset.presentation ?? null;
}

export function isBeautyPresentationPreset(preset?: string | null): boolean {
  const p = preset ?? readCssPresentation();
  return p != null && BEAUTY_PRESETS.has(p);
}

export function isBeautyVertical(vertical?: string | null): boolean {
  return vertical === "beauty";
}

/** Platform Default / Constellation — not a vertical-native morph skin. */
export function isConstellationPresentation(cssPreset?: string | null): boolean {
  const p = cssPreset ?? readCssPresentation();
  return p == null || p === "platform-default" || p === PLATFORM_DEFAULT_PRESET_ID;
}

export function isWellnessPresentationPreset(preset?: string | null): boolean {
  const p = preset ?? readCssPresentation();
  return p != null && WELLNESS_PRESETS.has(p);
}

export function isWellnessVertical(vertical?: string | null): boolean {
  return vertical === "wellness";
}

export function isEventVendorPresentationPreset(preset?: string | null): boolean {
  const p = preset ?? readCssPresentation();
  return p != null && EVENT_VENDOR_PRESETS.has(p);
}

export function isEventVendorVertical(vertical?: string | null): boolean {
  return vertical === "event-vendors";
}

export function useBeautyChrome(vertical?: string | null): boolean {
  return isBeautyVertical(vertical) && isBeautyPresentationPreset();
}

/** W4 list/inbox shells — any wellness tenant. */
export function useWellnessChrome(vertical?: string | null): boolean {
  return isWellnessVertical(vertical);
}

/** Stored presentation CSS preset (no operator override). */
export function wellnessEffectiveCssPreset(cssPreset?: string | null): string | null {
  return cssPreset ?? null;
}

export const WELLNESS_NATIVE_MORPHS = ["atrium", "timeline-rail", "ledger"] as const;
export const BEAUTY_NATIVE_MORPHS = ["split-inbox", "atrium", "menu-card", "cockpit"] as const;
export const EVENT_VENDOR_NATIVE_MORPHS = ["atrium", "pipeline", "menu-card"] as const;

export function readLayoutMorph(): PresentationLayoutMorph | null {
  if (typeof document === "undefined") return null;
  const raw = document.documentElement.dataset.layoutMorph;
  return raw ? (raw as PresentationLayoutMorph) : null;
}

export function isWellnessNativeMorph(
  morph?: string | null,
): morph is (typeof WELLNESS_NATIVE_MORPHS)[number] {
  return morph != null && (WELLNESS_NATIVE_MORPHS as readonly string[]).includes(morph);
}

/** Wellness presets with distinct layout shells (not platform-default / constellation). */
export function wellnessNativeMorphForVertical(
  vertical?: string | null,
  morph?: string | null,
): PresentationLayoutMorph | null {
  if (!isWellnessVertical(vertical) || !isWellnessNativeMorph(morph)) return null;
  return morph;
}

export function isBeautyNativeMorph(
  morph?: string | null,
): morph is (typeof BEAUTY_NATIVE_MORPHS)[number] {
  return morph != null && (BEAUTY_NATIVE_MORPHS as readonly string[]).includes(morph);
}

/** Beauty presets with distinct Today shells (not platform-default / constellation). */
export function beautyNativeMorphForVertical(
  vertical?: string | null,
  morph?: string | null,
): PresentationLayoutMorph | null {
  if (!isBeautyVertical(vertical) || !isBeautyNativeMorph(morph)) return null;
  return morph;
}

/** Event-vendor presets with distinct consult-first shells. */
export function eventVendorNativeMorphForVertical(
  vertical?: string | null,
  morph?: string | null,
): PresentationLayoutMorph | null {
  if (!isEventVendorVertical(vertical) || !isEventVendorNativeMorph(morph)) return null;
  return morph;
}

export function isEventVendorNativeMorph(
  morph?: string | null,
): morph is (typeof EVENT_VENDOR_NATIVE_MORPHS)[number] {
  return morph != null && (EVENT_VENDOR_NATIVE_MORPHS as readonly string[]).includes(morph);
}

export function wellnessPanel(wellnessChrome: boolean): string {
  return wellnessChrome ? "wellness-panel border bg-card" : "border bg-card";
}

export function wellnessPublicHeroTagline(cssPreset?: string | null): string {
  return guestPublicHeroTagline("wellness", null, cssPreset) ?? "MIND · CALM · REST";
}

export function wellnessPublicCatalogLayout(cssPreset?: string | null): "wellness-grid" | "list" {
  const layout = guestPublicCatalogLayout("wellness", null);
  return layout === "grid-2x2" ? "wellness-grid" : "list";
}

/** W5 catalog layout — editorial preset uses list per policy `layout: list`. */
export function resolveBeautyPublicCatalogLayout(
  cssPreset?: string | null,
): "beauty-grid" | "list" {
  if (cssPreset === "editorial") return "list";
  const layout = guestPublicCatalogLayout("beauty", null);
  return layout === "grid-2x2" ? "beauty-grid" : "list";
}

/** W5 hero H1 — singular service noun from tenant vocabulary. */
export function beautyPublicHeroTitle(serviceNoun: string): string {
  const raw = serviceNoun.trim().toLowerCase();
  if (!raw) return "Book now";
  const singular =
    raw.endsWith("ies") && raw.length > 3
      ? `${raw.slice(0, -3)}y`
      : raw.endsWith("s") && raw.length > 1
        ? raw.slice(0, -1)
        : raw;
  return `Book a ${singular}`;
}

export function beautyPublicHeroTagline(cssPreset?: string | null): string {
  return guestPublicHeroTagline("beauty", null, cssPreset) ?? "BOOK · CONFIRM · BLOOM";
}

/** Preset swatch for settings cards (HSL triplets matching index.css). */
export const WELLNESS_PRESET_SWATCH: Record<WellnessCssPreset, { a: string; b: string }> = {
  "harbour-light": { a: "174 60% 38%", b: "158 35% 94%" },
  "session-rail": { a: "222 47% 18%", b: "220 16% 96%" },
  "evening-ledger": { a: "38 55% 58%", b: "220 25% 8%" },
};

export const PLATFORM_DEFAULT_SWATCH = { a: "43 38% 66%", b: "240 12% 22%" };

export const BEAUTY_PRESET_SWATCH: Record<BeautyCssPreset, { a: string; b: string }> = {
  "noir-dusk": { a: "330 45% 72%", b: "228 18% 9%" },
  "soft-studio": { a: "330 81% 60%", b: "330 40% 98%" },
  editorial: { a: "16 52% 48%", b: "40 33% 97%" },
  "premium-dark": { a: "36 55% 62%", b: "30 8% 7%" },
};

/** Settings picker swatches — one entry per vertical-native cssPreset id. */
const VERTICAL_PRESET_SWATCH: Record<string, { a: string; b: string }> = {
  "warm-chair": { a: "32 48% 46%", b: "36 33% 96%" },
  "clean-salon": { a: "199 89% 42%", b: "210 25% 98%" },
  "barber-bold": { a: "38 92% 50%", b: "24 10% 8%" },
  "studio-dark": { a: "0 72% 51%", b: "220 12% 7%" },
  "flash-light": { a: "0 65% 48%", b: "0 0% 98%" },
  "minimal-mono": { a: "0 0% 12%", b: "0 0% 100%" },
  "gym-bold": { a: "142 76% 45%", b: "222 47% 6%" },
  "studio-clean": { a: "174 58% 38%", b: "200 30% 97%" },
  "coach-compact": { a: "221 83% 53%", b: "220 20% 97%" },
  "clinical-calm": { a: "262 52% 52%", b: "260 30% 98%" },
  "luxury-serif": { a: "280 45% 68%", b: "280 18% 8%" },
  "minimal-consent": { a: "240 6% 32%", b: "0 0% 99%" },
  "clinic-standard": { a: "211 96% 42%", b: "204 40% 97%" },
  "practice-warm": { a: "24 55% 48%", b: "28 35% 97%" },
  "compact-desk": { a: "199 80% 40%", b: "210 22% 96%" },
  "playful-paw": { a: "271 81% 56%", b: "48 80% 97%" },
  "clean-groom": { a: "172 66% 38%", b: "180 25% 97%" },
  "mobile-van": { a: "25 95% 53%", b: "40 20% 96%" },
  "bay-industrial": { a: "45 93% 47%", b: "220 10% 9%" },
  "showroom-light": { a: "221 83% 53%", b: "220 15% 97%" },
  "compact-mobile": { a: "215 25% 35%", b: "210 18% 96%" },
  "event-atelier": { a: "32 95% 44%", b: "36 33% 96%" },
  "wedding-ledger": { a: "30 25% 42%", b: "40 28% 97%" },
  "party-pop": { a: "330 81% 60%", b: "330 40% 98%" },
};

export function presetCardSwatch(
  cssPreset: string,
  vertical?: string | null,
): { a: string; b: string } | undefined {
  if (cssPreset === "platform-default" || cssPreset === PLATFORM_DEFAULT_PRESET_ID) {
    return PLATFORM_DEFAULT_SWATCH;
  }
  if (vertical === "beauty" && (BEAUTY_CSS_PRESETS as readonly string[]).includes(cssPreset)) {
    return BEAUTY_PRESET_SWATCH[cssPreset as BeautyCssPreset];
  }
  if (vertical === "wellness" && (WELLNESS_CSS_PRESETS as readonly string[]).includes(cssPreset)) {
    return WELLNESS_PRESET_SWATCH[cssPreset as WellnessCssPreset];
  }
  if (vertical === "event-vendors" && (EVENT_VENDOR_CSS_PRESETS as readonly string[]).includes(cssPreset)) {
    return VERTICAL_PRESET_SWATCH[cssPreset];
  }
  return VERTICAL_PRESET_SWATCH[cssPreset];
}

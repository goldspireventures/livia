export const BEAUTY_CSS_PRESETS = ["noir-dusk", "soft-studio", "editorial", "premium-dark"] as const;
export type BeautyCssPreset = (typeof BEAUTY_CSS_PRESETS)[number];

const BEAUTY_PRESETS = new Set<string>(BEAUTY_CSS_PRESETS);

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

export function useBeautyChrome(vertical?: string | null): boolean {
  return isBeautyVertical(vertical) && isBeautyPresentationPreset();
}

/** W5 catalog layout — editorial preset uses list per policy `layout: list`. */
export function resolveBeautyPublicCatalogLayout(
  cssPreset?: string | null,
): "beauty-grid" | "list" {
  if (cssPreset === "editorial") return "list";
  return "beauty-grid";
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
  switch (cssPreset) {
    case "soft-studio":
      return "SOFT · CALM · STUDIO";
    case "editorial":
      return "CURATED · TREATMENTS";
    case "premium-dark":
      return "PREMIUM · EXPERIENCE";
    case "noir-dusk":
    default:
      return "BEAUTY · CONFIDENCE · BLOOM";
  }
}

/** Preset swatch for settings cards (HSL triplets matching index.css). */
export const BEAUTY_PRESET_SWATCH: Record<BeautyCssPreset, { a: string; b: string }> = {
  "noir-dusk": { a: "330 45% 72%", b: "228 18% 9%" },
  "soft-studio": { a: "330 81% 60%", b: "330 40% 98%" },
  editorial: { a: "16 52% 48%", b: "40 33% 97%" },
  "premium-dark": { a: "36 55% 62%", b: "30 8% 7%" },
};

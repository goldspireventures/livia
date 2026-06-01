const BEAUTY_PRESETS = new Set(["noir-dusk", "soft-studio", "editorial", "premium-dark"]);

export function isBeautyPublicSurface(
  vertical?: string | null,
  cssPreset?: string | null,
): boolean {
  return vertical === "beauty" && !!cssPreset && BEAUTY_PRESETS.has(cssPreset);
}

export function isBeautyLightPreset(cssPreset?: string | null): boolean {
  return cssPreset === "soft-studio" || cssPreset === "editorial";
}

export function beautyPublicHeroTagline(cssPreset?: string | null): string {
  switch (cssPreset) {
    case "soft-studio":
      return "SOFT · CALM · STUDIO";
    case "editorial":
      return "CURATED · TREATMENTS";
    case "premium-dark":
      return "PREMIUM · EXPERIENCE";
    default:
      return "BEAUTY · CONFIDENCE · BLOOM";
  }
}

export function beautyPublicUseGrid(cssPreset?: string | null): boolean {
  return cssPreset !== "editorial";
}

/** Guest `/b` on mobile — light presets match web color-scheme. */
export const BEAUTY_LIGHT_PUBLIC_COLORS = {
  "soft-studio": {
    background: "#fdf8fa",
    card: "#ffffff",
    foreground: "#3d2430",
    primary: "#db7093",
    border: "#f0dce6",
    mutedForeground: "#8b6b7a",
  },
  editorial: {
    background: "#faf8f5",
    card: "#ffffff",
    foreground: "#2a2218",
    primary: "#b85c3a",
    border: "#e8e0d6",
    mutedForeground: "#7a6e62",
  },
} as const;

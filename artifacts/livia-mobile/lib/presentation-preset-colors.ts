/**
 * Beauty (and shared) presentation presets → mobile color overrides.
 * Web uses `html[data-presentation]`; mobile merges these into the dark base palette.
 */
export type PresentationColorOverrides = {
  background?: string;
  card?: string;
  primary?: string;
  border?: string;
  mutedForeground?: string;
};

export const PRESENTATION_PRESET_MOBILE: Record<string, PresentationColorOverrides> = {
  "platform-default": {},
  "noir-dusk": {
    background: "#131218",
    card: "#1b1922",
    primary: "#d4a5b8",
    border: "#2a2630",
  },
  "soft-studio": {
    background: "#221a1f",
    card: "#2a2026",
    primary: "#f472b6",
    border: "#3d2a35",
    mutedForeground: "#c4a8b5",
  },
  editorial: {
    background: "#1a1714",
    card: "#242019",
    primary: "#c46840",
    border: "#3a3228",
    mutedForeground: "#a89888",
  },
  "premium-dark": {
    background: "#12100e",
    card: "#1c1916",
    primary: "#c9a227",
    border: "#2a2520",
  },
  "warm-chair": {
    background: "#141210",
    card: "#1e1b17",
    primary: "#a67c52",
    border: "#2a2520",
  },
};

export function resolvePresentationMobileColors(
  cssPreset: string | null | undefined,
  brandAccentHex: string | null | undefined,
): PresentationColorOverrides {
  const base = PRESENTATION_PRESET_MOBILE[cssPreset ?? ""] ?? {};
  if (brandAccentHex) {
    return { ...base, primary: brandAccentHex };
  }
  return base;
}

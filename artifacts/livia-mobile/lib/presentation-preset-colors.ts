/**
 * Presentation presets → mobile color overrides.
 * Web uses `html[data-presentation]` + CSS; mobile merges tokens into `useColors`.
 * Authority: `beauty-presentation.css`, `wellness-presentation.css`, `platform-default-constellation.css`
 */
import { BEAUTY_LIGHT_PUBLIC_COLORS } from "@/lib/beauty-public";
import { gatewayTheme } from "@/lib/gateway-theme";

export type PresentationColorOverrides = {
  background?: string;
  card?: string;
  foreground?: string;
  cardForeground?: string;
  primary?: string;
  primaryForeground?: string;
  border?: string;
  muted?: string;
  mutedForeground?: string;
  colorScheme?: "light" | "dark";
};

/** Matches web `resolvePresentationColorMode` in experience-theme.ts */
export const PRESENTATION_COLOR_MODE: Record<string, "light" | "dark"> = {
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
  "event-atelier": "light",
  "wedding-ledger": "light",
  "party-pop": "light",
};

export function resolvePresentationColorMode(
  cssPreset?: string | null,
): "light" | "dark" | undefined {
  if (!cssPreset) return undefined;
  return PRESENTATION_COLOR_MODE[cssPreset];
}

const CONSTELLATION: PresentationColorOverrides = {
  background: gatewayTheme.platformInk,
  card: "rgba(42, 45, 58, 0.72)",
  foreground: "#f7f5f0",
  cardForeground: "#f7f5f0",
  primary: gatewayTheme.aurumChampagne,
  primaryForeground: "#2c2f3a",
  border: "rgba(217, 195, 154, 0.18)",
  muted: "#252830",
  mutedForeground: "rgba(247, 245, 240, 0.55)",
  colorScheme: "dark",
};

const WELLNESS_PRESETS: Record<string, PresentationColorOverrides> = {
  "harbour-light": {
    background: "#edf7f4",
    card: "#fdfcf8",
    foreground: "#153d38",
    cardForeground: "#153d38",
    primary: "#148f7a",
    primaryForeground: "#ffffff",
    border: "#b8d4cc",
    muted: "#e8f2ef",
    mutedForeground: "#5a7a72",
    colorScheme: "light",
  },
  "session-rail": {
    background: "#f3f4f6",
    card: "#ffffff",
    foreground: "#0f172a",
    cardForeground: "#0f172a",
    primary: "#0f172a",
    primaryForeground: "#ffffff",
    border: "#d8dce3",
    muted: "#eef0f3",
    mutedForeground: "#64748b",
    colorScheme: "light",
  },
  "evening-ledger": {
    background: "#0c0e12",
    card: "#161a22",
    foreground: "#f1f5f9",
    cardForeground: "#f1f5f9",
    primary: "#c9a06a",
    primaryForeground: "#0c0e12",
    border: "rgba(201, 160, 106, 0.22)",
    muted: "#12151c",
    mutedForeground: "rgba(241, 245, 249, 0.55)",
    colorScheme: "dark",
  },
};

export const PRESENTATION_PRESET_MOBILE: Record<string, PresentationColorOverrides> = {
  "platform-default": CONSTELLATION,
  "noir-dusk": {
    background: "#131218",
    card: "#1b1922",
    foreground: "#f5f0f2",
    cardForeground: "#f5f0f2",
    primary: "#d4a5b8",
    primaryForeground: "#131218",
    border: "#2a2630",
    mutedForeground: "#9a8f96",
    colorScheme: "dark",
  },
  "soft-studio": {
    ...BEAUTY_LIGHT_PUBLIC_COLORS["soft-studio"],
    cardForeground: BEAUTY_LIGHT_PUBLIC_COLORS["soft-studio"].foreground,
    primaryForeground: "#ffffff",
    colorScheme: "light",
  },
  editorial: {
    ...BEAUTY_LIGHT_PUBLIC_COLORS.editorial,
    cardForeground: BEAUTY_LIGHT_PUBLIC_COLORS.editorial.foreground,
    primaryForeground: "#ffffff",
    colorScheme: "light",
  },
  "premium-dark": {
    background: "#12100e",
    card: "#1c1916",
    foreground: "#f5f0eb",
    cardForeground: "#f5f0eb",
    primary: "#c9a484",
    primaryForeground: "#12100e",
    border: "#2a2520",
    mutedForeground: "#9a9088",
    colorScheme: "dark",
  },
  "warm-chair": {
    background: "#141210",
    card: "#1e1b17",
    foreground: "#f5f0eb",
    primary: "#a67c52",
    primaryForeground: "#141210",
    border: "#2a2520",
    colorScheme: "dark",
  },
  "event-atelier": {
    background: "#faf7f2",
    card: "#ffffff",
    foreground: "#2a241c",
    cardForeground: "#2a241c",
    primary: "#d97706",
    primaryForeground: "#ffffff",
    border: "#e8dfd0",
    muted: "#f3ede4",
    mutedForeground: "#6b5f52",
    colorScheme: "light",
  },
  "wedding-ledger": {
    background: "#f8f6f3",
    card: "#ffffff",
    foreground: "#3d3832",
    cardForeground: "#3d3832",
    primary: "#7a6a5c",
    primaryForeground: "#ffffff",
    border: "#ddd6cc",
    muted: "#efeae4",
    mutedForeground: "#6b6560",
    colorScheme: "light",
  },
  "party-pop": {
    background: "#fff5f9",
    card: "#ffffff",
    foreground: "#3b1f2b",
    cardForeground: "#3b1f2b",
    primary: "#ec4899",
    primaryForeground: "#ffffff",
    border: "#f9d0e3",
    muted: "#fce8f0",
    mutedForeground: "#9d6b82",
    colorScheme: "light",
  },
  ...WELLNESS_PRESETS,
};

export function resolvePresentationMobileColors(
  cssPreset: string | null | undefined,
  brandAccentHex: string | null | undefined,
  colorModeHint?: "light" | "dark" | null,
): PresentationColorOverrides {
  const preset = cssPreset ?? "platform-default";
  const base = PRESENTATION_PRESET_MOBILE[preset] ?? CONSTELLATION;
  const scheme = colorModeHint ?? resolvePresentationColorMode(preset) ?? base.colorScheme ?? "dark";
  const merged: PresentationColorOverrides = { ...base, colorScheme: scheme };
  if (brandAccentHex) {
    merged.primary = brandAccentHex;
  }
  return merged;
}

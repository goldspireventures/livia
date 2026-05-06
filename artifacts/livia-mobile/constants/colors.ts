/**
 * Livia brand color system, mobile edition.
 * Mirrors artifacts/livia-dashboard/src/index.css token semantics.
 *
 * Two-layer brand:
 *   - Aurora (product surface): midnight base + violet/cyan/mint gradient.
 *     Cyan is the primary action color; violet signals automated/assistant moments.
 *   - Aurum (wordmark accent): champagne/cream/bronze used for the Livia wordmark
 *     and the italic v. Reserved for brand-level moments — never for action buttons.
 */

const aurora = {
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  mint: "#10b981",
  midnight: "#09090b",
};

export const aurum = {
  champagne: "#d9c39a",
  cream: "#f6f3ec",
  bronze: "#8a7549",
  ink: "#0a0a10",
};

const colors = {
  light: {
    text: "#09090b",
    tint: aurora.cyan,
    background: "#fcfcfd",
    foreground: "#09090b",
    card: "#ffffff",
    cardForeground: "#09090b",
    primary: aurora.cyan,
    primaryForeground: "#ffffff",
    secondary: "#f4f4f5",
    secondaryForeground: "#18181b",
    muted: "#f4f4f5",
    mutedForeground: "#71717a",
    accent: "#f4f0ff",
    accentForeground: "#5b21b6",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#e4e4e7",
    input: "#e4e4e7",
    success: aurora.mint,
    warning: "#f59e0b",
    info: aurora.cyan,
    auroraViolet: aurora.violet,
    auroraCyan: aurora.cyan,
    auroraMint: aurora.mint,
  },
  dark: {
    text: "#ffffff",
    tint: aurora.cyan,
    background: aurora.midnight,
    foreground: "#ffffff",
    card: "#111114",
    cardForeground: "#ffffff",
    primary: aurora.cyan,
    primaryForeground: aurora.midnight,
    secondary: "#1c1c20",
    secondaryForeground: "#fafafa",
    muted: "#1c1c20",
    mutedForeground: "#a1a1aa",
    accent: "#1f1535",
    accentForeground: "#c4b5fd",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#222229",
    input: "#222229",
    success: aurora.mint,
    warning: "#f59e0b",
    info: aurora.cyan,
    auroraViolet: aurora.violet,
    auroraCyan: aurora.cyan,
    auroraMint: aurora.mint,
  },
  radius: 12,
};

export { aurora };
export default colors;

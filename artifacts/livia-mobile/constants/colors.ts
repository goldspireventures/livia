/**
 * Livia brand color system, mobile edition.
 * Mirrors artifacts/livia-dashboard/src/index.css token semantics.
 *
 * Two-layer brand:
 *   - Aurora (product surface): nebula accents; cyan/violet for Liv assistant moments.
 *   - Aurum (platform default): champagne primary on constellation ink — matches web.
 */

import { gatewayTheme } from "@/lib/gateway-theme";

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
    text: "#f7f5f0",
    tint: aurum.champagne,
    background: gatewayTheme.platformInk,
    foreground: "#f7f5f0",
    card: "rgba(42, 45, 58, 0.72)",
    cardForeground: "#f7f5f0",
    primary: aurum.champagne,
    primaryForeground: gatewayTheme.platformInk,
    secondary: "#252830",
    secondaryForeground: "#fafafa",
    muted: "#252830",
    mutedForeground: "rgba(247, 245, 240, 0.55)",
    accent: "#1f1535",
    accentForeground: "#c4b5fd",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "rgba(217, 195, 154, 0.18)",
    input: "rgba(217, 195, 154, 0.22)",
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

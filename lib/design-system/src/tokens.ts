/**
 * Shared Livia design tokens (launch-plan E7).
 * Consumed by dashboard, marketing, and mobile for consistent brand surfaces.
 */
export const colors = {
  background: "#0a0a0c",
  foreground: "#fafafa",
  muted: "#a1a1aa",
  auroraCyan: "#06b6d4",
  auroraViolet: "#8b5cf6",
  borderSubtle: "rgba(255,255,255,0.1)",
} as const;

export const radii = {
  card: "1.5rem",
  button: "0.75rem",
} as const;

export const typography = {
  fontSerif: "ui-serif, Georgia, serif",
  fontSans: "ui-sans-serif, system-ui, sans-serif",
} as const;

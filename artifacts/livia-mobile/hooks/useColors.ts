import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 *
 * Per ADR 0008 (mobile motion + materiality), Livia mobile defaults to the
 * **dark** midnight palette so the surface aligns with `livia.io` and the
 * dashboard. Light mode is honoured only when the device explicitly opts in
 * via `light` color-scheme — `null` (no preference) and `dark` both resolve
 * to the dark palette.
 */
export function useColors() {
  const scheme = useColorScheme();
  const isLight = scheme === "light";
  const palette = isLight ? colors.light : colors.dark;
  return { ...palette, radius: colors.radius };
}

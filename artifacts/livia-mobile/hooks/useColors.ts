import { Platform } from "react-native";

import colors, { aurora, aurum } from "@/constants/colors";
import { usePresentationColorOverrides } from "@/contexts/PresentationThemeContext";

/**
 * Returns the design tokens for the current color scheme.
 *
 * Per ADR 0008 (mobile motion + materiality) and the Aurora-Midnight brand
 * system, Livia is a dark-only surface. Both the marketing site and the web
 * dashboard force the dark palette; the mobile app does the same so a user
 * who jumps between phone and laptop never sees the brand "flip".
 *
 * On the Replit web preview specifically, `useColorScheme()` reports the
 * *browser*'s preference (often `"light"`), which would otherwise paint the
 * mobile preview in a non-brand palette. We therefore hard-default to the
 * dark palette across all platforms. If we ever ship a true light mode, it
 * will land behind a user-controlled setting, not a system signal.
 */
export function useColors() {
  // Future: read a persisted user preference here. For now, always dark.
  void Platform.OS; // keep platform import live for future per-platform tweaks
  const presentation = usePresentationColorOverrides();
  const base = { ...colors.dark, radius: colors.radius, aurora, aurum };
  if (!presentation) return base;
  return {
    ...base,
    ...(presentation.background ? { background: presentation.background } : {}),
    ...(presentation.card ? { card: presentation.card } : {}),
    ...(presentation.primary ? { primary: presentation.primary, tint: presentation.primary } : {}),
    ...(presentation.border ? { border: presentation.border } : {}),
    ...(presentation.mutedForeground ? { mutedForeground: presentation.mutedForeground } : {}),
  };
}

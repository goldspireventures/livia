/**
 * Elevation tokens for Livia mobile (ADR 0008).
 *
 * Three levels: resting (default cards), pressed (subtle drop-in on press),
 * floating (sheets, overlays, the next-up CTA). Shadows are tuned for both
 * iOS (soft) and Android (elevation prop). Web ignores elevation; we lean on
 * borders for separation there.
 */
import type { ViewStyle } from "react-native";
import { Platform } from "react-native";

const make = (
  color: string,
  opacity: number,
  radius: number,
  offsetY: number,
  android: number,
): ViewStyle => ({
  ...(Platform.OS === "ios"
    ? {
        shadowColor: color,
        shadowOpacity: opacity,
        shadowRadius: radius,
        shadowOffset: { width: 0, height: offsetY },
      }
    : Platform.OS === "android"
      ? { elevation: android }
      : {}),
});

export const elevation = {
  /** Cards, list rows. Almost imperceptible — depth, not drama. */
  resting: make("#000", 0.18, 10, 4, 1),
  /** When a card is pressed — scaled down + shadow drops. */
  pressed: make("#000", 0.10, 4, 2, 0),
  /** Sheets, modals, the AI-glow on Liv moments. Cyan-tinted. */
  floating: make("#06b6d4", 0.35, 22, 8, 8),
};

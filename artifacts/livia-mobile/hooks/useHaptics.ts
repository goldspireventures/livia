import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Platform } from "react-native";

/**
 * Standardised haptic vocabulary for Livia mobile (ADR 0008).
 *
 * Five patterns — anything more is too noisy. Web is a no-op. Failures
 * are swallowed because haptics are a "nice if it works" signal, never a
 * functional dependency.
 *
 *   selection() — picker / segmented / tab change
 *   tap()       — primary tap on a button or row
 *   impact()    — heavier confirmation (long-press menu open)
 *   success()   — booking confirmed, save succeeded
 *   warning()   — destructive action presented or no-show marked
 */
export function useHaptics() {
  const enabled = Platform.OS !== "web";

  const selection = useCallback(() => {
    if (enabled) Haptics.selectionAsync().catch(() => {});
  }, [enabled]);

  const tap = useCallback(() => {
    if (enabled)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [enabled]);

  const impact = useCallback(() => {
    if (enabled)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [enabled]);

  const success = useCallback(() => {
    if (enabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
  }, [enabled]);

  const warning = useCallback(() => {
    if (enabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
  }, [enabled]);

  return { selection, tap, impact, success, warning };
}

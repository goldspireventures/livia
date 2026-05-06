import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { aurora } from "@/constants/colors";

/**
 * The "Liv pulse" — a small concentric AI dot that breathes whenever Liv is
 * present (suggesting an action, generating a reply, listening). Use this as
 * the *only* visual indicator that the AI is active; do NOT add gradient
 * pills, sparkle icons, or rainbow rings (ADR 0007).
 *
 * - `state="idle"` — slow, calm breath (default for ambient presence)
 * - `state="active"` — faster, brighter (Liv is doing something now)
 */
export function LivPulse({
  size = 14,
  state = "idle",
}: {
  size?: number;
  state?: "idle" | "active";
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    const duration = state === "active" ? 1100 : 2400;
    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [state]);

  const ring = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.18, 0.55]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.85, 1.25]) }],
  }));
  const core = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.85, 1]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.92, 1.05]) }],
  }));

  return (
    <View style={[styles.wrap, { width: size * 2, height: size * 2 }]}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            backgroundColor: aurora.cyan,
          },
          ring,
        ]}
      />
      <Animated.View
        style={[
          styles.core,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: aurora.cyan,
          },
          core,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute" },
  core: {
    shadowColor: aurora.cyan,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});

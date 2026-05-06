import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { aurora } from "@/constants/colors";
import { BREATH_PERIOD_MS } from "@/constants/motion";

export function AuroraHalo({
  tone = "primary",
  size = 360,
  intensity = 1,
  style,
}: {
  tone?: "primary" | "ambient";
  size?: number;
  intensity?: number;
  style?: ViewStyle;
}) {
  const breath = useSharedValue(0.85);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, {
        duration: BREATH_PERIOD_MS / 2,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, []);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
    opacity: breath.value * intensity,
  }));

  // ADR 0007: gradient (cyan→violet→mint) is reserved for AI-moments only.
  // Halo here stays cyan-only (with a softer cyan inner ring) for non-AI
  // surfaces; ambient tone uses champagne for sign-in / onboarding warmth.
  const inner: readonly [string, string, string] =
    tone === "primary"
      ? [aurora.cyan + "55", aurora.cyan + "18", "transparent"]
      : ["#d9c39a55", "#d9c39a14", "transparent"];

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animated]}>
        <LinearGradient
          colors={inner}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", borderRadius: 9999, overflow: "hidden" },
});

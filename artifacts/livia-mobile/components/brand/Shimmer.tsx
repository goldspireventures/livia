import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

/**
 * Skeleton shimmer block. Replaces the bare "ActivityIndicator" pattern on
 * loading states so the empty surface still feels alive.
 *
 * The sweep travels left→right across the block on the UI thread. We tint
 * the sweep with a faint cyan so it reads as Liv-aware, not generic.
 */
export function Shimmer({
  width = "100%",
  height = 14,
  radius = 8,
  style,
}: {
  width?: number | `${number}%` | "100%";
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const colors = useColors();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [-160, 320]) }],
  }));

  return (
    <View
      style={[
        styles.block,
        { width, height, borderRadius: radius, backgroundColor: colors.muted },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, sweep]}>
        <LinearGradient
          colors={["transparent", "rgba(6,182,212,0.18)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { overflow: "hidden" },
});

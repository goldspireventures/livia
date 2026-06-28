import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ConstellationOrbitalMap } from "@/components/constellation/ConstellationOrbitalMap";
import { gatewayTheme } from "@/lib/gateway-theme";
import { BREATH_PERIOD_MS, NEBULA_DRIFT_MS } from "@/constants/motion";

const STARS: Array<{ x: string; y: string; size: number; opacity: number; champagne?: boolean; twinkle?: boolean }> = [
  { x: "4%", y: "8%", size: 2, opacity: 0.6, twinkle: true },
  { x: "12%", y: "22%", size: 2, opacity: 0.36 },
  { x: "18%", y: "68%", size: 3, opacity: 0.48, champagne: true },
  { x: "28%", y: "42%", size: 2, opacity: 0.42 },
  { x: "35%", y: "12%", size: 2, opacity: 0.3 },
  { x: "48%", y: "78%", size: 2, opacity: 0.34 },
  { x: "58%", y: "28%", size: 3, opacity: 0.38, champagne: true, twinkle: true },
  { x: "72%", y: "58%", size: 2, opacity: 0.26 },
  { x: "82%", y: "18%", size: 2, opacity: 0.46 },
  { x: "88%", y: "72%", size: 2, opacity: 0.28 },
  { x: "94%", y: "38%", size: 2, opacity: 0.36, champagne: true },
  { x: "8%", y: "48%", size: 2, opacity: 0.24 },
  { x: "22%", y: "88%", size: 2, opacity: 0.22 },
  { x: "42%", y: "18%", size: 2, opacity: 0.31 },
  { x: "62%", y: "82%", size: 2, opacity: 0.24, champagne: true },
  { x: "76%", y: "32%", size: 2, opacity: 0.29 },
  { x: "52%", y: "52%", size: 1.5, opacity: 0.18 },
  { x: "96%", y: "12%", size: 2, opacity: 0.34, twinkle: true },
];

function ShellStar({
  x,
  y,
  size,
  opacity,
  champagne,
  twinkle,
  delayMs,
}: {
  x: string;
  y: string;
  size: number;
  opacity: number;
  champagne?: boolean;
  twinkle?: boolean;
  delayMs: number;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!twinkle) return;
    pulse.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1.5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.65, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [pulse, twinkle, delayMs]);

  const style = useAnimatedStyle(() => ({
    opacity: twinkle ? opacity * pulse.value : opacity,
    transform: twinkle ? [{ scale: 0.85 + pulse.value * 0.12 }] : undefined,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x as `${number}%`,
          top: y as `${number}%`,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: champagne
            ? `rgba(217,195,154,${opacity})`
            : `rgba(255,255,255,${opacity})`,
        },
        style,
      ]}
    />
  );
}

export function ConstellationShellAtmosphere() {
  const breath = useSharedValue(0.92);
  const violetDrift = useSharedValue(0);
  const cyanDrift = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: BREATH_PERIOD_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    violetDrift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: NEBULA_DRIFT_MS, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: NEBULA_DRIFT_MS, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    cyanDrift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: NEBULA_DRIFT_MS + 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: NEBULA_DRIFT_MS + 4000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [breath, violetDrift, cyanDrift]);

  const nebulaStyle = useAnimatedStyle(() => ({
    opacity: 0.88 + breath.value * 0.22,
  }));

  const violetStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: violetDrift.value * 18 - 9 },
      { translateY: violetDrift.value * 12 - 6 },
    ],
  }));

  const cyanStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cyanDrift.value * -14 + 7 },
      { translateY: cyanDrift.value * 10 - 5 },
    ],
  }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: gatewayTheme.platformInk }]} />
      <LinearGradient
        colors={["#373a48", "#323542", gatewayTheme.platformInk, "#252830"]}
        locations={[0, 0.08, 0.28, 1]}
        style={StyleSheet.absoluteFill}
      />
      {STARS.map((s, i) => (
        <ShellStar
          key={i}
          x={s.x}
          y={s.y}
          size={s.size}
          opacity={s.opacity}
          champagne={s.champagne}
          twinkle={s.twinkle}
          delayMs={(i % 5) * 900}
        />
      ))}
      <Animated.View style={[styles.nebulaViolet, nebulaStyle, violetStyle]}>
        <LinearGradient
          colors={["rgba(139,92,246,0.48)", "rgba(139,92,246,0.16)", "transparent"]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.nebulaCyan, nebulaStyle, cyanStyle]}>
        <LinearGradient
          colors={["rgba(6,182,212,0.22)", "rgba(6,182,212,0.06)", "transparent"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <ConstellationOrbitalMap />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
  nebulaViolet: {
    position: "absolute",
    top: "-8%",
    right: "-6%",
    width: 420,
    height: 320,
    borderRadius: 210,
  },
  nebulaCyan: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 280,
    height: 220,
    borderRadius: 140,
  },
});

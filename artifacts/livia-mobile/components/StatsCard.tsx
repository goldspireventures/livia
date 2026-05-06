import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { elevation } from "@/constants/elevation";
import { SPRING_GENTLE } from "@/constants/motion";
import { type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

interface StatsCardProps {
  label: string;
  value: number | string;
  color?: string;
  subtitle?: string;
  index?: number;
  variant?: "default" | "hero";
}

export function StatsCard({
  label,
  value,
  color,
  subtitle,
  index = 0,
  variant = "default",
}: StatsCardProps) {
  const colors = useColors();
  const accent = color ?? colors.primary;

  // Tween JS state — RN <Text> can't read SharedValues directly.
  const [shown, setShown] = useState<number | string>(
    typeof value === "number" ? 0 : value,
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      setShown(value);
      return;
    }
    const start = Date.now();
    const from = typeof shown === "number" ? shown : 0;
    const to = value;
    const duration = 700;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      setShown(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const dotScale = useSharedValue(0.6);

  useEffect(() => {
    const delay = Math.min(index, 8) * 70;
    opacity.value = withDelay(delay, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withSpring(0, SPRING_GENTLE));
    dotScale.value = withDelay(
      delay + 120,
      withSequence(
        withSpring(1.25, { damping: 8, stiffness: 220 }),
        withSpring(1, { damping: 14, stiffness: 220 }),
      ),
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: variant === "hero" ? accent + "55" : colors.border,
        },
        Platform.OS !== "web" && elevation.resting,
        cardStyle,
      ]}
    >
      <Animated.View style={[styles.dot, { backgroundColor: accent + "26" }, dotStyle]}>
        <View style={[styles.dotInner, { backgroundColor: accent }]} />
      </Animated.View>
      <Text style={[styles.value, { color: colors.foreground }]} numberOfLines={1}>
        {typeof shown === "number" ? shown.toLocaleString() : shown}
      </Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: accent }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    minWidth: 100,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  value: { ...type.numeric, fontSize: 26, letterSpacing: -0.8 },
  label: { ...type.label, fontSize: 12 },
  subtitle: { ...type.caption, fontSize: 11 },
});

import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
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
  onPress?: () => void;
  hint?: string;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function StatsCard({
  label,
  value,
  color,
  subtitle,
  index = 0,
  variant = "default",
  onPress,
  hint,
}: StatsCardProps) {
  const colors = useColors();
  const accent = color ?? colors.primary;
  const isNumeric = typeof value === "number" && Number.isFinite(value);

  // Count-up runs entirely on the UI thread via Reanimated. We bind a
  // SharedValue's text projection to an AnimatedTextInput's `text` prop —
  // the standard worklet-safe pattern for animating numeric strings.
  const tween = useSharedValue(isNumeric ? 0 : 0);

  useEffect(() => {
    if (isNumeric) {
      tween.value = withSpring(value as number, { damping: 22, stiffness: 180, mass: 0.6 });
    }
  }, [value, isNumeric]);

  const text = useDerivedValue(() =>
    isNumeric ? Math.round(tween.value).toLocaleString() : String(value),
  );
  const textProps = useAnimatedProps(() => ({ text: text.value, defaultValue: text.value }));

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

  const inner = (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: variant === "hero" ? accent + "55" : onPress ? accent + "44" : colors.border,
        },
        Platform.OS !== "web" && elevation.resting,
        cardStyle,
      ]}
    >
      <Animated.View style={[styles.dot, { backgroundColor: accent + "26" }, dotStyle]}>
        <View style={[styles.dotInner, { backgroundColor: accent }]} />
      </Animated.View>
      {isNumeric ? (
        <AnimatedTextInput
          editable={false}
          underlineColorAndroid="transparent"
          animatedProps={textProps}
          style={[styles.value, styles.valueInput, { color: colors.foreground }]}
        />
      ) : (
        <Text style={[styles.value, { color: colors.foreground }]} numberOfLines={1}>
          {String(value)}
        </Text>
      )}
      <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: accent }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      {hint ? (
        <Text style={[styles.hint, { color: colors.mutedForeground }]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Animated.View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      style={({ pressed }) => [{ flex: 1, minWidth: 0, opacity: pressed ? 0.92 : 1 }]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    minHeight: 108,
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
  valueInput: { padding: 0, margin: 0, height: 32 },
  label: { ...type.label, fontSize: 12 },
  subtitle: { ...type.caption, fontSize: 11 },
  hint: { ...type.caption, fontSize: 10, marginTop: 2 },
});

import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SPRING_QUICK } from "@/constants/motion";
import { useHaptics } from "@/hooks/useHaptics";

type Props = PressableProps & {
  children: React.ReactNode;
  glowColor?: string;
  style?: StyleProp<ViewStyle>;
  /** Inner layout — default column; pass row for icon + text cards. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Size content wrapper to fill pressable (required for absolute-fill card layouts). */
  fill?: boolean;
  haptic?: "tap" | "selection" | "impact" | "none";
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Touch-native press with scale + optional accent glow ring */
export function GlowPressable({
  children,
  glowColor,
  style,
  contentStyle,
  fill = false,
  haptic = "tap",
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.35);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[style, animStyle]}
      onPressIn={(e) => {
        if (!disabled && haptic !== "none") {
          if (haptic === "selection") haptics.selection();
          else if (haptic === "impact") haptics.impact();
          else haptics.tap();
        }
        scale.value = withSpring(0.97, SPRING_QUICK);
        glow.value = withSpring(0.85, SPRING_QUICK);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING_QUICK);
        glow.value = withSpring(0.35, SPRING_QUICK);
        onPressOut?.(e);
      }}
    >
      {glowColor ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            { shadowColor: glowColor, borderColor: glowColor + "55" },
            glowStyle,
          ]}
        />
      ) : null}
      <View style={[styles.content, fill && styles.fill, contentStyle]}>{children}</View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: "column", alignItems: "stretch" },
  fill: { flex: 1, alignSelf: "stretch" },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 4,
  },
});

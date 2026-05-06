import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { elevation } from "@/constants/elevation";
import { SPRING_GENTLE } from "@/constants/motion";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";

interface CustomerCardProps {
  customer: {
    id: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    totalBookings?: number;
    isBlocked?: boolean;
  };
  index?: number;
  onPress?: () => void;
}

export function CustomerCard({ customer, index = 0, onPress }: CustomerCardProps) {
  const colors = useColors();
  const haptics = useHaptics();
  const displayName =
    customer.displayName ??
    ([customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unknown");
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);
  const press = useSharedValue(1);

  useEffect(() => {
    const delay = Math.min(index, 10) * 40;
    opacity.value = withDelay(delay, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withSpring(0, SPRING_GENTLE));
  }, []);

  const enter = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: press.value }],
  }));

  return (
    <Animated.View style={enter}>
      <Pressable
        onPress={() => {
          haptics.tap();
          onPress?.();
        }}
        onPressIn={() => {
          press.value = withSpring(0.98, { damping: 14, stiffness: 280 });
        }}
        onPressOut={() => {
          press.value = withSpring(1, { damping: 14, stiffness: 280 });
        }}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          Platform.OS !== "web" && elevation.resting,
        ]}
        testID={`customer-card-${customer.id}`}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary + "1f", borderColor: colors.primary + "44" }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.content}>
          <Text
            nativeID={`customer-${customer.id}-name`}
            style={[styles.name, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {displayName}
            {customer.isBlocked ? "  ⛔" : ""}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {customer.email ?? customer.phone ?? "No contact"}
          </Text>
        </View>
        {customer.totalBookings !== undefined && (
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {customer.totalBookings}
          </Text>
        )}
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: { ...type.numericSm, fontSize: 14 },
  content: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.serifMedium, fontSize: 18, letterSpacing: -0.2 },
  sub: { ...type.caption, fontSize: 12.5 },
  count: { ...type.numericSm, fontSize: 13 },
});

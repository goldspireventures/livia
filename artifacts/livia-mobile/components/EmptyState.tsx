import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { Shimmer } from "@/components/brand/Shimmer";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

/**
 * Empty / loading vignette. Loading state shows shimmer skeletons (so the
 * surface still feels alive). Empty state shows a single soft halo behind
 * a feathered icon — no harsh muted-grey circle. Per the brand bible: a
 * blank screen is still a Livia screen, and Livia is never sterile.
 */
export function EmptyState({
  icon = "inbox",
  title,
  subtitle,
  actionLabel,
  onAction,
  isLoading,
}: EmptyStateProps) {
  const colors = useColors();
  const haptics = useHaptics();

  // Subtle drift on the icon itself, ~6s cycle
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);
  const driftStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drift.value }] }));

  if (isLoading) {
    return (
      <View style={styles.skeletonWrap}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.skeletonRow}>
            <Shimmer width={42} height={42} radius={21} />
            <View style={{ flex: 1, gap: 8 }}>
              <Shimmer width="65%" height={14} />
              <Shimmer width="40%" height={11} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.haloWrap}>
        <AuroraHalo tone="primary" size={180} intensity={0.7} style={{ top: -50, left: -50 }} />
        <Animated.View style={[styles.iconWrap, driftStyle]}>
          <Feather name={icon} size={32} color={colors.mutedForeground} />
        </Animated.View>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => {
            haptics.tap();
            onAction();
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 14,
    minHeight: 240,
  },
  haloWrap: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  iconWrap: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  subtitle: { ...type.body, textAlign: "center", maxWidth: 260 },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { ...type.label, fontSize: 14 },
  skeletonWrap: { padding: 16, gap: 14 },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});

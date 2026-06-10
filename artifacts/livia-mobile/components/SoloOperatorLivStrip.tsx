import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { OperatorExperiencePack } from "@workspace/policy";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { asHref } from "@/lib/navigation";
import { useHaptics } from "@/hooks/useHaptics";

export function SoloOperatorLivStrip({
  pack,
}: {
  pack: OperatorExperiencePack | null | undefined;
}) {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  if (!pack?.soloMode) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(380).springify()}
      style={[
        styles.wrap,
        {
          borderColor: colors.primary + "44",
          backgroundColor: colors.primary + "0C",
        },
      ]}
    >
      <View style={styles.head}>
        <Animated.View style={[styles.pulse, { backgroundColor: colors.primary }, pulseStyle]} />
        <Feather name="zap" size={14} color={colors.primary} />
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          {pack.segmentLabel ?? "Today"}
        </Text>
      </View>
      <Text style={[styles.pitch, { color: colors.foreground }]}>{pack.livPitch}</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={2}>
        {pack.livSubline}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {pack.quickActions.map((action) => (
          <GlowPressable
            key={action.id}
            onPress={() => {
              haptics.tap();
              router.push(asHref(action.mobileRoute ?? action.href));
            }}
            glowColor={colors.primary}
            haptic="tap"
            style={[
              styles.chip,
              { borderColor: colors.primary + "55", backgroundColor: colors.card },
            ]}
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>{action.label}</Text>
          </GlowPressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.9,
  },
  eyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    flex: 1,
  },
  pitch: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  sub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, marginBottom: 4 },
  chips: { gap: 8, paddingTop: 4 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12 },
});

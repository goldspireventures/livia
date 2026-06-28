import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { OperatorExperiencePack } from "@workspace/policy";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { asHref } from "@/lib/navigation";
import { useHaptics } from "@/hooks/useHaptics";

export function SoloOperatorFirstRun({
  pack,
}: {
  pack: OperatorExperiencePack | null | undefined;
}) {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();

  if (!pack?.firstRunSteps.length) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(420).springify()}
      style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}
    >
      <View style={styles.head}>
        <Feather name="compass" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {pack.soloMode ? "Get your business live" : "Get something on screen"}
        </Text>
      </View>
      {pack.soloMode ? (
        <Text style={[styles.lede, { color: colors.mutedForeground }]}>
          A short setup list — inbox and reminders follow once your menu and hours are in.
        </Text>
      ) : null}
      <View style={styles.steps}>
        {pack.firstRunSteps.map((step) => (
          <Pressable
            key={step.step}
            onPress={() => {
              haptics.tap();
              router.push(asHref(step.mobileRoute ?? step.href));
            }}
            style={styles.step}
          >
            <View style={[styles.badge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                {step.step}
              </Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepLabel, { color: colors.foreground }]}>{step.label}</Text>
              <Text style={[styles.stepBodyText, { color: colors.mutedForeground }]}>
                {step.body}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontFamily: fonts.serif, fontSize: 18, flex: 1 },
  lede: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  steps: { gap: 12, marginTop: 4 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  badgeText: { fontFamily: fonts.mono, fontSize: 11 },
  stepBody: { flex: 1, gap: 2 },
  stepLabel: { fontFamily: fonts.bodySemi, fontSize: 14 },
  stepBodyText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
});

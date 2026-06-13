import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DEMO_FRESH_FOUNDER_COPY } from "@workspace/policy";
import { fonts } from "@/constants/typography";
import { useHaptics } from "@/hooks/useHaptics";
import { gatewayTheme } from "@/lib/gateway-theme";

/** Cyan founder path — parity with `demo-fresh-founder-shortcut.tsx`. */
export function MobileDemoFreshFounderShortcut() {
  const router = useRouter();
  const haptics = useHaptics();

  return (
    <LinearGradient
      colors={["rgba(6,182,212,0.2)", "rgba(6,78,99,0.25)", "transparent"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { borderColor: "rgba(6,182,212,0.4)" }]}
      testID="demo-fresh-founder-shortcut"
    >
      <View style={{ gap: 6 }}>
        <View style={styles.eyebrowRow}>
          <Feather name="user-plus" size={12} color={gatewayTheme.primaryChampagne} />
          <Text style={styles.eyebrow}>{DEMO_FRESH_FOUNDER_COPY.kicker}</Text>
        </View>
        <Text style={styles.title}>{DEMO_FRESH_FOUNDER_COPY.title}</Text>
        <Text style={styles.body}>{DEMO_FRESH_FOUNDER_COPY.body}</Text>
        <Text style={styles.hint}>{DEMO_FRESH_FOUNDER_COPY.endClientHint}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            haptics.tap();
            router.push("/sign-in" as never);
          }}
          style={styles.primaryBtn}
          testID="demo-fresh-founder-sign-up"
        >
          <Text style={styles.primaryBtnText}>{DEMO_FRESH_FOUNDER_COPY.ctaSignUp}</Text>
          <Feather name="arrow-right" size={14} color="#0c0a09" />
        </Pressable>
        <Pressable
          onPress={() => {
            haptics.selection();
            router.push("/onboarding" as never);
          }}
          style={styles.secondaryBtn}
          testID="demo-fresh-founder-onboarding"
        >
          <Text style={styles.secondaryBtnText}>{DEMO_FRESH_FOUNDER_COPY.ctaOnboarding}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: {
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(34,211,238,0.9)",
  },
  title: { fontSize: 16, fontFamily: fonts.bodySemi, color: "#fff" },
  body: { fontSize: 12, fontFamily: fonts.body, color: "rgba(255,255,255,0.65)", lineHeight: 18 },
  hint: { fontSize: 10, fontFamily: fonts.mono, color: "rgba(255,255,255,0.4)" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: gatewayTheme.primaryChampagne,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  primaryBtnText: { fontSize: 13, fontFamily: fonts.bodySemi, color: "#0c0a09" },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  secondaryBtnText: { fontSize: 13, fontFamily: fonts.bodyMed, color: "rgba(255,255,255,0.88)" },
});

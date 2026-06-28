import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DEMO_GUEST_CLIENT_COPY, GUEST_HUB_COPY } from "@workspace/policy";
import { fonts } from "@/constants/typography";
import { useHaptics } from "@/hooks/useHaptics";
import { gatewayTheme } from "@/lib/gateway-theme";

type Props = {
  embedded?: boolean;
};

/** G1 guest path — parity with web `demo-guest-client-shortcut.tsx` (glass, not rose). */
export function MobileDemoGuestShortcut({ embedded }: Props) {
  const router = useRouter();
  const haptics = useHaptics();

  return (
    <View
      style={[
        styles.wrap,
        embedded ? styles.embedded : styles.standalone,
        { borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)" },
      ]}
      testID="demo-guest-client-shortcut"
    >
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.eyebrowRow}>
            <Feather name="heart" size={12} color="rgba(254,205,211,0.8)" />
            <Text style={styles.eyebrow}>{GUEST_HUB_COPY.productName} · guest</Text>
          </View>
          <Text style={[styles.title, embedded && styles.titleEmbedded]}>{DEMO_GUEST_CLIENT_COPY.title}</Text>
          {!embedded ? (
            <Text style={styles.body}>{DEMO_GUEST_CLIENT_COPY.body}</Text>
          ) : (
            <Text style={styles.hint}>{DEMO_GUEST_CLIENT_COPY.phoneHint}</Text>
          )}
          {!embedded ? (
            <>
              <Text style={styles.hint}>{DEMO_GUEST_CLIENT_COPY.phoneHint}</Text>
              <Text style={styles.hint}>{DEMO_GUEST_CLIENT_COPY.nameHint}</Text>
            </>
          ) : null}
        </View>
        <Pressable
          onPress={() => {
            haptics.tap();
            router.push("/my-livia" as never);
          }}
          testID="demo-guest-client-open"
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.ctaText}>{DEMO_GUEST_CLIENT_COPY.cta}</Text>
          <Feather name="arrow-right" size={14} color="#fff" />
        </Pressable>
      </View>
      {!embedded ? (
        <Text style={styles.footerHint}>
          Opens My Livia in-app — return here to try staff roles too
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  standalone: { marginTop: 24 },
  embedded: { borderRadius: 12, padding: 14 },
  row: { flexDirection: "column", gap: 12 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: {
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: "#fff",
  },
  titleEmbedded: { fontSize: 14 },
  body: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.55)",
  },
  hint: {
    fontSize: 11,
    fontFamily: fonts.mono,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 15,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minHeight: 44,
  },
  ctaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: "#fff",
  },
  footerHint: {
    fontSize: 10,
    fontFamily: fonts.mono,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },
});

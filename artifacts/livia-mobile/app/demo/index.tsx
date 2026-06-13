/**
 * Mobile demo gateway · G1 worlds (parity with dashboard /demo + g1-wedge-web.target.png).
 */

import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { MobileDemoFreshFounderShortcut } from "@/components/demo/MobileDemoFreshFounderShortcut";
import { MobileDemoGuestShortcut } from "@/components/demo/MobileDemoGuestShortcut";
import { MobileDemoReadinessStrip } from "@/components/demo/MobileDemoReadinessStrip";
import { MobileDemoWedgeGrid } from "@/components/demo/MobileDemoWedgeGrid";
import { GatewayG1Ambient } from "@/components/gateway/GatewayG1Ambient";
import { fonts } from "@/constants/typography";
import { useHaptics } from "@/hooks/useHaptics";
import { useDemoWorldStatus } from "@/hooks/useDemoWorldStatus";
import { fetchDemoCatalog } from "@/lib/demo-portal";
import { gatewayTheme } from "@/lib/gateway-theme";
import { asHref } from "@/lib/navigation";

export default function MobileDemoLauncher() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { provisioned, tenants, loading, error, busy, refresh, setup, repair } = useDemoWorldStatus();
  const [devPassword, setDevPassword] = useState<string | undefined>();

  useEffect(() => {
    void fetchDemoCatalog()
      .then((cat) => setDevPassword(cat.sharedPassword ?? cat.devPassword))
      .catch(() => undefined);
  }, []);

  const handleSetup = useCallback(async () => {
    haptics.tap();
    try {
      const result = await setup();
      Alert.alert(
        result.mode === "full" ? "Demo world created" : "Quick sync done",
        result.mode === "full"
          ? `${result.businesses.length} businesses seeded — pick a world next.`
          : "Branding and live-day data refreshed.",
      );
    } catch (e: unknown) {
      Alert.alert("Setup failed", e instanceof Error ? e.message : "Is the API running?");
    }
  }, [haptics, setup]);

  const handleRepair = useCallback(async () => {
    haptics.tap();
    try {
      const result = await repair();
      Alert.alert("Demo repaired", `${result.businesses.length} businesses ready.`);
    } catch (e: unknown) {
      Alert.alert("Repair failed", e instanceof Error ? e.message : "Check API logs");
    }
  }, [haptics, repair]);

  return (
    <View style={styles.root} testID="mobile-demo-launcher">
      <GatewayG1Ambient />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.back}
            testID="mobile-demo-back-entry"
          >
            <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.55)" />
            <Text style={styles.backText}>Home</Text>
          </Pressable>
          <View style={styles.badges}>
            <View style={styles.badgePrimary}>
              <Feather name="lock" size={10} color={gatewayTheme.primaryChampagne} />
              <Text style={styles.badgePrimaryText}>Demo gateway</Text>
            </View>
            <Text style={styles.badgeG1}>G1 locked</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <LiviaWordmark size="lg" color="#fff" />
          <Text style={styles.h1}>
            Pick <Text style={styles.h1Italic}>your</Text> world
          </Text>
          <Text style={styles.lede}>
            Choose a trade to explore as a studio owner, or open My Livia below to try the guest
            experience.
          </Text>
          <Text style={styles.signInHint}>
            {devPassword ? (
              <>
                Shared password: <Text style={styles.signInStrong}>{devPassword}</Text>
                {" · "}
              </>
            ) : null}
            <Text style={styles.signInLink} onPress={() => router.push("/sign-in" as never)}>
              Sign in with your own account
            </Text>
          </Text>
        </View>

        <MobileDemoFreshFounderShortcut />

        <MobileDemoReadinessStrip
          provisioned={provisioned}
          businessCount={tenants.length}
          loading={loading}
          error={error}
          busy={busy}
          onSetup={() => void handleSetup()}
          onRetry={() => void refresh()}
          onRepair={() => void handleRepair()}
        />

        <MobileDemoWedgeGrid />

        <MobileDemoGuestShortcut />

        <Link href={asHref("/demo-guide")} asChild>
          <Pressable style={styles.guideLink}>
            <Text style={styles.guideText}>Demo account emails & spotlight shops → Demo guide</Text>
          </Pressable>
        </Link>

        <Text style={styles.footer}>
          <Text style={styles.footerStrong}>One platform.</Text>{" "}
          <Text style={styles.footerItalic}>Infinite</Text> possibilities.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: gatewayTheme.g1Background },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 12, fontFamily: fonts.mono, color: "rgba(255,255,255,0.55)" },
  badges: { alignItems: "flex-end", gap: 6 },
  badgePrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: `${gatewayTheme.primaryChampagne}66`,
    backgroundColor: `${gatewayTheme.primaryChampagne}1a`,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgePrimaryText: {
    fontSize: 9,
    fontFamily: fonts.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: gatewayTheme.primaryChampagne,
  },
  badgeG1: {
    fontSize: 9,
    fontFamily: fonts.mono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: gatewayTheme.aurumChampagne,
    borderWidth: 1,
    borderColor: `${gatewayTheme.aurumChampagne}66`,
    backgroundColor: `${gatewayTheme.aurumChampagne}1a`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hero: { alignItems: "flex-start", gap: 10, marginBottom: 4 },
  h1: {
    fontFamily: fonts.serifMedium,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.5,
    color: "#fff",
  },
  h1Italic: {
    fontFamily: fonts.serifItalic,
    color: gatewayTheme.primaryChampagne,
  },
  lede: {
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.65)",
    maxWidth: 380,
  },
  signInHint: { fontSize: 12, lineHeight: 18, color: "rgba(255,255,255,0.45)" },
  signInStrong: { color: "rgba(255,255,255,0.72)" },
  signInLink: { color: gatewayTheme.primaryChampagne },
  guideLink: { marginTop: 16, paddingVertical: 8 },
  guideText: {
    fontSize: 12,
    fontFamily: fonts.mono,
    color: "rgba(255,255,255,0.45)",
    textDecorationLine: "underline",
  },
  footer: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 13,
    fontFamily: fonts.serif,
    color: "rgba(255,255,255,0.5)",
    alignSelf: "center",
  },
  footerStrong: { color: "rgba(255,255,255,0.72)" },
  footerItalic: {
    fontFamily: fonts.serifItalic,
    color: gatewayTheme.primaryChampagne,
  },
});

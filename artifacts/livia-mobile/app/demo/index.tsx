/**
 * Mobile demo gateway · G1 worlds (parity with dashboard /demo + g1-wedge-web.target.png).
 */

import { Link, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { MobileDemoFreshFounderShortcut } from "@/components/demo/MobileDemoFreshFounderShortcut";
import { MobileDemoGuestShortcut } from "@/components/demo/MobileDemoGuestShortcut";
import { MobileDemoReadinessStrip } from "@/components/demo/MobileDemoReadinessStrip";
import { MobileDemoWedgeGrid } from "@/components/demo/MobileDemoWedgeGrid";
import {
  GatewayG1Footer,
  GatewayG1Hero,
  GatewayG1Shell,
} from "@/components/gateway/GatewayG1Shell";
import { fonts } from "@/constants/typography";
import { useHaptics } from "@/hooks/useHaptics";
import { useDemoWorldStatus } from "@/hooks/useDemoWorldStatus";
import { fetchDemoCatalog } from "@/lib/demo-portal";
import { gatewayTheme } from "@/lib/gateway-theme";
import { asHref } from "@/lib/navigation";

export default function MobileDemoLauncher() {
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
    <GatewayG1Shell
      testID="mobile-demo-launcher"
      onBack={() => router.back()}
      footer={<GatewayG1Footer />}
    >
      <GatewayG1Hero
        title="Pick"
        titleAccent="your world"
        lede="Choose a trade to explore as a studio owner, or open My Livia below to try the guest experience."
        hint={
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
        }
      />

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
    </GatewayG1Shell>
  );
}

const styles = StyleSheet.create({
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
});

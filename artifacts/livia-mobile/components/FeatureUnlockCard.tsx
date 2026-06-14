import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { featureUnlockCopy, type CommerceFeatureId } from "@workspace/policy";
import { hasEffectiveEntitlement, type EntitlementKey } from "@workspace/entitlements";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useEntitlements } from "@/hooks/useEntitlements";
import { fonts } from "@/constants/typography";
import { aurora } from "@/constants/colors";
import * as WebBrowser from "expo-web-browser";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

const FEATURE_ENTITLEMENT: Record<CommerceFeatureId, EntitlementKey> = {
  consult_first_inbox: "consult_first_inbox",
  quote_generator: "quote_generator",
  milestone_deposits: "milestone_deposits",
  event_prep_lifecycle: "event_prep_lifecycle",
  event_public_site: "consult_first_inbox",
  take_home_retail: "retail_pack",
};

export function useMobileFeatureEntitled(featureId: CommerceFeatureId): boolean {
  const { entitlements } = useEntitlements();
  return hasEffectiveEntitlement([...entitlements] as EntitlementKey[], FEATURE_ENTITLEMENT[featureId]);
}

export function FeatureUnlockGate({
  featureId,
  businessId,
  children,
}: {
  featureId: CommerceFeatureId;
  businessId: string;
  children: React.ReactNode;
}) {
  const entitled = useMobileFeatureEntitled(featureId);
  if (entitled) return <>{children}</>;
  return <FeatureUnlockCard featureId={featureId} businessId={businessId} />;
}

function FeatureUnlockCard({
  featureId,
  businessId,
}: {
  featureId: CommerceFeatureId;
  businessId: string;
}) {
  const colors = useColors();
  const haptics = useHaptics();
  const qc = useQueryClient();
  const copy = featureUnlockCopy(featureId);
  const [loading, setLoading] = useState(false);

  async function unlock() {
    if (!businessId) return;
    setLoading(true);
    haptics.selection();
    try {
      const res = await customFetch<{ url?: string; mode?: string; message?: string }>(
        `/api/businesses/${businessId}/billing/checkout-addon`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addonId: copy.addonId,
            returnPath: copy.successReturnPath,
          }),
        },
      );
      if (res.url) {
        await WebBrowser.openBrowserAsync(res.url);
        return;
      }
      haptics.success();
      void qc.invalidateQueries({ queryKey: ["billing-state", businessId] });
      void qc.invalidateQueries({ queryKey: ["entitlements", businessId] });
    } catch {
      haptics.warning();
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Feather name="lock" size={18} color={aurora.violet} />
        <Text style={[styles.title, { color: colors.foreground }]}>{copy.title}</Text>
      </View>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{copy.description}</Text>
      {copy.bullets.map((b) => (
        <Text key={b} style={[styles.bullet, { color: colors.mutedForeground }]}>
          · {b}
        </Text>
      ))}
      <Pressable
        onPress={() => void unlock()}
        disabled={loading}
        style={[styles.cta, { backgroundColor: aurora.violet, opacity: loading ? 0.6 : 1 }]}
      >
        <Text style={styles.ctaText}>
          {loading ? "Opening checkout…" : `Unlock · ${copy.priceLabel}`}
        </Text>
      </Pressable>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        Or upgrade in web settings: {getDashboardBaseUrl()}/settings?tab=billing
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8, marginVertical: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.bodySemi, fontSize: 16, flex: 1 },
  body: { fontSize: 14, lineHeight: 20 },
  bullet: { fontSize: 13, lineHeight: 18 },
  cta: { marginTop: 8, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  ctaText: { color: "#fff", fontFamily: fonts.bodySemi, fontSize: 15 },
  hint: { fontSize: 11, marginTop: 4 },
});

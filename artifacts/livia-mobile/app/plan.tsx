import { customFetch } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenTopBar } from "@/components/ScreenTopBar";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useBillingSummary } from "@/hooks/useBillingSummary";
import { ADDON_CATALOGUE, formatAddonPriceEur, hasEffectiveEntitlement, type EntitlementKey } from "@workspace/entitlements";
import { commerceAddonsForVertical } from "@workspace/policy";

const UPGRADE_PLANS = [
  { id: "solo" as const, name: "Solo", blurb: "One chair, full Liv on SMS and bookings." },
  { id: "studio" as const, name: "Studio", blurb: "Team, WhatsApp, and manager queue." },
  { id: "chain" as const, name: "Chain", blurb: "Multi-location, Glance, and franchise tools." },
];

export default function PlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const { data, isLoading, refetch } = useBillingSummary(bid);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [checkoutAddon, setCheckoutAddon] = useState<string | null>(null);
  const [error, setError] = useState("");
  const qc = useQueryClient();
  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const applicableAddons = commerceAddonsForVertical(vertical).filter(
    (e) => e.id === "event_operator_pack" || e.id === "retail_pack",
  );

  const startAddonCheckout = async (addonId: string) => {
    if (!bid) return;
    setCheckoutAddon(addonId);
    setError("");
    haptics.tap();
    try {
      const res = await customFetch<{ url?: string; mode?: string; message?: string }>(
        `/api/businesses/${bid}/billing/checkout-addon`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addonId, returnPath: "/plan" }),
        },
      );
      if (res.url) {
        await WebBrowser.openBrowserAsync(res.url);
        await refetch();
        void qc.invalidateQueries({ queryKey: ["entitlements", bid] });
        haptics.success();
        return;
      }
      await refetch();
      haptics.success();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Add-on checkout failed.");
      haptics.warning();
    } finally {
      setCheckoutAddon(null);
    }
  };

  const startCheckout = async (planId: "solo" | "studio" | "chain") => {
    if (!bid) return;
    setCheckoutPlan(planId);
    setError("");
    haptics.tap();
    try {
      const res = await customFetch<{ url?: string; mode?: string; message?: string }>(
        `/api/businesses/${bid}/billing/checkout-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        },
      );
      if (res.url) {
        await WebBrowser.openBrowserAsync(res.url);
        await refetch();
        haptics.success();
        return;
      }
      await refetch();
      haptics.success();
      setError(res.message ?? "Plan updated.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Checkout failed — try again or use web billing.");
      haptics.warning();
    } finally {
      setCheckoutPlan(null);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 16,
      }}
    >
      <ScreenTopBar />
      <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.foreground }]}>Plan & billing</Text>
      <Text style={[styles.lede, { color: colors.mutedForeground }]}>
        Upgrade in-app via Stripe checkout. Your subscription applies to {currentBusiness?.name ?? "this shop"}.
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : data ? (
        <View style={[styles.current, { backgroundColor: colors.card, borderColor: colors.border }, elevation.resting]}>
          <Text style={[styles.currentLabel, { color: colors.mutedForeground }]}>Current plan</Text>
          <Text style={[styles.currentName, { color: colors.foreground }]}>{data.planName}</Text>
          <Text style={[styles.currentMeta, { color: colors.mutedForeground }]}>
            {data.designPartnerActive
              ? "Design partner pricing"
              : data.stripeSubscriptionStatus
                ? `Subscription · ${data.stripeSubscriptionStatus}`
                : data.planId}
          </Text>
          <View style={styles.usageRow}>
            <Text style={[styles.usage, { color: colors.foreground }]}>
              {data.usage.booking_completed ?? 0} bookings
            </Text>
            <Text style={{ color: colors.mutedForeground }}>·</Text>
            <Text style={[styles.usage, { color: colors.foreground }]}>
              {data.usage.sms_message_outbound ?? 0} SMS
            </Text>
          </View>
        </View>
      ) : null}

      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Upgrade</Text>
      {UPGRADE_PLANS.map((p) => {
        const isCurrent = data?.planId === p.id;
        const loading = checkoutPlan === p.id;
        return (
          <Pressable
            key={p.id}
            disabled={isCurrent || !!checkoutPlan}
            onPress={() => void startCheckout(p.id)}
            style={({ pressed }) => [
              styles.planCard,
              {
                backgroundColor: colors.card,
                borderColor: isCurrent ? aurora.cyan + "66" : colors.border,
                opacity: pressed ? 0.92 : 1,
              },
              elevation.resting,
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.planName, { color: colors.foreground }]}>
                {p.name}
                {isCurrent ? " · current" : ""}
              </Text>
              <Text style={[styles.planBlurb, { color: colors.mutedForeground }]}>{p.blurb}</Text>
            </View>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : isCurrent ? (
              <Feather name="check-circle" size={22} color={aurora.cyan} />
            ) : (
              <Feather name="chevron-right" size={20} color={colors.primary} />
            )}
          </Pressable>
        );
      })}

      {applicableAddons.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 16 }]}>
            Add-ons
          </Text>
          {applicableAddons.map((entry) => {
            const catalogue = ADDON_CATALOGUE[entry.id];
            if (!catalogue) return null;
            const entitled = hasEffectiveEntitlement(
              (data?.entitlements ?? []) as EntitlementKey[],
              entry.primaryEntitlement as EntitlementKey,
            );
            const loading = checkoutAddon === entry.id;
            return (
              <Pressable
                key={entry.id}
                disabled={entitled || !!checkoutAddon || !!checkoutPlan}
                onPress={() => void startAddonCheckout(entry.id)}
                style={({ pressed }) => [
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: entitled ? aurora.cyan + "66" : colors.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                  elevation.resting,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: colors.foreground }]}>
                    {catalogue.name}
                    {entitled ? " · active" : ""}
                  </Text>
                  <Text style={[styles.planBlurb, { color: colors.mutedForeground }]}>
                    {catalogue.description}
                  </Text>
                </View>
                {loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : entitled ? (
                  <Feather name="check-circle" size={22} color={aurora.cyan} />
                ) : (
                  <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi, fontSize: 13 }}>
                    {formatAddonPriceEur(catalogue.eurCentsPerMonth)}/mo
                  </Text>
                )}
              </Pressable>
            );
          })}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backText: { fontFamily: fonts.bodySemi, fontSize: 15 },
  title: { fontFamily: fonts.serifMedium, fontSize: 30, marginBottom: 8 },
  lede: { ...type.body, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  current: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20, gap: 6 },
  currentLabel: { ...type.eyebrow, fontSize: 10 },
  currentName: { fontFamily: fonts.serifMedium, fontSize: 24 },
  currentMeta: { fontSize: 13 },
  usageRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  usage: { fontFamily: fonts.bodyMed, fontSize: 13 },
  sectionTitle: { ...type.eyebrow, marginBottom: 10 },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  planName: { fontFamily: fonts.bodySemi, fontSize: 16 },
  planBlurb: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  error: { fontSize: 13, marginBottom: 12 },
});

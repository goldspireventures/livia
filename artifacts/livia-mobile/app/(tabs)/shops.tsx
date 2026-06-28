import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChainPulseBadge, ChainPulseReason } from "@/components/ChainPulseBadge";
import { EmptyState } from "@/components/EmptyState";
import { OperationalScreen } from "@/components/OperationalScreen";
import { Shimmer } from "@/components/brand/Shimmer";
import { aurum } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { usePersona } from "@/hooks/usePersona";
import { useChainRollup } from "@/hooks/useChainRollup";
import { useColors } from "@/hooks/useColors";
import { useContentInsets } from "@/hooks/useContentInsets";
import { useHaptics } from "@/hooks/useHaptics";
import { asHref } from "@/lib/navigation";
import type { ChainShopCommerceSlice, ChainShopRollup } from "@/lib/chain-rollup";
import { getPublicBookingLabel } from "@/lib/public-booking-url";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import * as Linking from "expo-linking";

function verticalLabel(vertical?: string | null): string {
  if (!vertical) return "Business";
  return vertical.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ShopCardSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <Shimmer key={i} height={120} radius={16} />
      ))}
    </View>
  );
}

function ShopRollupCard({
  shop,
  vertical,
  commerce,
  isActive,
  onOpen,
}: {
  shop: ChainShopRollup;
  vertical?: string | null;
  commerce?: ChainShopCommerceSlice;
  isActive: boolean;
  onOpen: () => void;
}) {
  const colors = useColors();
  const inboxWaiting = shop.openConversations + shop.handedOffConversations;
  const hasAlert = shop.pulseStatus !== "ok";

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? aurum.champagne + "55" : colors.border,
        },
        elevation.resting,
        pressed && { opacity: 0.92 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${shop.name}`}
      testID={`shop-card-${shop.businessId}`}
    >
      <View style={styles.logoWrap}>
        <Feather name="home" size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {shop.name}
          </Text>
          <ChainPulseBadge status={shop.pulseStatus} />
        </View>
        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
          {verticalLabel(vertical)}
          {shop.city ? ` · ${shop.city}` : ""}
        </Text>
        <View style={styles.statsRow}>
          <Text style={[styles.statChip, { color: colors.foreground }]}>
            {shop.todayBookings} today
          </Text>
          <Text style={[styles.statChip, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[styles.statChip, { color: colors.foreground }]}>{inboxWaiting} inbox</Text>
          {hasAlert ? (
            <>
              <Text style={[styles.statChip, { color: colors.mutedForeground }]}>·</Text>
              <Feather name="alert-circle" size={12} color={colors.destructive} />
            </>
          ) : null}
        </View>
        <ChainPulseReason reason={shop.pulseReason} />
        {commerce ? (
          <Pressable
            onPress={() => {
              if (commerce.topSignal?.href) {
                void Linking.openURL(`${getDashboardBaseUrl()}${commerce.topSignal.href}`);
              }
            }}
            style={[
              styles.commerceStrip,
              {
                borderColor:
                  commerce.topSignal?.severity === "act"
                    ? colors.destructive + "44"
                    : commerce.topSignal?.severity === "watch"
                      ? "#f59e0b44"
                      : colors.border,
                backgroundColor: colors.muted + "22",
              },
            ]}
          >
            <Feather name="trending-up" size={12} color={colors.mutedForeground} />
            <Text style={[styles.commerceLabel, { color: colors.mutedForeground }]}>30d</Text>
            <Text style={[styles.commerceValue, { color: colors.foreground }]}>
              {commerce.capturedLabel}
            </Text>
            {commerce.topSignal && commerce.topSignal.severity !== "info" ? (
              <Text style={[styles.commerceSignal, { color: colors.destructive }]} numberOfLines={1}>
                · {commerce.topSignal.title}
              </Text>
            ) : commerce.captureRatePercent != null ? (
              <Text style={[styles.commerceSignal, { color: colors.mutedForeground }]}>
                · {commerce.captureRatePercent}% capture
              </Text>
            ) : null}
          </Pressable>
        ) : null}
      </View>
      {isActive ? (
        <Text style={[styles.activePill, { color: aurum.champagne }]}>Active</Text>
      ) : (
        <Feather name="arrow-right" size={18} color={aurum.champagne} />
      )}
    </Pressable>
  );
}

export default function ShopsScreen() {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();
  const { horizontalPad, maxContentWidth } = useContentInsets();
  const { businesses, currentBusiness, setCurrentBusiness } = useBusiness();
  const { kind: persona } = usePersona();
  const isLead = persona === "owner" || persona === "org_admin";
  const useRollup = isLead && businesses.length >= 1;
  const { rollup, loading, reload } = useChainRollup(useRollup);

  const verticalById = React.useMemo(
    () =>
      Object.fromEntries(
        businesses.map((b) => [b.id, (b as { vertical?: string }).vertical ?? null]),
      ),
    [businesses],
  );

  const openShop = useCallback(
    (businessId: string) => {
      const biz = businesses.find((b) => b.id === businessId);
      if (biz) setCurrentBusiness(biz);
      haptics.selection();
      router.push(asHref("/"));
    },
    [businesses, haptics, router, setCurrentBusiness],
  );

  const shops = rollup?.shops ?? [];
  const briefing = rollup?.orgAdminBriefingLine;
  const commerceById = React.useMemo(
    () => Object.fromEntries((rollup?.commerceByShop ?? []).map((c) => [c.businessId, c])),
    [rollup?.commerceByShop],
  );

  return (
    <OperationalScreen
      ritualPage
      title="Your shops"
      subtitle={
        briefing ??
        (businesses.length > 0
          ? `${businesses.length} location${businesses.length === 1 ? "" : "s"} on this account`
          : "When you add locations, pulse and inbox load appear here.")
      }
      refreshing={loading}
      onRefresh={
        useRollup
          ? () => {
              haptics.tap();
              void reload();
            }
          : undefined
      }
      contentStyle={{
        paddingHorizontal: horizontalPad,
        maxWidth: maxContentWidth,
        alignSelf: maxContentWidth ? "center" : undefined,
        width: maxContentWidth ? "100%" : undefined,
        paddingBottom: 140,
        gap: 12,
      }}
    >
      {rollup && rollup.shopsNeedingAttention > 0 ? (
        <View
          style={[
            styles.banner,
            { backgroundColor: colors.destructive + "14", borderColor: colors.destructive + "33" },
          ]}
        >
          <Feather name="alert-circle" size={16} color={colors.destructive} />
          <Text style={[styles.bannerText, { color: colors.foreground }]}>
            {rollup.shopsNeedingAttention} shop{rollup.shopsNeedingAttention === 1 ? "" : "s"} need
            attention
          </Text>
        </View>
      ) : null}

      {loading && useRollup && !rollup ? <ShopCardSkeleton /> : null}

      {useRollup && shops.length > 0
        ? shops.map((shop) => (
            <ShopRollupCard
              key={shop.businessId}
              shop={shop}
              commerce={commerceById[shop.businessId]}
              vertical={verticalById[shop.businessId]}
              isActive={shop.businessId === currentBusiness?.id}
              onOpen={() => openShop(shop.businessId)}
            />
          ))
        : null}

      {!useRollup && businesses.length === 1 ? (
        <EmptyState
          icon="grid"
          title={currentBusiness?.name ?? "Your shop"}
          subtitle="Glance pulse loads for owners with one or more locations. Open Today for your daily briefing."
        />
      ) : null}

      {!useRollup && businesses.length === 0 ? (
        <EmptyState
          icon="grid"
          title="No businesses yet"
          subtitle="Finish onboarding or accept an invite to see your locations here."
        />
      ) : null}

      {!useRollup && businesses.length > 1
        ? businesses.map((b) => {
            const isActive = b.id === currentBusiness?.id;
            return (
              <View
                key={b.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isActive ? aurum.champagne + "55" : colors.border,
                  },
                  elevation.resting,
                ]}
              >
                <View style={styles.logoWrap}>
                  <Feather name="home" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                    {b.name}
                  </Text>
                  <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                    {verticalLabel((b as { vertical?: string }).vertical)}
                  </Text>
                  {b.slug ? (
                    <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                      {getPublicBookingLabel(b.slug)}
                    </Text>
                  ) : null}
                </View>
                {!isActive ? (
                  <Pressable onPress={() => setCurrentBusiness(b)} hitSlop={8}>
                    <Feather name="arrow-right" size={18} color={aurum.champagne} />
                  </Pressable>
                ) : (
                  <Text style={[styles.activePill, { color: aurum.champagne }]}>Active</Text>
                )}
              </View>
            );
          })
        : null}
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  bannerText: { ...type.body, fontSize: 14, flex: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 96,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardName: { fontFamily: fonts.bodySemi, fontSize: 16, flex: 1 },
  cardMeta: { ...type.caption, fontSize: 12 },
  statsRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  statChip: { ...type.caption, fontSize: 12 },
  commerceStrip: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  commerceLabel: { ...type.caption, fontSize: 10, textTransform: "uppercase" },
  commerceValue: { fontFamily: fonts.bodySemi, fontSize: 12 },
  commerceSignal: { ...type.caption, fontSize: 11, flex: 1 },
  activePill: { ...type.eyebrow, fontSize: 10, letterSpacing: 0.6 },
});

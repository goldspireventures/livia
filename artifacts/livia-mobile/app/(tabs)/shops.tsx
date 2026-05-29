import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChainPulseBadge, ChainPulseReason } from "@/components/ChainPulseBadge";
import { EmptyState } from "@/components/EmptyState";
import { OperationalScreen } from "@/components/OperationalScreen";
import { aurum } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useChainRollup } from "@/hooks/useChainRollup";
import { useColors } from "@/hooks/useColors";
import { useContentInsets } from "@/hooks/useContentInsets";
import { useHaptics } from "@/hooks/useHaptics";
import { asHref } from "@/lib/navigation";
import type { ChainShopRollup } from "@/lib/chain-rollup";
import { getPublicBookingLabel } from "@/lib/public-booking-url";

function ShopRollupCard({
  shop,
  isActive,
  onOpen,
}: {
  shop: ChainShopRollup;
  isActive: boolean;
  onOpen: () => void;
}) {
  const colors = useColors();
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
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {shop.name}
          </Text>
          <ChainPulseBadge status={shop.pulseStatus} />
        </View>
        {shop.city ? (
          <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>{shop.city}</Text>
        ) : null}
        <Text style={[styles.cardStats, { color: colors.mutedForeground }]}>
          {shop.todayBookings} today · {shop.pendingBookings} pending · {shop.openConversations} inbox
        </Text>
        <ChainPulseReason reason={shop.pulseReason} />
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
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { horizontalPad, maxContentWidth } = useContentInsets();
  const { businesses, currentBusiness, setCurrentBusiness } = useBusiness();
  const useRollup = businesses.length >= 2;
  const { rollup, loading, reload } = useChainRollup(useRollup);

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
  const briefing = rollup?.founderBriefingLine;

  return (
    <OperationalScreen
      eyebrow="Your rooms"
      title="Glance"
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

      {(rollup?.alerts?.length ?? 0) > 0 ? (
        <View style={[styles.alertsBlock, { borderColor: colors.destructive + "44" }]}>
          <Text style={[styles.alertsTitle, { color: colors.foreground }]}>Cross-shop alerts</Text>
          {rollup!.alerts!.map((a, i) => (
            <Pressable
              key={`${a.businessId}-${a.code}`}
              onPress={() => openShop(a.businessId)}
              style={[
                styles.alertRow,
                i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border } : null,
              ]}
            >
              <Text style={[styles.alertShop, { color: colors.foreground }]}>{a.shopName}</Text>
              <Text style={[styles.alertMsg, { color: colors.mutedForeground }]} numberOfLines={2}>
                {a.message}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {rollup ? (
        <View style={[styles.summaryRow, { borderColor: colors.border }]}>
          <Text style={[styles.summaryStat, { color: colors.foreground }]}>
            {rollup.bookingsThisWeek}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>bookings this week</Text>
          <Text style={[styles.summaryDot, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[styles.summaryStat, { color: colors.foreground }]}>
            {rollup.completedThisWeek}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>completed</Text>
        </View>
      ) : null}

      {loading && useRollup && !rollup ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : null}

      {useRollup && shops.length > 0
        ? shops.map((shop) => (
            <ShopRollupCard
              key={shop.businessId}
              shop={shop}
              isActive={shop.businessId === currentBusiness?.id}
              onOpen={() => openShop(shop.businessId)}
            />
          ))
        : null}

      {!useRollup && businesses.length === 0 ? (
        <EmptyState
          icon="grid"
          title="No businesses yet"
          subtitle="Finish onboarding or accept an invite to see your locations here."
        />
      ) : null}

      {!useRollup
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
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isActive ? aurum.champagne : colors.mutedForeground },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                    {b.name}
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
  root: { flex: 1 },
  content: { paddingBottom: 140, gap: 12 },
  glowWrap: { position: "absolute", top: 0, left: 0, right: 0, height: 320, overflow: "hidden" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  bannerText: { ...type.body, fontSize: 14, flex: 1 },
  alertsBlock: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 4,
  },
  alertsTitle: { fontFamily: fonts.bodySemi, fontSize: 14 },
  alertRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 2,
  },
  alertShop: { fontFamily: fonts.bodySemi, fontSize: 13 },
  alertMsg: { ...type.caption, fontSize: 12 },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  summaryStat: { fontFamily: fonts.bodySemi, fontSize: 18 },
  summaryLabel: { ...type.caption, fontSize: 12 },
  summaryDot: { fontSize: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 8 },
  cardName: { fontFamily: fonts.bodySemi, fontSize: 15, flex: 1 },
  cardMeta: { ...type.caption, fontSize: 12 },
  cardStats: { ...type.caption, fontSize: 12 },
  activePill: { ...type.eyebrow, fontSize: 10, letterSpacing: 0.6 },
});

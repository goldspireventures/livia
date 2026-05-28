import {
  ListBookingsStatus,
  useListBookings,
  type BookingDetail,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { OperationalScreen } from "@/components/OperationalScreen";
import { EmptyState } from "@/components/EmptyState";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { LivProposalsCard } from "@/components/LivProposalsCard";
import { useBusinessTimezone } from "@/hooks/useBusinessTimezone";
import { useLivMandate } from "@/hooks/useLivMandate";
import { pendingApprovalGuidance, pendingReasonLabel } from "@/lib/booking-pending";

function weekWindowIso() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

function formatPriceMinor(currency: string, minor: number): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

function formatStartSummary(iso: string, timeZone: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
  return `${date} · ${time}`;
}

export default function ApprovalsScreen() {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const { timeZone: tz } = useBusinessTimezone();
  const { data: mandateData } = useLivMandate(bid);

  const params = useMemo(
    () => ({
      ...weekWindowIso(),
      status: ListBookingsStatus.PENDING,
      limit: 50,
    }),
    [],
  );

  const { data, isLoading, refetch, isRefetching } = useListBookings(bid, params, {
    query: { enabled: !!bid } as never,
  });

  const rows: BookingDetail[] = data?.data ?? [];

  const totals = useMemo(() => {
    let minorSum = 0;
    let currency = "EUR";
    for (const b of rows) {
      const s = b.service;
      if (s?.priceMinor != null) {
        minorSum += s.priceMinor;
        if (s.currency) currency = s.currency;
      }
    }
    return { minorSum, currency };
  }, [rows]);

  return (
    <OperationalScreen
      eyebrow="Pending confirmations"
      title="Approvals"
      subtitle={
        mandateData?.mandate.rung
          ? `Mandate ${mandateData.mandate.rung}: Liv auto-handles routine work inside your rules. This queue is bookings and actions that still need you.`
          : "Liv approves routine bookings automatically. This queue is edge cases — policy flags, deposits, or anything she is not sure about yet."
      }
      refreshing={isRefetching}
      onRefresh={() => {
        haptics.tap();
        refetch();
      }}
      contentStyle={{ paddingBottom: 140, gap: 14 }}
    >
      {bid ? <LivProposalsCard businessId={bid} /> : null}

      <View
        style={[
          styles.counter,
          { backgroundColor: colors.card, borderColor: aurora.violet + "44" },
          elevation.resting,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={aurora.violet} style={{ paddingVertical: 8 }} />
        ) : (
          <>
            <Text style={[styles.counterNum, { color: colors.foreground }]}>{rows.length}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.counterLabel, { color: colors.mutedForeground }]}>
                pending in the next 7 days
              </Text>
              {rows.length > 0 ? (
                <Text style={[styles.counterMeta, { color: aurora.violet }]}>
                  {formatPriceMinor(totals.currency, totals.minorSum)} total service value at list
                  prices
                </Text>
              ) : (
                <Text style={[styles.counterMeta, { color: colors.mutedForeground }]}>
                  Nothing waiting — you are clear.
                </Text>
              )}
            </View>
          </>
        )}
      </View>

      {isLoading ? (
        <EmptyState icon="shield" title="Loading pending bookings…" isLoading />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="shield"
          title="No pending confirmations"
          subtitle="New requests will land here when clients book and need a yes."
        />
      ) : (
        rows.map((row) => {
          const name =
            row.customer?.displayName ??
            ([row.customer?.firstName, row.customer?.lastName].filter(Boolean).join(" ") ||
              "Client");
          const serviceName = row.service?.name ?? "Service";
          const staffName = row.staff?.displayName;
          const price =
            row.service?.priceMinor != null && row.service?.currency
              ? formatPriceMinor(row.service.currency, row.service.priceMinor)
              : null;
          const reason = (row as { pendingReason?: string | null }).pendingReason;
          const reasonLine = pendingReasonLabel(reason);
          const guide = pendingApprovalGuidance(reason);

          return (
            <Pressable
              key={row.id}
              onPress={() => {
                haptics.tap();
                router.push(`/booking/${row.id}`);
              }}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.92 },
              ]}
            >
              <View style={[styles.rowAccent, { backgroundColor: aurora.violet }]} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                    {name}
                  </Text>
                  {price ? (
                    <Text style={[styles.rowAmount, { color: aurora.violet }]}>{price}</Text>
                  ) : null}
                </View>
                <Text style={[styles.rowAsk, { color: colors.foreground }]} numberOfLines={2}>
                  {serviceName}
                  {staffName ? ` · ${staffName}` : ""}
                </Text>
                <Text style={[styles.rowFlag, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {formatStartSummary(row.startAt, tz)}
                </Text>
                {reasonLine ? (
                  <Text style={[styles.rowWhy, { color: colors.warning }]} numberOfLines={2}>
                    {reasonLine}
                  </Text>
                ) : null}
                <Text style={[styles.rowGuide, { color: colors.mutedForeground }]} numberOfLines={3}>
                  {guide}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          );
        })
      )}

      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
        This queue is your live PENDING bookings. Refunds and policy exceptions stay in your ops
        tools until they ship here.
      </Text>
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  sub: { ...type.body, fontSize: 14, marginTop: 2 },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  counterNum: { fontFamily: fonts.serifMedium, fontSize: 42, letterSpacing: -1 },
  counterLabel: { ...type.body, fontSize: 13 },
  counterMeta: { ...type.numericSm, fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    overflow: "hidden",
  },
  rowAccent: { width: 3, alignSelf: "stretch", borderRadius: 2 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowName: { fontFamily: fonts.bodySemi, fontSize: 15, flex: 1 },
  rowAmount: { ...type.numericSm, fontSize: 14, marginLeft: 8 },
  rowAsk: { ...type.body, fontSize: 13.5 },
  rowFlag: { ...type.caption, fontSize: 11 },
  rowWhy: { fontFamily: fonts.bodyMed, fontSize: 12, marginTop: 4 },
  rowGuide: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  footnote: { ...type.caption, fontSize: 11, textAlign: "center", marginTop: 16, opacity: 0.7 },
});

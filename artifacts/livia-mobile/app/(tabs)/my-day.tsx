// STAFF-first landing on mobile. Owners can navigate here too via a
// future entry point, but the tab bar only surfaces it for STAFF.

import { Feather } from "@expo/vector-icons";
import { useGetMyDay } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { usePreviewStaffId } from "@/hooks/usePreviewStaffId";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { OperationalScreen } from "@/components/OperationalScreen";
import { Shimmer } from "@/components/brand/Shimmer";
import { EmptyState } from "@/components/EmptyState";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { useBusinessTimezone } from "@/hooks/useBusinessTimezone";

export default function MyDayScreen() {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const { timeZone: businessTz, formatTime, formatLongDateNow } = useBusinessTimezone();
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const { staffId: previewStaffId, staffName, isPreview, loading: previewLoading } =
    usePreviewStaffId();

  const { data, isLoading, refetch, isRefetching } = useGetMyDay(
    bid,
    previewStaffId ? { staffId: previewStaffId } : undefined,
    {
      query: { enabled: !!bid && (!isPreview || !!previewStaffId), staleTime: 30_000 } as never,
    },
  );

  const next = data?.next ?? null;
  const nextRelative = useRelativeTime(next?.startAt);

  const subtitle = isPreview && staffName
    ? `Viewing ${staffName}'s chair (owner preview)`
    : data
      ? data.todayCount === 0
        ? "Nothing on the books today."
        : `${data.todayCount} today · ${data.weekCount} more this week`
      : formatLongDateNow(clock);

  return (
    <OperationalScreen
      eyebrow={formatLongDateNow(clock)}
      title="My chair"
      subtitle={subtitle}
      refreshing={isRefetching}
      onRefresh={() => {
        haptics.tap();
        refetch();
      }}
      contentStyle={{ paddingBottom: 100 }}
      headerExtra={
        <>
          {isPreview && !previewStaffId && !previewLoading ? (
            <Text style={[styles.sub, { color: colors.destructive }]}>
              No staff on this shop yet — add team on web or pick another business.
            </Text>
          ) : null}
        </>
      }
    >
      {/* Up next */}
      {!isLoading && next ? (
        <Pressable
          onPress={() => {
            haptics.tap();
            router.push(`/booking/${next.id}`);
          }}
        >
          <View
            style={[
              styles.nextCard,
              { backgroundColor: colors.card, borderColor: colors.aurora.cyan + "44" },
              elevation.floating,
            ]}
          >
            <View style={styles.nextRow}>
              <Text style={[styles.nextEyebrow, { color: colors.aurora.cyan }]}>UP NEXT</Text>
              <View style={styles.nextTimes}>
                {nextRelative ? (
                  <Text style={[styles.nextCountdown, { color: colors.aurora.cyan }]}>{nextRelative}</Text>
                ) : null}
                <Text style={[styles.nextTime, { color: colors.foreground }]}>
                  {formatTime(next.startAt)}
                </Text>
              </View>
            </View>
            <Text style={[styles.nextName, { color: colors.foreground }]} numberOfLines={1}>
              {next.customer?.displayName ?? "Walk-in"}
            </Text>
            <Text style={[styles.nextSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {next.service?.name ?? "Appointment"}
            </Text>
          </View>
        </Pressable>
      ) : null}

      {/* Rest of week */}
      {!isLoading && (data?.week?.length ?? 0) > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My week</Text>
          <Text style={[styles.weekHint, { color: colors.mutedForeground }]}>
            {data!.weekCount} upcoming after today
          </Text>
          {data!.week.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => {
                haptics.tap();
                router.push(`/booking/${b.id}`);
              }}
            >
              <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.rowMain}>
                  <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                    {b.customer?.displayName ?? "Walk-in"}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {formatTime(b.startAt)} · {b.service?.name ?? "Appointment"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Today's slate */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today</Text>
        {isLoading ? (
          <>
            <Shimmer height={64} radius={14} />
            <Shimmer height={64} radius={14} />
          </>
        ) : !data?.today.length ? (
          <EmptyState
            icon="calendar"
            title="All clear"
            subtitle={
              data?.staffId
                ? "Nothing on your slate today."
                : "Your account isn't linked to a staff row yet — ask your manager to link it."
            }
          />
        ) : (
          data.today.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => {
                haptics.tap();
                router.push(`/booking/${b.id}`);
              }}
            >
              <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.rowTime}>
                  <Text style={[styles.rowTimeText, { color: colors.foreground }]}>
                    {formatTime(b.startAt)}
                  </Text>
                  <Text style={[styles.rowTimeSub, { color: colors.mutedForeground }]}>
                    {formatTime(b.endAt)}
                  </Text>
                </View>
                <View style={styles.rowMain}>
                  <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                    {b.customer?.displayName ?? "Walk-in"}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {b.service?.name ?? "Appointment"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* My customers */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My customers</Text>
        {isLoading ? (
          <Shimmer height={64} radius={14} />
        ) : !data?.myCustomers.length ? (
          <EmptyState
            icon="users"
            title="No customers yet"
            subtitle="They'll show up here as you work through bookings."
          />
        ) : (
          data.myCustomers.slice(0, 20).map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                haptics.tap();
                router.push(`/customer/${c.id}`);
              }}
            >
              <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.rowMain}>
                  <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                    {c.displayName ?? "Unnamed"}
                  </Text>
                  {c.email ? (
                    <Text style={[styles.rowSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {c.email}
                    </Text>
                  ) : null}
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 140, gap: 22 },
  glowWrap: { position: "absolute", top: 0, left: 0, right: 0, height: 320, overflow: "hidden" },
  headerBlock: { gap: 6 },
  greeting: { ...type.label, fontSize: 13 },
  title: { fontFamily: fonts.serifMedium, fontSize: 38, lineHeight: 44, letterSpacing: -0.6 },
  sub: { ...type.body, fontSize: 14 },
  nextCard: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 6 },
  nextRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nextEyebrow: { ...type.eyebrow, fontSize: 10 },
  nextTimes: { flexDirection: "row", alignItems: "center", gap: 10 },
  nextCountdown: { ...type.numericSm, fontSize: 12, letterSpacing: 0.4 },
  nextTime: { ...type.numericSm, fontSize: 14 },
  nextName: { fontFamily: fonts.serifMedium, fontSize: 24, letterSpacing: -0.3 },
  nextSub: { ...type.body, fontSize: 14 },
  section: { gap: 10 },
  sectionTitle: { fontFamily: fonts.serifMedium, fontSize: 22, letterSpacing: -0.3 },
  weekHint: { ...type.caption, fontSize: 12, marginTop: -4, marginBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowTime: { width: 70 },
  rowTimeText: { ...type.numericSm, fontSize: 15 },
  rowTimeSub: { ...type.caption, fontSize: 11 },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: fonts.bodySemi, fontSize: 15 },
  rowSub: { ...type.caption, fontSize: 12, marginTop: 2 },
});

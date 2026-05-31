// STAFF-first landing on mobile — w4.staff.my-day.mobile

import { Feather } from "@expo/vector-icons";
import { useGetMyDay } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { usePreviewStaffId } from "@/hooks/usePreviewStaffId";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import {
  bookingDurationMinutes,
  staffClientFirstName,
  staffMyDayHeroLabel,
} from "@/lib/staff-my-day-helpers";
import { notifyBookingRunningLate, promptRunningLateMinutes } from "@/lib/running-late";

type MyDayBooking = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes?: string | null;
  customer?: { displayName: string | null } | null;
  service?: { name: string; durationMinutes?: number | null } | null;
};

function HeroSkeleton() {
  return (
    <View style={{ gap: 10 }}>
      <Shimmer height={200} radius={20} />
      <Shimmer height={56} radius={14} />
      <Shimmer height={56} radius={14} />
      <Shimmer height={56} radius={14} />
      <Shimmer height={56} radius={14} />
    </View>
  );
}

function QuickActionsBar({
  booking,
  businessId,
  colors,
  bottomInset,
}: {
  booking: MyDayBooking;
  businessId: string;
  colors: ReturnType<typeof useColors>;
  bottomInset: number;
}) {
  const router = useRouter();
  const haptics = useHaptics();
  const canRunLate = booking.status === "CONFIRMED" || booking.status === "PENDING";

  return (
    <View
      style={[
        styles.actionsBar,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.background + "F2",
          paddingBottom: Math.max(bottomInset, 12),
        },
      ]}
    >
      <Pressable
        style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => {
          haptics.tap();
          router.push("/(tabs)/inbox");
        }}
      >
        <Feather name="message-circle" size={18} color={colors.foreground} />
        <Text style={[styles.actionLabel, { color: colors.foreground }]}>Message</Text>
      </Pressable>
      <Pressable
        style={[
          styles.actionBtn,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
            opacity: canRunLate ? 1 : 0.45,
          },
        ]}
        disabled={!canRunLate}
        onPress={() => {
          if (!canRunLate) return;
          haptics.tap();
          promptRunningLateMinutes((minutes) => {
            void notifyBookingRunningLate(businessId, booking.id, minutes);
          });
        }}
      >
        <Feather name="clock" size={18} color={colors.foreground} />
        <Text style={[styles.actionLabel, { color: colors.foreground }]}>Running late</Text>
      </Pressable>
      <Pressable
        style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => {
          haptics.tap();
          router.push(`/booking/${booking.id}`);
        }}
      >
        <Feather name="file-text" size={18} color={colors.foreground} />
        <Text style={[styles.actionLabel, { color: colors.foreground }]}>View detail</Text>
      </Pressable>
    </View>
  );
}

export default function MyDayScreen() {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const vertical = (currentBusiness as { vertical?: string } | null)?.vertical ?? null;
  const { formatTime, formatLongDateNow } = useBusinessTimezone();
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

  const next = (data?.next ?? null) as MyDayBooking | null;
  const nextRelative = useRelativeTime(next?.startAt);
  const today = (data?.today ?? []) as MyDayBooking[];

  const restOfToday = useMemo(
    () => today.filter((b) => b.id !== next?.id).slice(0, 6),
    [today, next?.id],
  );

  const subtitle = isPreview && staffName
    ? `Viewing ${staffName}'s chair (owner preview)`
    : data
      ? data.todayCount === 0
        ? "Nothing on the books today."
        : `${data.todayCount} today · ${data.weekCount} more this week`
      : formatLongDateNow(clock);

  const emptyChair = !isLoading && data && data.todayCount === 0 && !!data.staffId;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <OperationalScreen
        eyebrow={formatLongDateNow(clock)}
        title="My chair"
        subtitle={subtitle}
        refreshing={isRefetching}
        onRefresh={() => {
          haptics.tap();
          refetch();
        }}
        contentStyle={{ paddingBottom: next ? 100 + insets.bottom : 24 }}
        headerExtra={
          isPreview && !previewStaffId && !previewLoading ? (
            <Text style={[styles.sub, { color: colors.destructive }]}>
              No staff on this shop yet — add team on web or pick another business.
            </Text>
          ) : null
        }
      >
        {isLoading ? (
          <HeroSkeleton />
        ) : !data?.staffId ? (
          <View style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
              Your account isn&apos;t linked to a staff row yet — ask your manager to link it.
            </Text>
          </View>
        ) : (
          <>
            {next ? (
              <Pressable
                onPress={() => {
                  haptics.tap();
                  router.push(`/booking/${next.id}`);
                }}
              >
                <View
                  style={[
                    styles.heroCard,
                    {
                      borderColor: colors.primary + "44",
                      backgroundColor: colors.card,
                    },
                    elevation.floating,
                  ]}
                >
                  <View style={styles.heroTop}>
                    <Text style={[styles.heroEyebrow, { color: colors.primary }]}>
                      {staffMyDayHeroLabel(vertical)}
                    </Text>
                    {nextRelative ? (
                      <Text style={[styles.heroCountdown, { color: colors.primary }]}>{nextRelative}</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.heroName, { color: colors.foreground }]} numberOfLines={1}>
                    {staffClientFirstName(next.customer?.displayName)}
                  </Text>
                  <Text style={[styles.heroService, { color: colors.foreground }]} numberOfLines={1}>
                    {next.service?.name ?? "Appointment"}
                    {(() => {
                      const mins = bookingDurationMinutes(
                        next.startAt,
                        next.endAt,
                        next.service?.durationMinutes,
                      );
                      return mins > 0 ? ` · ${mins} min` : "";
                    })()}
                  </Text>
                  <View style={[styles.timePill, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={[styles.timePillText, { color: colors.foreground }]}>
                      {formatTime(next.startAt)}
                      {(() => {
                        const mins = bookingDurationMinutes(
                          next.startAt,
                          next.endAt,
                          next.service?.durationMinutes,
                        );
                        return mins > 0 ? ` · ${mins} min` : "";
                      })()}
                    </Text>
                  </View>
                  {next.notes?.trim() ? (
                    <View style={[styles.notesBanner, { borderColor: "#d9770644", backgroundColor: "#fef3c7" }]}>
                      <Feather name="alert-triangle" size={14} color="#92400e" />
                      <Text style={styles.notesText} numberOfLines={2}>
                        {next.notes.trim()}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ) : emptyChair ? (
              <EmptyState
                icon="calendar"
                title="Your day is open"
                subtitle="Walk-ins welcome — check the floor calendar or ask front desk."
              />
            ) : null}

            {restOfToday.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Rest of today</Text>
                <View style={[styles.timeline, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  {restOfToday.map((b) => (
                    <Pressable
                      key={b.id}
                      onPress={() => {
                        haptics.tap();
                        router.push(`/booking/${b.id}`);
                      }}
                    >
                      <View style={[styles.timelineRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.timelineTime, { color: colors.foreground }]}>
                          {formatTime(b.startAt)}
                        </Text>
                        <View style={styles.timelineMain}>
                          <Text style={[styles.timelineName, { color: colors.foreground }]} numberOfLines={1}>
                            {staffClientFirstName(b.customer?.displayName)}
                          </Text>
                          <Text style={[styles.timelineSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {b.service?.name ?? "Appointment"}
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </OperationalScreen>

      {next && bid ? (
        <QuickActionsBar
          booking={next}
          businessId={bid}
          colors={colors}
          bottomInset={insets.bottom}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sub: { ...type.body, fontSize: 14 },
  notice: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  noticeText: { ...type.body, fontSize: 14, textAlign: "center" },
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 6, marginBottom: 8 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroEyebrow: { ...type.eyebrow, fontSize: 11, letterSpacing: 1.4 },
  heroCountdown: { ...type.numericSm, fontSize: 12 },
  heroName: { fontFamily: fonts.serifMedium, fontSize: 32, lineHeight: 36, letterSpacing: -0.4, marginTop: 4 },
  heroService: { ...type.body, fontSize: 16, marginTop: 2 },
  timePill: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timePillText: { ...type.numericSm, fontSize: 14 },
  notesBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  notesText: { flex: 1, ...type.body, fontSize: 14, color: "#92400e", lineHeight: 18 },
  section: { marginTop: 20, gap: 10 },
  sectionTitle: { ...type.eyebrow, fontSize: 13, letterSpacing: 1.1 },
  timeline: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timelineTime: { width: 64, ...type.numericSm, fontSize: 15 },
  timelineMain: { flex: 1, minWidth: 0 },
  timelineName: { fontFamily: fonts.bodySemi, fontSize: 15 },
  timelineSub: { ...type.caption, fontSize: 12, marginTop: 2 },
  actionsBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  actionLabel: { fontFamily: fonts.bodySemi, fontSize: 11 },
});

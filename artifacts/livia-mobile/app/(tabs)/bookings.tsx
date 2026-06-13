import { useListBookings, useUpdateBooking } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  LayoutChangeEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookingCard } from "@/components/BookingCard";
import { OperationalScreen } from "@/components/OperationalScreen";
import { EmptyState } from "@/components/EmptyState";
import { QuickActionsSheet, type QuickAction } from "@/components/QuickActionsSheet";
import { SwipeableRow } from "@/components/SwipeableRow";
import { elevation } from "@/constants/elevation";
import { SPRING_QUICK } from "@/constants/motion";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useTenantExperience } from "@/hooks/useTenantExperience";
import { pendingApprovalsEmptyHint, pendingApprovalsEmptyLine, verticalOperationalCopy } from "@workspace/policy";
import {
  MobileBookingsMorphHeader,
  MobileBookingsMorphLayout,
} from "@/components/bookings/MobileBookingsMorphLayout";
import { usePresentationMorph } from "@/hooks/usePresentationMorph";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { notifyBookingRunningLate, promptRunningLateMinutes } from "@/lib/running-late";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { useManualRefresh } from "@/lib/manual-refresh";

type Filter = "day" | "week" | "month";
type StatusFilter = "all" | "PENDING";

function getDateParams(filter: Filter) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  if (filter === "day") {
    end.setHours(23, 59, 59, 999);
  } else if (filter === "week") {
    end.setDate(end.getDate() + 7);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return { from: start.toISOString(), to: end.toISOString() };
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export default function BookingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const qc = useQueryClient();
  const { currentBusiness } = useBusiness();
  const bizVertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const pack = verticalPackUi(bizVertical, currentBusiness?.category);
  const opCopy = verticalOperationalCopy(bizVertical, currentBusiness?.category);
  const roomsTitle = opCopy.bookingsPageTitle;
  const { nativeMorph } = usePresentationMorph();
  const params = useLocalSearchParams<{ status?: string }>();
  const [filter, setFilter] = useState<Filter>("day");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (params.status === "PENDING") setStatusFilter("PENDING");
  }, [params.status]);

  const indicator = useSharedValue({ x: 0, w: 0 });
  const [layouts, setLayouts] = useState<Record<Filter, { x: number; w: number }>>(
    {} as Record<Filter, { x: number; w: number }>,
  );

  const onChipLayout = (key: Filter) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((prev) => {
      const next = { ...prev, [key]: { x, w: width } };
      if (key === filter && (indicator.value.w === 0 || indicator.value.x !== x)) {
        indicator.value = { x, w: width };
      }
      return next;
    });
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(indicator.value.x, SPRING_QUICK) }],
    width: withSpring(indicator.value.w, SPRING_QUICK),
  }));

  const selectFilter = (key: Filter) => {
    haptics.selection();
    setFilter(key);
    const l = layouts[key];
    if (l) indicator.value = { x: l.x, w: l.w };
  };

  const { mutateAsync: updateBooking } = useUpdateBooking();
  const [actionsFor, setActionsFor] = useState<null | { id: string; status: string; name: string }>(null);

  const advanceStatus = async (bookingId: string, current: string) => {
    if (!currentBusiness?.id) return;
    const next =
      current === "PENDING" ? "CONFIRMED" : current === "CONFIRMED" ? "COMPLETED" : null;
    if (!next) {
      haptics.warning();
      Alert.alert("Already settled", `This booking is ${current.toLowerCase()}.`);
      return;
    }
    try {
      await updateBooking({
        businessId: currentBusiness.id,
        bookingId,
        data: { status: next as "CONFIRMED" | "COMPLETED" },
      });
      invalidateOperationalState(qc, currentBusiness.id);
      haptics.success();
    } catch (err: unknown) {
      const e = err as { message?: string };
      haptics.warning();
      Alert.alert("Error", e?.message ?? "Could not update booking");
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!currentBusiness?.id) return;
    try {
      await updateBooking({
        businessId: currentBusiness.id,
        bookingId,
        data: { status: "CANCELLED" },
      });
      invalidateOperationalState(qc, currentBusiness.id);
      haptics.success();
    } catch (err: unknown) {
      const e = err as { message?: string };
      haptics.warning();
      Alert.alert("Error", e?.message ?? "Could not cancel booking");
    }
  };

  const { data, isLoading, refetch } = useListBookings(
    currentBusiness?.id ?? "",
    {
      ...getDateParams(filter),
      limit: 50,
      ...(statusFilter === "PENDING" ? { status: "PENDING" as const } : {}),
    },
    {
      query: {
        enabled: !!currentBusiness?.id,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
      } as never,
    },
  );

  const bookings = data?.data ?? [];
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  const useMorphList = Boolean(nativeMorph);
  const { refreshing: pullRefreshing, onRefresh: onPullRefresh } = useManualRefresh(refetch);

  const renderSwipeRow = (
    item: (typeof bookings)[number],
    index: number,
    inner: React.ReactNode,
  ) => (
    <SwipeableRow
      onSwipeRight={() => advanceStatus(item.id, item.status)}
      onSwipeLeft={() => router.push(`/booking/${item.id}?intent=reschedule`)}
      rightLabel={
        item.status === "PENDING"
          ? "Confirm"
          : item.status === "CONFIRMED"
            ? "Done"
            : "—"
      }
      leftLabel="Reschedule"
    >
      {inner}
    </SwipeableRow>
  );

  return (
    <OperationalScreen
      scroll={false}
      ritualPage
      title={roomsTitle}
      subtitle={
        statusFilter === "PENDING"
          ? `Sessions that need confirmation — ${opCopy.bookingsPageSubtitle}`
          : "Swipe right to advance status · left to reschedule"
      }
      actions={
        <Pressable
          onPress={() => {
            haptics.impact();
            router.push("/booking/new");
          }}
          testID="add-booking-button"
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
            elevation.floating,
          ]}
        >
          <Feather name="plus" size={14} color={colors.primaryForeground} />
          <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>New</Text>
        </Pressable>
      }
      headerExtra={
        <>
          <View style={styles.statusRow}>
            {(["all", "PENDING"] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => {
                  haptics.selection();
                  setStatusFilter(s);
                }}
                style={[
                  styles.statusChip,
                  {
                    borderColor: statusFilter === s ? colors.primary : colors.border,
                    backgroundColor: statusFilter === s ? colors.primary + "18" : colors.card,
                  },
                ]}
              >
                <Text style={{ color: colors.foreground, fontFamily: fonts.bodySemi, fontSize: 13 }}>
                  {s === "all" ? "All statuses" : "Pending only"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            style={[
              styles.segWrap,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Animated.View
              style={[
                styles.segIndicator,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.primary + "44",
                  shadowColor: colors.primary,
                },
                indicatorStyle,
              ]}
            />
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                style={styles.segChip}
                onPress={() => selectFilter(f.key)}
                onLayout={onChipLayout(f.key)}
                testID={`filter-${f.key}`}
              >
                <Text
                  style={[
                    styles.segText,
                    { color: filter === f.key ? colors.foreground : colors.mutedForeground },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      }
    >
      {nativeMorph ? (
        <MobileBookingsMorphHeader
          morph={nativeMorph}
          pendingCount={pendingCount}
          completedCount={completedCount}
          total={bookings.length}
          accent={colors.primary}
        />
      ) : null}
      {useMorphList && nativeMorph ? (
        <ScrollView
          contentContainerStyle={[styles.list, bookings.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={onPullRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {bookings.length === 0 ? (
            <EmptyState
              icon="calendar"
              title={isLoading ? "Loading…" : "No appointments in this view"}
              subtitle={
                isLoading
                  ? undefined
                  : statusFilter === "PENDING"
                    ? `${pendingApprovalsEmptyLine()} ${pendingApprovalsEmptyHint()}`
                    : `No ${pack.serviceNoun.toLowerCase()}s for this period. Try week view or tap + to book.`
              }
              isLoading={isLoading}
            />
          ) : (
            <MobileBookingsMorphLayout
              morph={nativeMorph}
              bookings={bookings}
              accent={colors.primary}
              timeZone={currentBusiness?.timezone}
              showDate={filter !== "day"}
              pendingCount={pendingCount}
              completedCount={completedCount}
              onPress={(id) => router.push(`/booking/${id}`)}
              onLongPress={(id, status, name) => setActionsFor({ id, status, name })}
              renderSwipeRow={renderSwipeRow}
            />
          )}
        </ScrollView>
      ) : (
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        renderItem={({ item, index }) => {
          const customerName =
            item.customer?.displayName ?? item.customer?.firstName ?? "Walk-in";
          return renderSwipeRow(
            item,
            index,
            <BookingCard
              booking={item}
              timeZone={currentBusiness?.timezone}
              showDate={filter !== "day"}
              index={index}
              onPress={() => router.push(`/booking/${item.id}`)}
              onLongPress={() =>
                setActionsFor({ id: item.id, status: item.status, name: customerName })
              }
            />,
          );
        }}
        contentContainerStyle={[
          styles.list,
          bookings.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title={isLoading ? "Loading…" : "No appointments in this view"}
            subtitle={
              isLoading
                ? undefined
                : statusFilter === "PENDING"
                  ? `${pendingApprovalsEmptyLine()} ${pendingApprovalsEmptyHint()}`
                  : `No ${pack.serviceNoun.toLowerCase()}s for this period. Try week view or tap + to book.`
            }
            isLoading={isLoading}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={onPullRefresh}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={bookings.length > 0}
      />
      )}

      <QuickActionsSheet
        visible={!!actionsFor}
        onClose={() => setActionsFor(null)}
        title={actionsFor ? actionsFor.name.toUpperCase() : undefined}
        actions={
          actionsFor
            ? buildBookingQuickActions(actionsFor, {
                onAdvance: () => advanceStatus(actionsFor.id, actionsFor.status),
                onOpen: () => router.push(`/booking/${actionsFor.id}`),
                onCancel: () => cancelBooking(actionsFor.id),
                onRunningLate:
                  actionsFor.status === "CONFIRMED" && currentBusiness?.id
                    ? () =>
                        promptRunningLateMinutes((m) =>
                          void notifyBookingRunningLate(currentBusiness.id, actionsFor.id, m),
                        )
                    : undefined,
              })
            : []
        }
      />
    </OperationalScreen>
  );
}

function buildBookingQuickActions(
  ctx: { id: string; status: string; name: string },
  fns: {
    onAdvance: () => void;
    onOpen: () => void;
    onCancel: () => void;
    onRunningLate?: () => void;
  },
): QuickAction[] {
  const actions: QuickAction[] = [];
  if (ctx.status === "PENDING") {
    actions.push({ id: "confirm", label: "Confirm booking", icon: "check-circle", tone: "primary", onPress: fns.onAdvance });
  } else if (ctx.status === "CONFIRMED") {
    actions.push({ id: "complete", label: "Mark complete", icon: "check-circle", tone: "primary", onPress: fns.onAdvance });
    if (fns.onRunningLate) {
      actions.push({ id: "late", label: "Running late", icon: "clock", onPress: fns.onRunningLate });
    }
  }
  actions.push({ id: "open", label: "Open details", icon: "chevron-right", onPress: fns.onOpen });
  if (ctx.status !== "CANCELLED" && ctx.status !== "COMPLETED") {
    actions.push({ id: "cancel", label: "Cancel booking", icon: "x-circle", tone: "danger", onPress: fns.onCancel });
  }
  return actions;
}

const SEG_PAD_H = 4;

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 36,
    letterSpacing: -0.6,
    lineHeight: 42,
  },
  pendingHint: { ...type.caption, fontSize: 12 },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodySemi,
    letterSpacing: 0.3,
  },
  segWrap: {
    flexDirection: "row",
    marginBottom: 12,
    padding: SEG_PAD_H,
    borderRadius: 14,
    borderWidth: 1,
    position: "relative",
  },
  segIndicator: {
    position: "absolute",
    top: SEG_PAD_H,
    bottom: SEG_PAD_H,
    left: 0,
    borderRadius: 10,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  segChip: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  segText: {
    ...type.label,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  list: { paddingHorizontal: 20, paddingBottom: 140 },
  listEmpty: { flex: 1 },
});

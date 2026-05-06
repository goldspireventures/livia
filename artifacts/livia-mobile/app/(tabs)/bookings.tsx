import { useListBookings, useUpdateBooking } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  LayoutChangeEvent,
  Platform,
  Pressable,
  RefreshControl,
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
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { EmptyState } from "@/components/EmptyState";
import { QuickActionsSheet, type QuickAction } from "@/components/QuickActionsSheet";
import { SwipeableRow } from "@/components/SwipeableRow";
import { elevation } from "@/constants/elevation";
import { SPRING_QUICK } from "@/constants/motion";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";

type Filter = "day" | "week" | "month";

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
  const { currentBusiness } = useBusiness();
  const [filter, setFilter] = useState<Filter>("day");

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
      haptics.success();
    } catch (err: unknown) {
      const e = err as { message?: string };
      haptics.warning();
      Alert.alert("Error", e?.message ?? "Could not cancel booking");
    }
  };

  const { data, isLoading, refetch, isRefetching } = useListBookings(
    currentBusiness?.id ?? "",
    { ...getDateParams(filter), limit: 50 },
    { query: { enabled: !!currentBusiness?.id } as any },
  );

  const bookings = data?.data ?? [];
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerTop}>
          <LiviaWordmark size="sm" color={colors.foreground} />
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
            <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>
              New
            </Text>
          </Pressable>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Bookings</Text>
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

      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        renderItem={({ item, index }) => {
          const customerName =
            item.customer?.displayName ?? item.customer?.firstName ?? "Walk-in";
          return (
            <SwipeableRow
              onSwipeRight={() => advanceStatus(item.id, item.status)}
              onSwipeLeft={() =>
                router.push(`/booking/${item.id}?intent=reschedule`)
              }
              rightLabel={
                item.status === "PENDING"
                  ? "Confirm"
                  : item.status === "CONFIRMED"
                    ? "Done"
                    : "—"
              }
              leftLabel="Reschedule"
            >
              <BookingCard
                booking={item}
                showDate={filter !== "day"}
                index={index}
                onPress={() => router.push(`/booking/${item.id}`)}
                onLongPress={() =>
                  setActionsFor({ id: item.id, status: item.status, name: customerName })
                }
              />
            </SwipeableRow>
          );
        }}
        contentContainerStyle={[
          styles.list,
          bookings.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title={isLoading ? "Loading…" : "Nothing here"}
            subtitle={isLoading ? undefined : "Try a different filter, or add one above."}
            isLoading={isLoading}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={bookings.length > 0}
      />

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
              })
            : []
        }
      />
    </View>
  );
}

function buildBookingQuickActions(
  ctx: { id: string; status: string; name: string },
  fns: { onAdvance: () => void; onOpen: () => void; onCancel: () => void },
): QuickAction[] {
  const actions: QuickAction[] = [];
  if (ctx.status === "PENDING") {
    actions.push({ id: "confirm", label: "Confirm booking", icon: "check-circle", tone: "primary", onPress: fns.onAdvance });
  } else if (ctx.status === "CONFIRMED") {
    actions.push({ id: "complete", label: "Mark complete", icon: "check-circle", tone: "primary", onPress: fns.onAdvance });
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
    marginHorizontal: 16,
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
  list: { paddingHorizontal: 16, paddingBottom: 140 },
  listEmpty: { flex: 1 },
});

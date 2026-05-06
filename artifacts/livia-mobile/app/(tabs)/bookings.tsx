import { useListBookings } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { elevation } from "@/constants/elevation";
import { SPRING_QUICK } from "@/constants/motion";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";

type Filter = "upcoming" | "today" | "past" | "all";

function getDateParams(filter: Filter) {
  const now = new Date();
  if (filter === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }
  if (filter === "upcoming") return { from: now.toISOString() };
  if (filter === "past") return { to: now.toISOString() };
  return {};
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "today", label: "Today" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
];

export default function BookingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { currentBusiness } = useBusiness();
  const [filter, setFilter] = useState<Filter>("upcoming");

  // Spring-animated segmented indicator. We measure each chip's layout once
  // and spring the indicator's translateX/width to the active chip.
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
        renderItem={({ item, index }) => (
          <BookingCard
            booking={item}
            showDate={filter !== "today"}
            index={index}
            onPress={() => router.push(`/booking/${item.id}`)}
          />
        )}
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
    </View>
  );
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

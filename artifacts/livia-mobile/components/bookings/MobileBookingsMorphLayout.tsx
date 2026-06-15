import { Feather } from "@expo/vector-icons";
import type { PresentationLayoutMorph } from "@workspace/policy";
import { bookingsMorphBandLine, presentationLayoutMorphLabel } from "@workspace/policy";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BookingCard } from "@/components/BookingCard";
import type { BookingDetail } from "@workspace/api-client-react";
import { fonts } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

type BookingRow = BookingDetail;

type Props = {
  morph: PresentationLayoutMorph | null;
  bookings: BookingRow[];
  accent: string;
  timeZone?: string;
  showDate: boolean;
  pendingCount: number;
  completedCount: number;
  onPress: (id: string) => void;
  onLongPress: (id: string, status: string, name: string) => void;
  renderSwipeRow: <T extends BookingRow>(item: T, index: number, inner: React.ReactNode) => React.ReactNode;
};

function formatTime(iso: string, tz?: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
}

export function MobileBookingsMorphHeader({
  morph,
  pendingCount,
  completedCount,
  total,
  accent,
  vertical,
  category,
}: {
  morph: PresentationLayoutMorph | null;
  pendingCount: number;
  completedCount: number;
  total: number;
  accent: string;
  vertical?: string | null;
  category?: string | null;
}) {
  const colors = useColors();
  if (!morph) return null;

  const morphBand = bookingsMorphBandLine(morph, vertical, category);

  return (
    <Animated.View entering={FadeInDown.duration(320)} style={styles.headerWrap}>
      <Text style={[styles.eyebrow, { color: accent }]}>
        {presentationLayoutMorphLabel(morph)} · calendar structure
      </Text>

      {morph === "cockpit" ? (
        <View style={styles.metricsRow} testID="bookings-morph-cockpit-metrics">
          {[
            ["Floor", total],
            ["Pending", pendingCount],
            ["Done", completedCount],
          ].map(([label, val]) => (
            <View
              key={label}
              style={[styles.metric, { borderColor: accent + "44", backgroundColor: accent + "10" }]}
            >
              <Text style={[styles.metricVal, { color: accent }]}>{val}</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {morphBand ? (
        <View
          style={[styles.band, { borderColor: accent + "33", backgroundColor: accent + "08" }]}
          testID={`bookings-morph-${morph}-band`}
        >
          <Feather
            name={morph === "ledger" ? "book-open" : "layers"}
            size={14}
            color={accent}
          />
          <Text style={[styles.bandText, { color: colors.foreground }]}>{morphBand}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

export function MobileBookingsMorphLayout({
  morph,
  bookings,
  accent,
  timeZone,
  showDate,
  pendingCount,
  onPress,
  onLongPress,
  renderSwipeRow,
}: Props) {
  const colors = useColors();

  if (morph === "menu-card") {
    return (
      <View style={styles.menuGrid} testID="bookings-morph-menu-card">
        {bookings.map((item, index) => {
          const name = item.customer?.displayName ?? item.customer?.firstName ?? "Walk-in";
          const inner = (
            <Pressable
              onPress={() => onPress(item.id)}
              onLongPress={() => onLongPress(item.id, item.status, name)}
              style={[styles.menuCard, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Text style={[styles.menuTime, { color: colors.mutedForeground }]}>
                {formatTime(item.startAt, timeZone)}
              </Text>
              <Text style={[styles.menuService, { color: colors.foreground }]} numberOfLines={2}>
                {item.service?.name ?? "Treatment"}
              </Text>
              <Text style={[styles.menuGuest, { color: colors.mutedForeground }]} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          );
          return <View key={item.id}>{renderSwipeRow(item, index, inner)}</View>;
        })}
      </View>
    );
  }

  if (morph === "timeline-rail") {
    return (
      <View style={styles.timeline} testID="bookings-morph-timeline-rail">
        <View style={[styles.timelineRail, { backgroundColor: accent + "44" }]} />
        {bookings.map((item, index) => {
          const name = item.customer?.displayName ?? item.customer?.firstName ?? "Walk-in";
          const active = index === 0;
          const inner = (
            <View style={styles.timelineRow}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    borderColor: active ? accent : colors.border,
                    backgroundColor: active ? accent : colors.background,
                  },
                ]}
              />
              <Pressable
                onPress={() => onPress(item.id)}
                onLongPress={() => onLongPress(item.id, item.status, name)}
                style={[
                  styles.timelineCard,
                  {
                    borderColor: active ? accent + "66" : colors.border,
                    backgroundColor: active ? accent + "10" : colors.card,
                  },
                ]}
              >
                <Text style={[styles.menuTime, { color: colors.mutedForeground }]}>
                  {formatTime(item.startAt, timeZone)}
                </Text>
                <Text style={[styles.menuService, { color: colors.foreground }]}>{item.service?.name}</Text>
                <Text style={[styles.menuGuest, { color: colors.mutedForeground }]}>{name}</Text>
              </Pressable>
            </View>
          );
          return <View key={item.id}>{renderSwipeRow(item, index, inner)}</View>;
        })}
      </View>
    );
  }

  if (morph === "cockpit") {
    const queue = bookings.slice(0, 12);
    return (
      <View testID="bookings-morph-cockpit">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cockpitScroll}>
          {queue.map((item, index) => {
            const name = item.customer?.displayName ?? item.customer?.firstName ?? "Walk-in";
            const inner = (
              <Pressable
                onPress={() => onPress(item.id)}
                onLongPress={() => onLongPress(item.id, item.status, name)}
                style={[
                  styles.cockpitCard,
                  {
                    borderColor: index === 0 ? accent : colors.border,
                    backgroundColor: index === 0 ? accent + "14" : colors.card,
                  },
                ]}
              >
                <Text style={[styles.menuTime, { color: colors.mutedForeground }]}>
                  {formatTime(item.startAt, timeZone)}
                </Text>
                <Text style={[styles.menuService, { color: colors.foreground }]} numberOfLines={1}>
                  {item.service?.name}
                </Text>
                <Text style={[styles.menuGuest, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {name}
                </Text>
              </Pressable>
            );
            return (
              <View key={item.id} style={styles.cockpitCardWrap}>
                {renderSwipeRow(item, index, inner)}
              </View>
            );
          })}
        </ScrollView>
        {bookings.length > queue.length ? (
          <Text style={[styles.moreHint, { color: colors.mutedForeground }]}>
            +{bookings.length - queue.length} more in list view
          </Text>
        ) : null}
      </View>
    );
  }

  if (morph === "split-inbox") {
    const pending = bookings.filter((b) => b.status === "PENDING");
    const floor = bookings.filter((b) => b.status !== "PENDING");
    const renderSection = (title: string, rows: BookingRow[], id: string) => (
      <View style={styles.section} testID={`bookings-morph-section-${id}`}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
        {rows.map((item, index) => {
          const name = item.customer?.displayName ?? item.customer?.firstName ?? "Walk-in";
          const inner = (
            <View
              style={{
                borderLeftWidth: 3,
                borderLeftColor: item.status === "PENDING" ? accent : colors.border,
              }}
            >
              <BookingCard
                booking={item}
                timeZone={timeZone}
                showDate={showDate}
                index={index}
                onPress={() => onPress(item.id)}
                onLongPress={() => onLongPress(item.id, item.status, name)}
              />
            </View>
          );
          return <View key={item.id}>{renderSwipeRow(item, index, inner)}</View>;
        })}
      </View>
    );
    return (
      <View testID="bookings-morph-split-inbox">
        {pending.length > 0 ? renderSection("Confirm first", pending, "pending") : null}
        {floor.length > 0 ? renderSection("On the floor", floor, "floor") : null}
      </View>
    );
  }

  if (morph === "atrium" || morph === "ledger") {
    const groups =
      morph === "atrium"
        ? bookings.reduce<Record<string, BookingRow[]>>((acc, b) => {
            const key = b.staff?.displayName ?? "Unassigned";
            (acc[key] ??= []).push(b);
            return acc;
          }, {})
        : {
            "Prepaid & pending": bookings.filter((b) => b.status === "PENDING"),
            "On the floor": bookings.filter((b) => b.status !== "PENDING"),
          };

    return (
      <View testID={`bookings-morph-${morph}`}>
        {Object.entries(groups).map(([title, rows]) =>
          rows.length === 0 ? null : (
            <View key={title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
              {rows.map((item, index) => {
                const name = item.customer?.displayName ?? item.customer?.firstName ?? "Walk-in";
                const inner = (
                  <BookingCard
                    booking={item}
                    timeZone={timeZone}
                    showDate={showDate}
                    index={index}
                    onPress={() => onPress(item.id)}
                    onLongPress={() => onLongPress(item.id, item.status, name)}
                  />
                );
                return <View key={item.id}>{renderSwipeRow(item, index, inner)}</View>;
              })}
            </View>
          ),
        )}
      </View>
    );
  }

  if (morph === "constellation") {
    return (
      <View testID="bookings-morph-constellation">
        {bookings.map((item, index) => {
          const name = item.customer?.displayName ?? item.customer?.firstName ?? "Walk-in";
          const inner = (
            <View
              style={[
                styles.constellationCard,
                {
                  borderColor: "rgba(217,195,154,0.28)",
                  backgroundColor: "rgba(42,45,58,0.52)",
                },
              ]}
            >
              <BookingCard
                booking={item}
                timeZone={timeZone}
                showDate={showDate}
                index={index}
                onPress={() => onPress(item.id)}
                onLongPress={() => onLongPress(item.id, item.status, name)}
              />
            </View>
          );
          return <View key={item.id}>{renderSwipeRow(item, index, inner)}</View>;
        })}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  headerWrap: { marginBottom: 12, gap: 10 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  metricsRow: { flexDirection: "row", gap: 8 },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  metricVal: { fontFamily: fonts.bodySemi, fontSize: 18 },
  metricLabel: { fontFamily: fonts.mono, fontSize: 9, marginTop: 2, textTransform: "uppercase" },
  band: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  bandText: { flex: 1, fontFamily: fonts.bodyMed, fontSize: 13, lineHeight: 18 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  menuCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 100,
  },
  menuTime: { fontFamily: fonts.mono, fontSize: 10 },
  menuService: { fontFamily: fonts.bodySemi, fontSize: 15, marginTop: 6 },
  menuGuest: { fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  timeline: { paddingLeft: 8, position: "relative" },
  timelineRail: { position: "absolute", left: 18, top: 8, bottom: 8, width: 2 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 14 },
  timelineCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12 },
  cockpitScroll: { gap: 10, paddingBottom: 8 },
  cockpitCardWrap: { width: 168 },
  cockpitCard: { borderWidth: 1, borderRadius: 14, padding: 12, minHeight: 96 },
  moreHint: { fontFamily: fonts.mono, fontSize: 10, marginTop: 8, textAlign: "center" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  constellationCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden", marginBottom: 4 },
});

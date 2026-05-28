import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { elevation } from "@/constants/elevation";
import { SPRING_GENTLE } from "@/constants/motion";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { pendingReasonLabel } from "@/lib/booking-pending";
import { formatShortDateInZone, formatTimeInZone, resolveBusinessTimeZone } from "@/lib/datetime";
import { StatusBadge } from "./StatusBadge";

interface BookingCardProps {
  /** IANA zone from `Business.timezone`; falls back to device when omitted. */
  timeZone?: string;
  booking: {
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    customer?: { displayName?: string | null; firstName?: string | null } | null;
    staff?: { displayName?: string | null } | null;
    service?: { name?: string | null } | null;
    notes?: string | null;
    pendingReason?: string | null;
  };
  showDate?: boolean;
  index?: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function BookingCard({
  booking,
  timeZone: timeZoneProp,
  showDate = false,
  index = 0,
  onPress,
  onLongPress,
}: BookingCardProps) {
  const colors = useColors();
  const haptics = useHaptics();
  const timeZone = resolveBusinessTimeZone(timeZoneProp ? { timezone: timeZoneProp } : null);
  const c = booking.customer;
  const customerName = c?.displayName ?? c?.firstName ?? "Walk-in";
  const serviceName = booking.service?.name ?? "Service";
  const staffName = booking.staff?.displayName;

  // Entry stagger
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);
  // Press scale
  const press = useSharedValue(1);

  useEffect(() => {
    const delay = Math.min(index, 8) * 50;
    opacity.value = withDelay(delay, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withSpring(0, SPRING_GENTLE));
  }, []);

  const enter = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: press.value }],
  }));

  return (
    <Animated.View style={enter}>
      <Pressable
        onPress={() => {
          haptics.tap();
          onPress?.();
        }}
        onLongPress={
          onLongPress
            ? () => {
                haptics.impact();
                onLongPress();
              }
            : undefined
        }
        delayLongPress={350}
        onPressIn={() => {
          press.value = withSpring(0.98, { damping: 14, stiffness: 280 });
        }}
        onPressOut={() => {
          press.value = withSpring(1, { damping: 14, stiffness: 280 });
        }}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          Platform.OS !== "web" && elevation.resting,
        ]}
        testID={`booking-card-${booking.id}`}
      >
        <View style={styles.left}>
          <View style={[styles.timeBar, { backgroundColor: colors.primary }]} />
          <View>
            <Text style={[styles.timeText, { color: colors.foreground }]}>
              {formatTimeInZone(booking.startAt, timeZone)}
            </Text>
            {showDate && (
              <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                {formatShortDateInZone(booking.startAt, timeZone)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              nativeID={`booking-${booking.id}-name`}
              style={[styles.name, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {customerName}
            </Text>
            <StatusBadge status={booking.status} />
          </View>
          <Text style={[styles.service, { color: colors.mutedForeground }]} numberOfLines={1}>
            {serviceName}
            {staffName ? ` · ${staffName}` : ""}
          </Text>
          {booking.status === "PENDING" && booking.pendingReason ? (
            <Text style={[styles.pendingReason, { color: colors.primary }]} numberOfLines={1}>
              {pendingReasonLabel(booking.pendingReason)}
            </Text>
          ) : null}
          {booking.notes ? (
            <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={1}>
              {booking.notes}
            </Text>
          ) : null}
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
    gap: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 76,
  },
  timeBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  timeText: { ...type.numericSm, fontSize: 14 },
  dateText: { ...type.caption, fontSize: 11, marginTop: 2 },
  content: { flex: 1, gap: 3 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { fontFamily: fonts.serifMedium, fontSize: 18, letterSpacing: -0.2, flex: 1 },
  service: { ...type.body, fontSize: 13 },
  pendingReason: { ...type.caption, fontSize: 12 },
  notes: { ...type.caption, fontStyle: "italic" },
});

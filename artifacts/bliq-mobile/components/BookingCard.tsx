import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "./StatusBadge";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface BookingCardProps {
  booking: {
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    customer?: { displayName?: string | null; firstName?: string | null } | null;
    staff?: { displayName?: string | null } | null;
    service?: { name?: string | null } | null;
    notes?: string | null;
  };
  showDate?: boolean;
  onPress?: () => void;
}

export function BookingCard({ booking, showDate = false, onPress }: BookingCardProps) {
  const colors = useColors();
  const c = booking.customer;
  const customerName = c?.displayName ?? c?.firstName ?? "Walk-in";
  const serviceName = booking.service?.name ?? "Service";
  const staffName = booking.staff?.displayName;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
      testID={`booking-card-${booking.id}`}
    >
      <View style={styles.left}>
        <View style={[styles.timeBar, { backgroundColor: colors.primary }]} />
        <View style={styles.timeBlock}>
          <Text style={[styles.timeText, { color: colors.primary }]}>
            {formatTime(booking.startAt)}
          </Text>
          {showDate && (
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              {formatDate(booking.startAt)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {customerName}
          </Text>
          <StatusBadge status={booking.status} />
        </View>
        <Text style={[styles.service, { color: colors.mutedForeground }]} numberOfLines={1}>
          {serviceName}
          {staffName ? ` · ${staffName}` : ""}
        </Text>
        {booking.notes ? (
          <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={1}>
            {booking.notes}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
    gap: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 72,
  },
  timeBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  timeBlock: {},
  timeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  dateText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  service: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  notes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
});

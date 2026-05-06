import { useGetBooking, useUpdateBooking } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useBusiness } from "@/contexts/BusinessContext";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/hooks/useColors";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(startAt: string, endAt: string) {
  const mins = Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

const STATUS_ACTIONS: Record<string, Array<{ label: string; next: string; danger?: boolean }>> = {
  PENDING:   [{ label: "Confirm", next: "CONFIRMED" }, { label: "Cancel", next: "CANCELLED", danger: true }],
  CONFIRMED: [{ label: "Mark Complete", next: "COMPLETED" }, { label: "No-show", next: "NO_SHOW" }, { label: "Cancel", next: "CANCELLED", danger: true }],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW:   [],
};

export default function BookingDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentBusiness } = useBusiness();

  const { data: booking, isLoading, refetch } = useGetBooking(
    currentBusiness?.id ?? "",
    id ?? "",
    { query: { enabled: !!currentBusiness?.id && !!id } as any }
  );

  const { mutateAsync: updateBooking, isPending } = useUpdateBooking();

  const handleStatusChange = async (nextStatus: string) => {
    if (!currentBusiness?.id || !booking?.id) return;
    const action = () =>
      updateBooking({
        businessId: currentBusiness.id,
        bookingId: booking.id,
        data: { status: nextStatus as "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" },
      })
        .then(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          refetch();
        })
        .catch((err: unknown) => {
          const e = err as { message?: string };
          Alert.alert("Error", e?.message ?? "Could not update booking");
        });

    if (nextStatus === "CANCELLED") {
      Alert.alert("Cancel Booking", "Are you sure?", [
        { text: "Keep", style: "cancel" },
        { text: "Cancel Booking", style: "destructive", onPress: action },
      ]);
    } else {
      await action();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <EmptyState icon="alert-circle" title="Booking not found" subtitle="It may have been deleted" />
    );
  }

  const actions = STATUS_ACTIONS[booking.status] ?? [];
  const detail = booking as typeof booking & {
    customer?: { displayName?: string | null; firstName?: string | null; email?: string | null; phone?: string | null } | null;
    staff?: { displayName?: string | null } | null;
    service?: { name?: string | null } | null;
  };
  const customer = detail.customer;
  const staff = detail.staff;
  const service = detail.service;
  const customerName = customer?.displayName ?? customer?.firstName ?? "Walk-in";

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <StatusBadge status={booking.status} />
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatDuration(booking.startAt, booking.endAt)}
          </Text>
        </View>
        <Text style={[styles.dateTime, { color: colors.foreground }]}>
          {formatDateTime(booking.startAt)}
        </Text>
      </View>

      {customer && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CLIENT</Text>
          <Text style={[styles.value, { color: colors.foreground }]}>{customerName}</Text>
          {customer?.email && (
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>{customer.email}</Text>
          )}
          {customer?.phone && (
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>{customer.phone}</Text>
          )}
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SERVICE</Text>
        <Text style={[styles.value, { color: colors.foreground }]}>
          {service?.name ?? "Unknown service"}
        </Text>
        {staff && (
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            with {staff.displayName}
          </Text>
        )}
      </View>

      {booking.notes ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTES</Text>
          <Text style={[styles.value, { color: colors.foreground }]}>{booking.notes}</Text>
        </View>
      ) : null}

      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.next}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: a.danger ? colors.destructive : colors.primary,
                  opacity: isPending ? 0.6 : 1,
                },
              ]}
              onPress={() => handleStatusChange(a.next)}
              disabled={isPending}
              activeOpacity={0.85}
              testID={`action-${a.next.toLowerCase()}`}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionText}>{a.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  time: { fontSize: 13, fontFamily: "Inter_500Medium" },
  dateTime: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 4 },
  value: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  actions: { gap: 10, marginTop: 4 },
  actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  actionText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

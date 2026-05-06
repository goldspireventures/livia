import { useGetBooking, useUpdateBooking } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
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
  return m ? `${h}h ${m}m` : `${h}h`;
}

const STATUS_ACTIONS: Record<string, Array<{ label: string; next: string; danger?: boolean }>> = {
  PENDING:   [{ label: "Confirm", next: "CONFIRMED" }, { label: "Cancel", next: "CANCELLED", danger: true }],
  CONFIRMED: [{ label: "Mark complete", next: "COMPLETED" }, { label: "No-show", next: "NO_SHOW" }, { label: "Cancel", next: "CANCELLED", danger: true }],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW:   [],
};

export default function BookingDetailScreen() {
  const colors = useColors();
  const haptics = useHaptics();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentBusiness } = useBusiness();

  const { data: booking, isLoading, refetch } = useGetBooking(
    currentBusiness?.id ?? "",
    id ?? "",
    { query: { enabled: !!currentBusiness?.id && !!id } as any },
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
          haptics.success();
          refetch();
        })
        .catch((err: unknown) => {
          const e = err as { message?: string };
          haptics.warning();
          Alert.alert("Error", e?.message ?? "Could not update booking");
        });

    if (nextStatus === "CANCELLED") {
      haptics.warning();
      Alert.alert("Cancel booking", "Are you sure?", [
        { text: "Keep it", style: "cancel" },
        { text: "Cancel booking", style: "destructive", onPress: action },
      ]);
    } else {
      haptics.tap();
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState icon="alert-circle" title="Booking not found" subtitle="It may have been deleted." />
      </View>
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
      {/* Single soft halo behind hero */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 240, overflow: "hidden" }}>
        <AuroraHalo tone="primary" size={360} intensity={0.6} style={{ top: -120, left: -60 }} />
      </View>

      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          Platform.OS !== "web" && elevation.resting,
        ]}
      >
        <View style={styles.cardHeader}>
          <StatusBadge status={booking.status} />
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatDuration(booking.startAt, booking.endAt)}
          </Text>
        </View>
        <Text style={[styles.dateTime, { color: colors.foreground }]}>
          {formatDateTime(booking.startAt)}
        </Text>
        <Text style={[styles.heroName, { color: colors.foreground }]} numberOfLines={1}>
          {customerName}
        </Text>
      </View>

      {customer && (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            Platform.OS !== "web" && elevation.resting,
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Client</Text>
          <Text style={[styles.value, { color: colors.foreground }]}>{customerName}</Text>
          {customer?.email && (
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>{customer.email}</Text>
          )}
          {customer?.phone && (
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>{customer.phone}</Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          Platform.OS !== "web" && elevation.resting,
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Service</Text>
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
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            Platform.OS !== "web" && elevation.resting,
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Notes</Text>
          <Text style={[styles.noteText, { color: colors.foreground }]}>{booking.notes}</Text>
        </View>
      ) : null}

      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable
              key={a.next}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: a.danger ? colors.destructive : colors.primary,
                  opacity: isPending ? 0.6 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
                !a.danger && elevation.floating,
              ]}
              onPress={() => handleStatusChange(a.next)}
              disabled={isPending}
              testID={`action-${a.next.toLowerCase()}`}
            >
              {isPending ? (
                <ActivityIndicator color={a.danger ? "#fff" : colors.primaryForeground} />
              ) : (
                <>
                  {!a.danger && <Feather name="check" size={16} color={colors.primaryForeground} />}
                  <Text
                    style={[
                      styles.actionText,
                      { color: a.danger ? "#fff" : colors.primaryForeground },
                    ]}
                  >
                    {a.label}
                  </Text>
                </>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 12, paddingBottom: 60 },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  time: { ...type.label, fontSize: 12.5 },
  dateTime: { fontFamily: fonts.body, fontSize: 14, marginTop: 2 },
  heroName: { fontFamily: fonts.serifMedium, fontSize: 32, letterSpacing: -0.5, marginTop: 4 },
  eyebrow: { ...type.eyebrow, fontSize: 10.5, marginBottom: 4 },
  value: { fontFamily: fonts.serifMedium, fontSize: 20, letterSpacing: -0.2 },
  sub: { ...type.body, fontSize: 14 },
  noteText: { ...type.body, lineHeight: 22 },
  actions: { gap: 10, marginTop: 4 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  actionText: { fontSize: 15, fontFamily: fonts.bodySemi, letterSpacing: 0.3 },
});

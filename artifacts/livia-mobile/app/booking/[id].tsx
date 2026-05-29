import { useGetBooking, useUpdateBooking } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { aurora } from "@/constants/colors";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useBusinessTimezone } from "@/hooks/useBusinessTimezone";
import { pendingReasonLabel } from "@/lib/booking-pending";
import { getPublicBookingUrl } from "@/lib/public-booking-url";
import { BookingTimelineCard } from "@/components/BookingTimelineCard";
import { notifyBookingRunningLate, promptRunningLateMinutes } from "@/lib/running-late";
import { OperationalScreen } from "@/components/OperationalScreen";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { useQueryClient } from "@tanstack/react-query";

function formatDateTime(iso: string, timeZone: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}

function formatDuration(startAt: string, endAt: string) {
  const mins = Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const STATUS_ACTIONS: Record<
  string,
  Array<{
    label: string;
    next: string;
    danger?: boolean;
    icon: keyof typeof Feather.glyphMap;
  }>
> = {
  PENDING: [
    { label: "Confirm", next: "CONFIRMED", icon: "check" },
    { label: "Cancel", next: "CANCELLED", danger: true, icon: "x-circle" },
  ],
  CONFIRMED: [
    { label: "Mark complete", next: "COMPLETED", icon: "check-circle" },
    { label: "No-show", next: "NO_SHOW", icon: "user-x" },
    { label: "Cancel", next: "CANCELLED", danger: true, icon: "x-circle" },
  ],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export default function BookingDetailScreen() {
  const colors = useColors();
  const haptics = useHaptics();
  const router = useRouter();
  const qc = useQueryClient();
  const { id, intent } = useLocalSearchParams<{ id: string; intent?: string }>();
  const { currentBusiness } = useBusiness();
  const { timeZone: tz } = useBusinessTimezone();

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
          invalidateOperationalState(qc, currentBusiness.id);
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

  const onShareBooking = async () => {
    haptics.tap();
    const when = formatDateTime(booking.startAt, tz);
    const svc = service?.name ?? "Appointment";
    const shop = currentBusiness?.name ?? "the shop";
    const bookUrl = currentBusiness?.slug
      ? getPublicBookingUrl(currentBusiness.slug)
      : undefined;
    const message = `${customerName} — ${svc} at ${shop}\n${when}${bookUrl ? `\nBook: ${bookUrl}` : ""}`;
    await Share.share({ message, title: `${svc} booking` });
  };

  return (
    <OperationalScreen
      title="Booking"
      subtitle={`${customerName} · ${service?.name ?? "Appointment"}`}
      contentStyle={styles.content}
      actions={
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
      }
    >

      {intent === "reschedule" ? (
        <Pressable
          onPress={() => {
            haptics.tap();
            router.push({
              pathname: "/booking/new",
              params: {
                customerId: booking.customerId,
                serviceId: booking.serviceId,
                staffId: booking.staffId ?? "",
                noteSeed: booking.notes
                  ? `Rescheduled from ${formatDateTime(booking.startAt, tz)}. ${booking.notes}`
                  : `Rescheduled from ${formatDateTime(booking.startAt, tz)}.`,
              },
            });
          }}
          style={({ pressed }) => [
            styles.intentBanner,
            { backgroundColor: aurora.cyan + "1c", borderColor: aurora.cyan + "55" },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Feather name="calendar" size={14} color={aurora.cyan} />
          <Text style={[styles.intentText, { color: aurora.cyan, flex: 1 }]}>
            Book a replacement slot with the same client and service, then cancel this booking if
            you no longer need it.
          </Text>
          <Feather name="chevron-right" size={16} color={aurora.cyan} />
        </Pressable>
      ) : null}

      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          Platform.OS !== "web" && elevation.resting,
        ]}
      >
        <View style={styles.cardHeader}>
          <StatusBadge status={booking.status} />
          {booking.status === "PENDING" && (booking as { pendingReason?: string }).pendingReason ? (
            <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 6 }]}>
              {pendingReasonLabel((booking as { pendingReason?: string }).pendingReason)}
            </Text>
          ) : null}
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatDuration(booking.startAt, booking.endAt)}
          </Text>
        </View>
          <Text style={[styles.dateTime, { color: colors.foreground }]}>
          {formatDateTime(booking.startAt, tz)}
        </Text>
        {/*
          Hero handoff. Reanimated 4 removed the legacy `sharedTransitionTag`
          API, so we pair the hero by `nativeID` (matches the source name on
          BookingCard) and choreograph a soft FadeInDown so the name reads as
          continuous from the row → detail. Visual parity verified on-device.
        */}
        <Animated.Text
          entering={FadeInDown.duration(360).damping(18).stiffness(180)}
          nativeID={`booking-${booking.id}-name`}
          style={[styles.heroName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {customerName}
        </Animated.Text>
      </View>

      {currentBusiness?.id ? (
        <BookingTimelineCard businessId={currentBusiness.id} bookingId={booking.id} />
      ) : null}

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

      {booking.status === "CONFIRMED" && currentBusiness?.id ? (
        <Pressable
          onPress={() =>
            promptRunningLateMinutes((m) =>
              void notifyBookingRunningLate(currentBusiness!.id, booking.id, m),
            )
          }
          style={({ pressed }) => [
            styles.shareRow,
            { borderColor: colors.border, backgroundColor: colors.card },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Feather name="clock" size={18} color={colors.primary} />
          <Text style={[styles.shareText, { color: colors.primary }]}>Running late — notify client</Text>
        </Pressable>
      ) : null}

      {Platform.OS !== "web" ? (
        <Pressable
          onPress={() => void onShareBooking()}
          style={({ pressed }) => [
            styles.shareRow,
            { borderColor: colors.border, backgroundColor: colors.card },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Feather name="share" size={18} color={colors.primary} />
          <Text style={[styles.shareText, { color: colors.primary }]}>Share booking details</Text>
        </Pressable>
      ) : null}

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
                  <Feather
                    name={a.icon}
                    size={16}
                    color={a.danger ? "#fff" : colors.primaryForeground}
                  />
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
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 12, paddingBottom: 60 },
  intentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  intentText: { ...type.label, fontSize: 12.5 },
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
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  shareText: { fontFamily: fonts.bodySemi, fontSize: 15 },
});

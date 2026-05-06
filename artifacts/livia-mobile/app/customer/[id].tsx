import { useGetCustomer } from "@workspace/api-client-react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BookingCard } from "@/components/BookingCard";
import { EmptyState } from "@/components/EmptyState";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

export default function CustomerDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentBusiness } = useBusiness();

  const { data: customer, isLoading } = useGetCustomer(
    currentBusiness?.id ?? "",
    id ?? "",
    { query: { enabled: !!currentBusiness?.id && !!id } as any }
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!customer) {
    return <EmptyState icon="user-x" title="Client not found" />;
  }

  const detail = customer as unknown as {
    recentBookings?: Array<{ id: string; status: string; startAt: string; endAt: string }>;
  };
  const displayName = customer.displayName ?? customer.firstName ?? "Unknown";
  const initials = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{displayName}</Text>
        {customer.email && (
          <Text style={[styles.contact, { color: colors.mutedForeground }]}>{customer.email}</Text>
        )}
        {customer.phone && (
          <Text style={[styles.contact, { color: colors.mutedForeground }]}>{customer.phone}</Text>
        )}
        {customer.isBlocked && (
          <Text style={[styles.blocked, { color: colors.destructive }]}>⛔ Blocked</Text>
        )}
      </View>

      {customer.notes ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTES</Text>
          <Text style={[styles.noteText, { color: colors.foreground }]}>{customer.notes}</Text>
        </View>
      ) : null}

      {detail.recentBookings && detail.recentBookings.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent bookings</Text>
          {detail.recentBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              showDate
              onPress={() => router.push(`/booking/${b.id}`)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  initials: { fontSize: 26, fontFamily: "Inter_700Bold" },
  name: { fontSize: 20, fontFamily: "Inter_700Bold" },
  contact: { fontSize: 14, fontFamily: "Inter_400Regular" },
  blocked: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  noteText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
});

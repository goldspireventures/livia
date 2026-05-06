import { useGetCustomer } from "@workspace/api-client-react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BookingCard } from "@/components/BookingCard";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { EmptyState } from "@/components/EmptyState";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
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
    { query: { enabled: !!currentBusiness?.id && !!id } as any },
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState icon="user-x" title="Client not found" />
      </View>
    );
  }

  const detail = customer as unknown as {
    recentBookings?: Array<{ id: string; status: string; startAt: string; endAt: string }>;
  };
  const displayName = customer.displayName ?? customer.firstName ?? "Unknown";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 240, overflow: "hidden" }}>
        <AuroraHalo tone="primary" size={340} intensity={0.6} style={{ top: -100, left: -50 }} />
      </View>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          Platform.OS !== "web" && elevation.resting,
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary + "1f", borderColor: colors.primary + "55" }]}>
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
          <Text style={[styles.blocked, { color: colors.destructive }]}>⛔  Blocked</Text>
        )}
      </View>

      {customer.notes ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            Platform.OS !== "web" && elevation.resting,
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Notes</Text>
          <Text style={[styles.noteText, { color: colors.foreground }]}>{customer.notes}</Text>
        </View>
      ) : null}

      {detail.recentBookings && detail.recentBookings.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent bookings
          </Text>
          {detail.recentBookings.map((b, i) => (
            <BookingCard
              key={b.id}
              booking={b}
              showDate
              index={i}
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
  content: { padding: 16, gap: 14, paddingBottom: 60 },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 26,
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  initials: { ...type.numericSm, fontSize: 26 },
  name: { fontFamily: fonts.serifMedium, fontSize: 28, letterSpacing: -0.4 },
  contact: { ...type.body, fontSize: 14 },
  blocked: { ...type.label, fontSize: 13, marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  eyebrow: { ...type.eyebrow, fontSize: 10.5 },
  noteText: { ...type.body, lineHeight: 22 },
  section: { gap: 10 },
  sectionTitle: { fontFamily: fonts.serifMedium, fontSize: 22, letterSpacing: -0.3 },
});

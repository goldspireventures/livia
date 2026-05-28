import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useBillingSummary } from "@/hooks/useBillingSummary";

export function BillingSummaryCard({ businessId }: { businessId: string }) {
  const colors = useColors();
  const router = useRouter();
  const { data, isLoading, isError } = useBillingSummary(businessId);

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError || !data) return null;

  const bookings = data.usage.booking_completed ?? 0;
  const sms = data.usage.sms_message_outbound ?? 0;

  return (
    <Pressable
      onPress={() => router.push("/plan")}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel="Plan and usage"
    >
      <View style={styles.row}>
        <Feather name="credit-card" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>Plan · {data.planName}</Text>
      </View>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        {data.designPartnerActive
          ? "Design partner pricing"
          : data.stripeSubscriptionStatus
            ? `Subscription ${data.stripeSubscriptionStatus}`
            : `${data.planId} — manage billing on web`}
      </Text>
      <View style={styles.stats}>
        <Text style={[styles.stat, { color: colors.foreground }]}>
          {bookings} bookings
        </Text>
        <Text style={[styles.stat, { color: colors.mutedForeground }]}>·</Text>
        <Text style={[styles.stat, { color: colors.foreground }]}>{sms} SMS</Text>
      </View>
      <Text style={[styles.link, { color: colors.primary }]}>View plan · upgrade in app</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.bodyMed, fontSize: 16 },
  meta: { ...type.caption, lineHeight: 18 },
  stats: { flexDirection: "row", alignItems: "center", gap: 6 },
  stat: { fontFamily: fonts.bodyMed, fontSize: 13 },
  link: { fontFamily: fonts.bodyMed, fontSize: 12, marginTop: 4 },
});

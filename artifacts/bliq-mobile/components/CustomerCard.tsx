import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface CustomerCardProps {
  customer: {
    id: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    totalBookings?: number;
    isBlocked?: boolean;
  };
  onPress?: () => void;
}

export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  const colors = useColors();
  const displayName =
    customer.displayName ??
    ([customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unknown");
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
      testID={`customer-card-${customer.id}`}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {displayName}
          {customer.isBlocked ? " 🚫" : ""}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {customer.email ?? customer.phone ?? "No contact"}
        </Text>
      </View>
      {customer.totalBookings !== undefined && (
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {customer.totalBookings}
        </Text>
      )}
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  count: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});

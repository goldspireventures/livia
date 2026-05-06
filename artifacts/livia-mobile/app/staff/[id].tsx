import { useGetStaff, useGetStaffServices, useUpdateStaff } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

export default function StaffDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";

  const { data: staff, isLoading, refetch } = useGetStaff(bid, id ?? "", {
    query: { enabled: !!bid && !!id } as any,
  });

  const { data: staffServices } = useGetStaffServices(bid, id ?? "", {
    query: { enabled: !!bid && !!id } as any,
  });

  const { mutateAsync: updateStaff, isPending } = useUpdateStaff();

  const toggleActive = async () => {
    if (!staff) return;
    try {
      await updateStaff({
        businessId: bid,
        staffId: staff.id,
        data: { isActive: !staff.isActive },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch {
      Alert.alert("Error", "Could not update staff status.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!staff) {
    return <EmptyState icon="user-x" title="Staff member not found" />;
  }

  const initials = staff.displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

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
        <Text style={[styles.name, { color: colors.foreground }]}>{staff.displayName}</Text>
        {staff.email && (
          <Text style={[styles.contact, { color: colors.mutedForeground }]}>{staff.email}</Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Active</Text>
          <Switch
            value={staff.isActive !== false}
            onValueChange={toggleActive}
            disabled={isPending}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {staffServices && staffServices.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Assigned services</Text>
          {staffServices.map((s) => (
            <View
              key={s.id}
              style={[styles.serviceRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.serviceName, { color: colors.foreground }]}>{s.name}</Text>
                <Text style={[styles.serviceDur, { color: colors.mutedForeground }]}>
                  {s.durationMinutes} min
                  {s.priceMinor ? ` · $${(s.priceMinor / 100).toFixed(2)}` : ""}
                </Text>
              </View>
            </View>
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
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  initials: { fontSize: 26, fontFamily: "Inter_700Bold" },
  name: { fontSize: 20, fontFamily: "Inter_700Bold" },
  contact: { fontSize: 14, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontSize: 16, fontFamily: "Inter_500Medium" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  serviceRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  serviceName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  serviceDur: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
});

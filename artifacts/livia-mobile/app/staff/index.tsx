import { useListStaff } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

export default function StaffListScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentBusiness } = useBusiness();

  const { data: staff, isLoading, refetch, isRefetching } = useListStaff(
    currentBusiness?.id ?? "",
    {},
    { query: { enabled: !!currentBusiness?.id } as any }
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={staff ?? []}
      keyExtractor={(s) => s.id}
      renderItem={({ item }) => {
        const initials = item.displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
        return (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/staff/${item.id}`)}
            activeOpacity={0.75}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{item.displayName}</Text>
              {item.email && (
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>{item.email}</Text>
              )}
            </View>
            {item.isActive === false && (
              <View style={[styles.inactiveBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.inactiveText, { color: colors.mutedForeground }]}>Inactive</Text>
              </View>
            )}
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={[
        styles.list,
        !(staff?.length) && styles.listEmpty,
      ]}
      ListEmptyComponent={
        <EmptyState
          icon="users"
          title={isLoading ? "Loading…" : "No staff yet"}
          subtitle={isLoading ? undefined : "Add staff to start scheduling"}
          isLoading={isLoading}
        />
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
      scrollEnabled={!!(staff?.length)}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 0, paddingBottom: 40 },
  listEmpty: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  initials: { fontSize: 15, fontFamily: "Inter_700Bold" },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  inactiveBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  inactiveText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});

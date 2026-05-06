import { useListServices } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

export default function ServicesScreen() {
  const colors = useColors();
  const { currentBusiness } = useBusiness();

  const { data: services, isLoading, refetch, isRefetching } = useListServices(
    currentBusiness?.id ?? "",
    {},
    { query: { enabled: !!currentBusiness?.id } as any }
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={services ?? []}
      keyExtractor={(s) => s.id}
      renderItem={({ item }) => (
        <View
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.icon, { backgroundColor: colors.primary + "18" }]}>
            <Feather name="scissors" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {item.durationMinutes} min
              {item.priceMinor ? ` · $${(item.priceMinor / 100).toFixed(2)}` : ""}
            </Text>
            {item.description ? (
              <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
          {item.isActive === false && (
            <View style={[styles.inactiveBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.inactiveText, { color: colors.mutedForeground }]}>Inactive</Text>
            </View>
          )}
        </View>
      )}
      contentContainerStyle={[
        styles.list,
        !(services?.length) && styles.listEmpty,
      ]}
      ListEmptyComponent={
        <EmptyState
          icon="briefcase"
          title={isLoading ? "Loading…" : "No services yet"}
          subtitle={isLoading ? undefined : "Add services to start accepting bookings"}
          isLoading={isLoading}
        />
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
      scrollEnabled={!!(services?.length)}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
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
  icon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  desc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 18 },
  inactiveBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  inactiveText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});

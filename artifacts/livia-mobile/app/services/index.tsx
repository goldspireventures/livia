import { useListServices } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { OperationalScreen } from "@/components/OperationalScreen";
import { asHref } from "@/lib/navigation";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useMembership } from "@/hooks/useMembership";

export default function ServicesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { role } = useMembership();
  const { currentBusiness } = useBusiness();
  const canEdit = role === "OWNER" || role === "ADMIN";

  const { data: services, isLoading, refetch, isRefetching } = useListServices(
    currentBusiness?.id ?? "",
    {},
    { query: { enabled: !!currentBusiness?.id } as any }
  );

  return (
    <OperationalScreen
      scroll={false}
      title="Services"
      subtitle="Duration and price shape availability and what Liv can book confidently."
      headerExtra={
        canEdit ? (
          <Pressable
            onPress={() => {
              haptics.tap();
              router.push(asHref("/service/new"));
            }}
            style={({ pressed }) => [
              styles.addRow,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[styles.addRowText, { color: colors.primaryForeground }]}>New service</Text>
          </Pressable>
        ) : null
      }
    >
      <FlatList
        style={{ flex: 1 }}
        data={services ?? []}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => canEdit && router.push(asHref(`/service/${item.id}`))}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && canEdit && { opacity: 0.9 },
            ]}
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
          </Pressable>
        )}
        contentContainerStyle={[styles.list, !(services?.length) && styles.listEmpty]}
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
        scrollEnabled={!!services?.length}
      />
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  listEmpty: { flex: 1 },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  addRowText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
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

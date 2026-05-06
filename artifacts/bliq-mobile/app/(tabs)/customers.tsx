import { useListCustomers } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomerCard } from "@/components/CustomerCard";
import { EmptyState } from "@/components/EmptyState";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

export default function CustomersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useBusiness();
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useListCustomers(
    currentBusiness?.id ?? "",
    { search: search || undefined, limit: 50 },
    { query: { enabled: !!currentBusiness?.id } as any }
  );

  const customers = data?.data ?? [];
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Clients</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {(data as { total?: number })?.total ?? 0} total
        </Text>
      </View>

      <View style={[styles.searchWrap, { borderColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search clients…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            testID="customer-search"
          />
          {search.length > 0 && (
            <Feather
              name="x"
              size={16}
              color={colors.mutedForeground}
              onPress={() => setSearch("")}
            />
          )}
        </View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onPress={() => router.push(`/customer/${item.id}`)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          customers.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title={isLoading ? "Loading…" : search ? "No results" : "No clients yet"}
            subtitle={
              isLoading
                ? undefined
                : search
                ? "Try a different search"
                : "Clients appear here after their first booking"
            }
            isLoading={isLoading}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={!!customers.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  count: { fontSize: 14, fontFamily: "Inter_400Regular" },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  listEmpty: { flex: 1 },
});

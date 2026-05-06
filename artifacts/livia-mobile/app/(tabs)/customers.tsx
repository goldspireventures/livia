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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomerCard } from "@/components/CustomerCard";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { EmptyState } from "@/components/EmptyState";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

export default function CustomersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useBusiness();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);

  // Animate search box border color + glow on focus
  const focus = useSharedValue(0);
  const focusStyle = useAnimatedStyle(() => ({
    borderColor: focused ? colors.primary : colors.border,
    shadowOpacity: focus.value * 0.35,
  }));

  const { data, isLoading, refetch, isRefetching } = useListCustomers(
    currentBusiness?.id ?? "",
    { search: search || undefined, limit: 50 },
    { query: { enabled: !!currentBusiness?.id } as any },
  );

  const customers = data?.data ?? [];
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerTop}>
          <LiviaWordmark size="sm" color={colors.foreground} />
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {(data as { total?: number })?.total ?? 0} total
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Clients</Text>
      </View>

      <View style={styles.searchWrap}>
        <Animated.View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.input + "55",
              shadowColor: colors.primary,
            },
            focusStyle,
          ]}
        >
          <Feather name="search" size={16} color={focused ? colors.primary : colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search clients…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            onFocus={() => {
              setFocused(true);
              focus.value = withTiming(1, { duration: 220 });
            }}
            onBlur={() => {
              setFocused(false);
              focus.value = withTiming(0, { duration: 220 });
            }}
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
        </Animated.View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(c) => c.id}
        renderItem={({ item, index }) => (
          <CustomerCard
            customer={item}
            index={index}
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
            title={isLoading ? "Loading…" : search ? "No matches" : "No clients yet"}
            subtitle={
              isLoading
                ? undefined
                : search
                  ? "Try a different name or phone number."
                  : "Clients land here the moment they book — Liv handles the import."
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
  },
  count: { ...type.caption, fontSize: 12 },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  list: { paddingHorizontal: 16, paddingBottom: 140 },
  listEmpty: { flex: 1 },
});

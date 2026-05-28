import { useListCustomers, listCustomers } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
import { CustomerCard } from "@/components/CustomerCard";
import { OperationalScreen } from "@/components/OperationalScreen";
import { EmptyState } from "@/components/EmptyState";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const PAGE_SIZE = 40;

type CustomerRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
};

export default function CustomersScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<CustomerRow[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);
  const bid = currentBusiness?.id ?? "";

  useEffect(() => {
    setOffset(0);
    setAccumulated([]);
  }, [debouncedSearch, bid]);

  const focus = useSharedValue(0);
  const focusStyle = useAnimatedStyle(() => ({
    borderColor: focused ? colors.primary : colors.border,
    shadowOpacity: focus.value * 0.35,
  }));

  const { data, isLoading, refetch, isRefetching, isFetching } = useListCustomers(
    currentBusiness?.id ?? "",
    { search: debouncedSearch || undefined, limit: PAGE_SIZE, offset },
    { query: { enabled: !!currentBusiness?.id } as never },
  );

  const page = useMemo(() => {
    const raw = data as { data?: CustomerRow[]; total?: number } | undefined;
    return { data: raw?.data ?? [], total: raw?.total };
  }, [data]);

  useEffect(() => {
    if (!bid || isLoading) return;
    setAccumulated((prev) => {
      if (offset === 0) return page.data;
      const ids = new Set(prev.map((c) => c.id));
      return [...prev, ...page.data.filter((c) => !ids.has(c.id))];
    });
  }, [page.data, offset, bid, isLoading]);

  const total = page.total;
  const hasMore =
    total !== undefined ? accumulated.length < total : page.data.length === PAGE_SIZE;

  const loadMore = useCallback(async () => {
    if (!bid || !hasMore || loadingMore || isFetching) return;
    setLoadingMore(true);
    try {
      const nextOffset = offset + PAGE_SIZE;
      const more = await listCustomers(bid, {
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      const rows = (more as { data?: CustomerRow[] }).data ?? [];
      setOffset(nextOffset);
      setAccumulated((prev) => {
        const ids = new Set(prev.map((c) => c.id));
        return [...prev, ...rows.filter((c) => !ids.has(c.id))];
      });
    } finally {
      setLoadingMore(false);
    }
  }, [bid, hasMore, loadingMore, isFetching, offset, debouncedSearch]);

  const listLoading = isLoading && offset === 0;

  return (
    <OperationalScreen
      scroll={false}
      title="Clients"
      subtitle={`${total ?? accumulated.length} in your book`}
      actions={
        <Pressable
          onPress={() => router.push("/customer/new")}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={18} color={colors.primaryForeground} />
        </Pressable>
      }
      headerExtra={
        <View style={styles.searchWrap}>
          <Animated.View
            style={[
              styles.searchBox,
              { backgroundColor: colors.input + "55", shadowColor: colors.primary },
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
      }
    >
      <FlatList
        data={accumulated}
        keyExtractor={(c) => c.id}
        renderItem={({ item, index }) => (
          <CustomerCard
            customer={item}
            index={index}
            onPress={() => router.push(`/customer/${item.id}`)}
          />
        )}
        contentContainerStyle={[styles.list, accumulated.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title={listLoading ? "Loading…" : search ? "No matches" : "No clients yet"}
            subtitle={
              listLoading
                ? undefined
                : search
                  ? "Try a different name or phone number."
                  : "Clients land here the moment they book — Liv handles the import."
            }
            isLoading={listLoading}
          />
        }
        ListFooterComponent={
          hasMore && accumulated.length > 0 ? (
            <Pressable
              onPress={() => void loadMore()}
              style={[styles.loadMore, { borderColor: colors.border }]}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.loadMoreText, { color: colors.primary }]}>Load more</Text>
              )}
            </Pressable>
          ) : null
        }
        onEndReached={() => {
          if (hasMore && !loadingMore) void loadMore();
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              setOffset(0);
              setAccumulated([]);
              void refetch();
            }}
            tintColor={colors.primary}
          />
        }
      />
    </OperationalScreen>
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
  titleRow: {
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  count: { ...type.caption, fontSize: 12 },
  searchWrap: { paddingBottom: 4 },
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
  list: { paddingHorizontal: 20, paddingBottom: 140 },
  listEmpty: { flexGrow: 1 },
  loadMore: {
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  loadMoreText: { fontFamily: fonts.bodySemi, fontSize: 14 },
});

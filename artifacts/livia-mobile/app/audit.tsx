import { useSearchAuditLog } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useBusinessTimezone } from "@/hooks/useBusinessTimezone";
import { formatDateTimeInZone } from "@/lib/datetime";
import {
  AUDIT_FILTER_CHIPS,
  auditActionLabel,
  expandAuditSearchQuery,
} from "@/lib/audit-labels";

const PAGE_SIZE = 40;
const IMPERSONATION_ACTION = "human.persona.view";

type AuditRow = {
  id: string;
  occurredAt: string;
  actorKind: string;
  actionClass: string;
  resourceKind: string;
  resourceId?: string | null;
};

export default function AuditScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useBusiness();
  const { timeZone } = useBusinessTimezone();
  const businessId = currentBusiness?.id ?? "";

  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");
  const [actionClass, setActionClass] = useState("");
  const [submittedAction, setSubmittedAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<AuditRow[]>([]);

  const fromIso = fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined;
  const toIso = toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined;

  const { data, isLoading, isFetching, refetch } = useSearchAuditLog(
    businessId,
    {
      q: submittedQ.trim() || undefined,
      actionClass: submittedAction.trim() || undefined,
      from: fromIso,
      to: toIso,
      limit: PAGE_SIZE,
      offset,
    },
    { query: { enabled: !!businessId, staleTime: 15_000 } as never },
  );

  const pageRows = (data?.data ?? []) as AuditRow[];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (!data) return;
    const rows = (data.data ?? []) as AuditRow[];
    if (offset === 0) {
      setAccumulated(rows);
    } else {
      setAccumulated((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        return [...prev, ...rows.filter((r) => !ids.has(r.id))];
      });
    }
  }, [data, offset]);

  const runSearch = useCallback(() => {
    setSubmittedQ(q);
    setSubmittedAction(actionClass);
    setOffset(0);
    setAccumulated([]);
  }, [q, actionClass]);

  const clearFilters = useCallback(() => {
    setQ("");
    setSubmittedQ("");
    setActionClass("");
    setSubmittedAction("");
    setFromDate("");
    setToDate("");
    setOffset(0);
    setAccumulated([]);
  }, []);

  const hasFilters = !!(submittedQ || submittedAction || fromDate || toDate);
  const hasMore = accumulated.length < total;

  const loadMore = () => {
    if (!hasMore || isFetching) return;
    setOffset((o) => o + PAGE_SIZE);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Audit log</Text>
        <View style={{ width: 22 }} />
      </View>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Who did what in {currentBusiness?.name ?? "this shop"}. Search in plain English — e.g.
        &quot;booking cancelled&quot;, &quot;Liv&quot;, or a staff name. Full export stays on web.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {AUDIT_FILTER_CHIPS.map((chip) => (
          <Pressable
            key={chip.id}
            onPress={() => {
              setQ(chip.q);
              setSubmittedQ(expandAuditSearchQuery(chip.q));
              setOffset(0);
              setAccumulated([]);
            }}
            style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Text style={[styles.chipText, { color: colors.foreground }]}>{chip.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.searchRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="e.g. booking confirmed, Liv, staff name…"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          returnKeyType="search"
          onSubmitEditing={runSearch}
          testID="audit-search-input"
        />
        <Pressable onPress={runSearch} testID="audit-search-go">
          <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi }}>Go</Text>
        </Pressable>
      </View>

      <View style={[styles.filters, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>From (YYYY-MM-DD)</Text>
            <TextInput
              value={fromDate}
              onChangeText={setFromDate}
              placeholder="2026-05-01"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.filterInput, { color: colors.foreground, borderColor: colors.border }]}
              testID="audit-filter-from"
            />
          </View>
          <View style={styles.dateCol}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>To</Text>
            <TextInput
              value={toDate}
              onChangeText={setToDate}
              placeholder="2026-05-31"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.filterInput, { color: colors.foreground, borderColor: colors.border }]}
              testID="audit-filter-to"
            />
          </View>
        </View>
        <View style={styles.filterActions}>
          <Pressable onPress={runSearch} style={[styles.chip, { backgroundColor: colors.primary }]}>
            <Text style={[styles.chipText, { color: "#fff" }]}>Apply</Text>
          </Pressable>
          {hasFilters ? (
            <Pressable onPress={clearFilters} style={[styles.chip, { borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.chipText, { color: colors.foreground }]}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text style={[styles.count, { color: colors.mutedForeground }]} testID="audit-count">
        {isLoading && offset === 0
          ? "Loading…"
          : `${total} entr${total === 1 ? "y" : "ies"}${accumulated.length < total ? ` · showing ${accumulated.length}` : ""}`}
      </Text>

      {isLoading && offset === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <FlatList
          data={accumulated}
          keyExtractor={(item) => item.id}
          refreshing={isFetching && offset === 0}
          onRefresh={() => {
            setOffset(0);
            void refetch();
          }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.mutedForeground }]} testID="audit-empty">
              No audit entries match your search.
            </Text>
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable
                onPress={loadMore}
                disabled={isFetching}
                style={[styles.loadMore, { borderColor: colors.border }]}
                testID="audit-load-more"
              >
                <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi }}>
                  {isFetching ? "Loading…" : "Load more"}
                </Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              testID={`audit-row-${item.id}`}
            >
              <Text
                style={[
                  styles.action,
                  {
                    color:
                      item.actionClass === IMPERSONATION_ACTION ? colors.primary : colors.foreground,
                  },
                ]}
                numberOfLines={1}
              >
                {auditActionLabel(item.actionClass)}
              </Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {item.actionClass} · {formatDateTimeInZone(item.occurredAt, timeZone)} · {item.actorKind}
                {item.resourceId ? ` · ${item.resourceId.slice(0, 8)}…` : ""}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontFamily: fonts.serifMedium, fontSize: 22 },
  sub: { ...type.body, paddingHorizontal: 16, marginBottom: 8, fontSize: 13 },
  chipScroll: { paddingHorizontal: 16, marginBottom: 10, maxHeight: 44 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15 },
  filters: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  filterLabel: { ...type.caption, fontSize: 11 },
  filterInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  dateRow: { flexDirection: "row", gap: 10 },
  dateCol: { flex: 1, gap: 4 },
  filterActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  chip: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  count: { ...type.caption, paddingHorizontal: 16, marginBottom: 4 },
  row: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  action: { fontFamily: fonts.bodySemi, fontSize: 14 },
  meta: { ...type.caption, marginTop: 4 },
  empty: { textAlign: "center", marginTop: 40, ...type.body },
  loadMore: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
  },
});

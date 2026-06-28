import { customFetch } from "@workspace/api-client-react";
import { buildSettingsAttentionRows } from "@workspace/policy";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

function resolveAttentionHref(href: string, businessId: string): string {
  if (href.startsWith("http")) return href;
  const base = getDashboardBaseUrl().replace(/\/+$/, "");
  const path = href.startsWith("/") ? href : `/${href}`;
  const url = new URL(`${base}${path}`);
  if (businessId && !url.searchParams.has("businessId")) {
    url.searchParams.set("businessId", businessId);
  }
  return url.toString();
}

export function MobileSettingsAttentionStrip({ businessId }: { businessId: string }) {
  const colors = useColors();
  const haptics = useHaptics();

  const { data, isLoading } = useQuery({
    queryKey: ["owner-intelligence", businessId, "settings-strip"],
    queryFn: () => customFetch<unknown>(`/api/businesses/${businessId}/owner-intelligence`),
    enabled: !!businessId,
    staleTime: 30_000,
  });

  const rows = useMemo(() => buildSettingsAttentionRows(data ?? null), [data]);

  if (!businessId) return null;
  if (isLoading) {
    return (
      <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (rows.length === 0) return null;

  return (
    <View
      style={[
        styles.wrap,
        { borderColor: "#f59e0b66", backgroundColor: "#f59e0b14" },
      ]}
      testID="settings-attention-strip"
    >
      <View style={styles.head}>
        <Feather name="alert-triangle" size={16} color="#f59e0b" />
        <Text style={[styles.headText, { color: colors.foreground }]}>
          {rows.length} item{rows.length === 1 ? "" : "s"} need attention
        </Text>
      </View>
      {rows.slice(0, 4).map((row) => (
        <View
          key={row.id}
          style={[styles.row, { borderColor: colors.border, backgroundColor: colors.background + "cc" }]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{row.title}</Text>
            <Text style={[styles.rowBody, { color: colors.mutedForeground }]} numberOfLines={2}>
              {row.body}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              haptics.tap();
              void Linking.openURL(resolveAttentionHref(row.href, businessId));
            }}
            style={[styles.openBtn, { borderColor: colors.primary }]}
          >
            <Text style={[styles.openText, { color: colors.primary }]}>Fix</Text>
            <Feather name="external-link" size={12} color={colors.primary} />
          </Pressable>
        </View>
      ))}
      {rows.length > 4 ? (
        <Text style={[styles.moreHint, { color: colors.mutedForeground }]}>
          +{rows.length - 4} more in web settings
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  headText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 13 },
  rowBody: { ...type.caption, fontSize: 11, lineHeight: 16 },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  openText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  moreHint: { ...type.caption, fontSize: 11, textAlign: "center" },
});

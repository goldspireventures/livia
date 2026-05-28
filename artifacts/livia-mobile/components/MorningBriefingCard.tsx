import { customFetch } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

type BriefingPayload = {
  briefingDate: string;
  content: {
    businessName?: string;
    verticalLabel?: string;
    source?: "liv" | "stats_fallback";
    summary: string;
    highlights: string[];
    todayBookings: Array<{
      id: string;
      customerName: string;
      serviceName: string;
    }>;
  };
  live?: boolean;
};

export function MorningBriefingCard({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName?: string;
}) {
  const colors = useColors();
  const [data, setData] = useState<BriefingPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await customFetch<BriefingPayload>(
        `/api/businesses/${businessId}/morning-briefing`,
      );
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    setData(null);
    void load();
  }, [load, businessId]);

  if (!businessId) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.primary + "10",
          borderColor: colors.primary + "33",
        },
      ]}
    >
      <View style={styles.header}>
        <Feather name="sun" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          Liv · {businessName ?? "Today"}
        </Text>
      </View>
      <Text style={[styles.date, { color: colors.mutedForeground }]}>
        {data?.briefingDate ?? "Today"}
        {data?.content.verticalLabel ? ` · ${data.content.verticalLabel}` : ""}
        {data?.content.source === "liv" ? " · written by Liv" : data?.live ? " · loading Liv…" : ""}
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
      ) : data ? (
        <>
          <Text style={[styles.summary, { color: colors.foreground }]}>{data.content.summary}</Text>
          {data.content.highlights.slice(0, 3).map((h) => (
            <Text key={h} style={[styles.bullet, { color: colors.mutedForeground }]}>
              · {h}
            </Text>
          ))}
          {data.content.source !== "liv" ? (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Liv is writing your briefing for this shop… pull to refresh on Today.
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={[styles.bullet, { color: colors.mutedForeground }]}>Briefing unavailable.</Text>
      )}
      <Pressable onPress={() => void load()} style={styles.refresh}>
        <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi, fontSize: 13 }}>
          Refresh
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.bodySemi, fontSize: 15 },
  date: { ...type.caption, marginTop: 4, marginBottom: 8 },
  summary: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  bullet: { fontFamily: fonts.body, fontSize: 13, marginTop: 4 },
  hint: { ...type.caption, marginTop: 8 },
  refresh: { marginTop: 10, alignSelf: "flex-start" },
});

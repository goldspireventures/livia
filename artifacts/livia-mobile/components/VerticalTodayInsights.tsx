import { customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { asHref } from "@/lib/navigation";

type Insight = {
  id: string;
  title: string;
  body: string;
  tone: "info" | "warn" | "action";
  mobileHref?: string;
};

export function VerticalTodayInsights({ businessId }: { businessId: string }) {
  const colors = useColors();
  const haptics = useHaptics();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["today-vertical-insights", businessId],
    queryFn: () =>
      customFetch<{ vertical: string; insights: Insight[] }>(
        `/api/businesses/${businessId}/today-vertical-insights`,
      ),
    enabled: !!businessId,
    staleTime: 90_000,
  });

  const insights = data?.insights ?? [];
  if (insights.length === 0) return null;

  const accent = (tone: Insight["tone"]) => {
    if (tone === "warn") return colors.warning;
    if (tone === "action") return aurora.cyan;
    return colors.primary;
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.mutedForeground }]}>For your vertical</Text>
      {insights.map((row) => (
        <Pressable
          key={row.id}
          disabled={!row.mobileHref}
          onPress={() => {
            if (!row.mobileHref) return;
            haptics.tap();
            router.push(asHref(row.mobileHref));
          }}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.card, borderColor: accent(row.tone) + "55" },
            elevation.resting,
            pressed && row.mobileHref ? { opacity: 0.92 } : null,
          ]}
        >
          <View style={[styles.dot, { backgroundColor: accent(row.tone) }]} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>{row.title}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{row.body}</Text>
          </View>
          {row.mobileHref ? (
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  heading: { ...type.eyebrow, fontSize: 11, marginBottom: 2 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontFamily: fonts.bodySemi, fontSize: 14 },
  body: { ...type.caption, fontSize: 12, lineHeight: 17 },
});

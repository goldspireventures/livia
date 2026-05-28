import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { customFetch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { mobileRouteFromLivHref } from "@/lib/liv-moment-routes";

type LivMoment = {
  id: string;
  priority: "info" | "watch" | "act";
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
};

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

export function LivMomentsCard({ businessId }: { businessId: string }) {
  const colors = useColors();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["liv-moments", businessId],
    queryFn: () =>
      customFetch<{ data: LivMoment[] }>(`/api/businesses/${businessId}/liv-moments`),
    enabled: !!businessId,
    staleTime: 30_000,
  });

  const moments = data?.data ?? [];
  if (moments.length === 0) return null;

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card ?? colors.background }]}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>Liv moments</Text>
      </View>
      {moments.slice(0, 3).map((m: LivMoment) => {
        const route = mobileRouteFromLivHref(m.href);
        const border =
          m.priority === "act"
            ? "#ef4444"
            : m.priority === "watch"
              ? "#d97706"
              : colors.border;
        const inner = (
          <View style={[styles.moment, { borderLeftColor: border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>{m.title}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>
              {m.body}
            </Text>
            <Text style={[styles.time, { color: colors.mutedForeground }]}>
              {relativeTime(m.createdAt)}
            </Text>
          </View>
        );
        if (!route) {
          return <View key={m.id}>{inner}</View>;
        }
        return (
          <Pressable key={m.id} onPress={() => router.push(route as never)}>
            {inner}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  moment: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  body: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
});

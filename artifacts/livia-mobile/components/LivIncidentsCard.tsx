import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { customFetch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { asHref } from "@/lib/navigation";

type LivIncidentItem = {
  id: string;
  kind: "incident" | "support_ticket";
  createdAt: string;
  ticketId: string | null;
  conversationId: string | null;
  bookingId: string | null;
  status: string;
  summary: string;
};

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

export function LivIncidentsCard({ businessId }: { businessId: string }) {
  const colors = useColors();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["liv-incidents", businessId],
    queryFn: () =>
      customFetch<{ data: LivIncidentItem[]; openCount: number }>(
        `/api/businesses/${businessId}/liv-incidents`,
      ),
    enabled: !!businessId,
    staleTime: 30_000,
  });

  const items = data?.data ?? [];
  if (items.length === 0) return null;

  return (
    <View
      style={[
        styles.wrap,
        { borderColor: "#f59e0b55", backgroundColor: colors.card ?? colors.background },
      ]}
      testID="liv-incidents-card"
    >
      <View style={styles.header}>
        <Ionicons name="warning" size={16} color="#f59e0b" />
        <Text style={[styles.headerLabel, { color: colors.muted }]}>
          Liv was wrong{data?.openCount ? ` · ${data.openCount} open` : ""}
        </Text>
      </View>
      {items.slice(0, 2).map((item) => (
        <Pressable
          key={item.id}
          style={styles.row}
          onPress={() => {
            if (item.bookingId) {
              router.push(asHref(`/bookings/${item.bookingId}`));
            } else if (item.conversationId) {
              router.push(asHref("/(tabs)/inbox"));
            }
          }}
        >
          <Text style={[styles.summary, { color: colors.text }]} numberOfLines={2}>
            {item.summary}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {item.status} · {relativeTime(item.createdAt)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  row: {
    gap: 4,
  },
  summary: {
    fontSize: 14,
    fontWeight: "500",
  },
  meta: {
    fontSize: 11,
  },
});

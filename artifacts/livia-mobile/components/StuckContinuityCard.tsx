import { useQuery } from "@tanstack/react-query";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { customFetch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

type StuckRow = {
  bookingId: string;
  startAt: string;
  customerName: string;
  serviceName: string;
};

export function StuckContinuityCard({ businessId }: { businessId: string }) {
  const colors = useColors();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["stuck-continuity", businessId],
    queryFn: () =>
      customFetch<{ stuck: StuckRow[] }>(
        `/api/businesses/${businessId}/bookings/stuck-continuity`,
      ),
    enabled: !!businessId,
    staleTime: 60_000,
  });

  const rows = data?.stuck ?? [];
  if (rows.length === 0) return null;

  return (
    <View style={[styles.wrap, { borderColor: "#d9770644", backgroundColor: "#d9770612" }]}>
      <View style={styles.head}>
        <Feather name="message-circle" size={16} color="#d97706" />
        <Text style={[styles.title, { color: colors.foreground }]}>
          Waiting on client reply ({rows.length})
        </Text>
      </View>
      {rows.slice(0, 3).map((r) => (
        <Pressable
          key={r.bookingId}
          onPress={() => router.push(`/booking/${r.bookingId}` as never)}
          style={[styles.row, { borderColor: colors.border }]}
        >
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {r.customerName || "Guest"}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {r.serviceName} · {new Date(r.startAt).toLocaleString()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  title: { fontFamily: fonts.bodyMed, fontSize: 13, flex: 1 },
  row: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  name: { fontSize: 14, fontFamily: fonts.bodyMed },
  sub: { fontSize: 11, marginTop: 2 },
});

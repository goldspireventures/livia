import { useQuery } from "@tanstack/react-query";
import { View, Text, StyleSheet } from "react-native";
import { customFetch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { fonts, type } from "@/constants/typography";

type TimelineEntry = {
  type: string;
  label: string;
  at: string;
  context?: Record<string, unknown>;
};

export function BookingTimelineCard({
  businessId,
  bookingId,
}: {
  businessId: string;
  bookingId: string;
}) {
  const colors = useColors();
  const { data, isLoading } = useQuery({
    queryKey: ["booking-timeline", businessId, bookingId],
    queryFn: () =>
      customFetch<{ timeline: TimelineEntry[] }>(
        `/api/businesses/${businessId}/bookings/${bookingId}/timeline`,
      ),
    enabled: !!businessId && !!bookingId,
  });

  const timeline = data?.timeline ?? [];
  if (!isLoading && timeline.length === 0) return null;

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Continuity timeline</Text>
      {isLoading ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Loading…</Text>
      ) : (
        timeline.map((e, i) => (
          <View key={`${e.type}-${i}`} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View style={styles.body}>
              <Text style={[styles.label, { color: colors.foreground }]}>{e.label}</Text>
              {e.context && typeof e.context.mode === "string" ? (
                <Text style={[styles.detail, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {String(e.context.mode)}
                </Text>
              ) : null}
              <Text style={[styles.time, { color: colors.mutedForeground }]}>
                {new Date(e.at).toLocaleString()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.bodyMed,
    fontSize: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  body: { flex: 1 },
  label: { fontSize: 13, fontFamily: fonts.bodyMed },
  detail: { fontSize: 12, marginTop: 2 },
  time: { fontSize: 10, marginTop: 4 },
});

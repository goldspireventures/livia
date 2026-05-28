import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { customFetch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { asHref } from "@/lib/navigation";
import { fonts, type } from "@/constants/typography";

type Row = {
  id: string;
  bookingId: string;
  score: number;
  comment: string | null;
  createdAt: string;
};

export function VisitFeedbackCard({ businessId }: { businessId: string }) {
  const colors = useColors();
  const haptics = useHaptics();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!businessId) return;
    void customFetch<{ data: Row[] }>(`/api/businesses/${businessId}/visit-feedback`)
      .then((r) => setRows(r.data ?? []))
      .catch(() => setRows([]));
  }, [businessId]);

  const low = rows.filter((r) => r.score <= 3);
  if (rows.length === 0) return null;

  return (
    <View
      style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}
      accessibilityLabel="Client feedback"
    >
      <View style={styles.head}>
        <Feather name="star" size={16} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>Client feedback</Text>
        {low.length > 0 ? (
          <Text style={[styles.warn, { color: colors.destructive }]}>
            {low.length} need attention
          </Text>
        ) : null}
      </View>
      {rows.slice(0, 4).map((r) => (
        <Pressable
          key={r.id}
          onPress={() => {
            haptics.tap();
            router.push(asHref(`/booking/${r.bookingId}`));
          }}
          style={styles.row}
        >
          <Text
            style={[
              styles.score,
              { color: r.score <= 3 ? colors.destructive : colors.foreground },
            ]}
          >
            {r.score}/5
            {r.comment ? ` · ${r.comment.slice(0, 48)}` : ""}
          </Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  title: { fontFamily: fonts.bodySemi, fontSize: 14, flex: 1 },
  warn: { ...type.caption, fontSize: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  score: { ...type.body, fontSize: 13, flex: 1 },
});

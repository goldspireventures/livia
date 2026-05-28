import { customFetch } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { useBusiness } from "@/contexts/BusinessContext";
import { ScreenTopBar } from "@/components/ScreenTopBar";
import { aurora, aurum } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { useColors } from "@/hooks/useColors";
import { fonts, type } from "@/constants/typography";

type Report = {
  slug: string;
  title: string;
  sections: Array<{ heading: string; body?: string; bullets?: string[] }>;
};

export default function AccountantPreviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bid) return;
    setLoading(true);
    customFetch<Report>(`/api/businesses/${bid}/reports/accountant_preview`)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [bid]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: 40,
        paddingHorizontal: 16,
      }}
    >
      <View pointerEvents="none" style={styles.glow}>
        <AuroraHalo tone="primary" size={320} style={{ top: -80, right: -60 }} intensity={0.7} />
      </View>

      <ScreenTopBar />
      <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>Back</Text>
      </Pressable>

      <Text style={[styles.eyebrow, { color: aurum.champagne }]}>TRUST & REPORTING</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {report?.title ?? "Accountant preview"}
      </Text>
      <Text style={[styles.lede, { color: colors.mutedForeground }]}>
        Read-only snapshot for your bookkeeper — revenue, VAT hints, and payroll export pointers.
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      ) : !report ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.mutedForeground }}>Could not load preview.</Text>
        </View>
      ) : (
        report.sections.map((s, i) => (
          <View
            key={s.heading}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              elevation.resting,
            ]}
          >
            <View style={styles.cardHead}>
              <View style={[styles.index, { backgroundColor: aurum.champagne + "22" }]}>
                <Text style={[styles.indexText, { color: aurum.champagne }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{s.heading}</Text>
            </View>
            {s.body ? (
              <Text style={[styles.body, { color: colors.mutedForeground }]}>{s.body}</Text>
            ) : null}
            {s.bullets?.map((b) => (
              <View key={b} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: aurora.cyan }]}>·</Text>
                <Text style={[styles.bullet, { color: colors.foreground }]}>{b}</Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },
  back: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  backText: { fontFamily: fonts.bodySemi, fontSize: 15 },
  eyebrow: { ...type.eyebrow, marginBottom: 6 },
  title: { fontFamily: fonts.serifMedium, fontSize: 30, marginBottom: 8 },
  lede: { ...type.body, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  index: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 16, flex: 1 },
  body: { fontSize: 14, lineHeight: 20 },
  bulletRow: { flexDirection: "row", gap: 8, paddingLeft: 4 },
  bulletDot: { fontSize: 16, lineHeight: 20 },
  bullet: { flex: 1, fontSize: 14, lineHeight: 20 },
});

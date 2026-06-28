import { customFetch } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { useBusiness } from "@/contexts/BusinessContext";
import { ScreenTopBar } from "@/components/ScreenTopBar";
import { aurora, aurum } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { useColors } from "@/hooks/useColors";
import { fonts, type } from "@/constants/typography";
import { dashboardSettingsUrl } from "@/lib/dashboard-url";

type Report = {
  slug: string;
  title: string;
  sections: Array<{ heading: string; body?: string; bullets?: string[] }>;
};

type WellnessDigest = {
  slug: string;
  title: string;
  lines: string[];
};

type ExportPreview = {
  preview: Report extends infer _ ? {
    businessName: string;
    revenue: { completedBookings: number; grossMinor: number; currency: string };
    payroll: { preflightOk: boolean; issueCount: number; csvPreviewLines: string[] };
    disclaimer: string;
  } : never;
};

async function loadAccountantReport(bid: string, vertical?: string | null): Promise<Report | null> {
  try {
    return await customFetch<Report>(`/api/businesses/${bid}/reports/accountant_preview`);
  } catch {
    // Wellness digest fallback (package liability view)
    if (vertical === "wellness") {
      try {
        const digest = await customFetch<WellnessDigest>(
          `/api/businesses/${bid}/wellness/digest/accountant_preview`,
        );
        return {
          slug: digest.slug,
          title: digest.title,
          sections: [{ heading: "Summary", bullets: digest.lines }],
        };
      } catch {
        /* try export next */
      }
    }
    try {
      const exported = await customFetch<ExportPreview>(
        `/api/businesses/${bid}/reports/accountant_preview/export`,
      );
      const p = exported.preview;
      if (!p) return null;
      return {
        slug: "accountant_preview",
        title: "Accountant preview",
        sections: [
          {
            heading: "Revenue (7 days)",
            body: `${p.revenue.completedBookings} completed · ${(p.revenue.grossMinor / 100).toFixed(2)} ${p.revenue.currency}`,
          },
          {
            heading: "Payroll preflight",
            body: p.payroll.preflightOk
              ? "Shifts look clean for export."
              : `${p.payroll.issueCount} issue(s) — resolve before payroll export.`,
          },
          { heading: "Preview", bullets: p.payroll.csvPreviewLines },
          { heading: "Note", body: p.disclaimer },
        ],
      };
    } catch {
      return null;
    }
  }
}

export default function AccountantPreviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const reload = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    setLoadFailed(false);
    const data = await loadAccountantReport(bid, vertical);
    setReport(data);
    setLoadFailed(!data);
    setLoading(false);
  }, [bid, vertical]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: "transparent" }]}
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
          <Text style={{ color: colors.mutedForeground }}>
            {loadFailed
              ? "Preview is still building for this shop — pull to retry or open the full report on web."
              : "No preview data yet."}
          </Text>
          <Pressable
            onPress={() => void reload()}
            style={[styles.retryBtn, { borderColor: colors.border }]}
          >
            <Feather name="refresh-cw" size={14} color={colors.primary} />
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </Pressable>
          {bid ? (
            <Pressable
              onPress={() => void Linking.openURL(dashboardSettingsUrl("billing", bid))}
              style={[styles.retryBtn, { borderColor: colors.primary }]}
            >
              <Text style={[styles.retryText, { color: colors.primary }]}>Open on web</Text>
              <Feather name="external-link" size={14} color={colors.primary} />
            </Pressable>
          ) : null}
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
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },
  retryText: { fontFamily: fonts.bodySemi, fontSize: 14 },
});

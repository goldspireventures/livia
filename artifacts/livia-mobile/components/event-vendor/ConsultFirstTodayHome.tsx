import { Feather } from "@expo/vector-icons";
import {
  consultFirstBriefingLine,
  resolveConsultFirstOwnerHomeBriefingCta,
} from "@workspace/policy";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LivPulse } from "@/components/brand/LivPulse";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { asHref } from "@/lib/navigation";
import type { ConsultDashboard } from "@/lib/event-vendor-consult";

type Props = {
  dash: ConsultDashboard | null;
  handoffCount: number;
  loading?: boolean;
  livLine?: string;
  livLoading?: boolean;
};

export function ConsultFirstTodayHome({ dash, handoffCount, loading, livLine, livLoading }: Props) {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();

  const stats = dash ?? {
    newEnquiries: 0,
    quotedEnquiries: 0,
    staleQuotes: 0,
    staleQuotesList: [],
    prepTaskList: [],
  };

  const briefing =
    livLine ??
    consultFirstBriefingLine({
      newEnquiries: stats.newEnquiries,
      quotedEnquiries: stats.quotedEnquiries,
      staleQuotes: stats.staleQuotes,
      handoffs: handoffCount,
    });

  const cta = resolveConsultFirstOwnerHomeBriefingCta({
    newEnquiries: stats.newEnquiries,
    staleQuotes: stats.staleQuotes,
    handoffs: handoffCount,
  });

  const ctaRoute =
    cta.href === "/inbox"
      ? "/(tabs)/inbox"
      : cta.href === "/quotes"
        ? "/quotes"
        : cta.href === "/event-site"
          ? "/event-site"
          : cta.href;

  return (
    <Animated.View entering={FadeInDown.duration(320)} style={styles.wrap}>
      <View style={[styles.briefing, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.briefingTop}>
          <LivPulse size={28} />
          <View style={{ flex: 1, minWidth: 0 }}>
            {livLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.livLine, { color: colors.foreground }]}>{briefing}</Text>
            )}
          </View>
        </View>
        <GlowPressable
          onPress={() => {
            haptics.tap();
            router.push(asHref(ctaRoute));
          }}
          glowColor={colors.primary}
          haptic="selection"
          contentStyle={[styles.ctaInner, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>{cta.label}</Text>
          <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
        </GlowPressable>
      </View>

      <View style={styles.kpiRow}>
        <KpiTile label="New" value={stats.newEnquiries} colors={colors} onPress={() => router.push(asHref("/(tabs)/inbox"))} />
        <KpiTile label="Quoted" value={stats.quotedEnquiries} colors={colors} onPress={() => router.push(asHref("/quotes"))} />
        <KpiTile
          label="Follow up"
          value={stats.staleQuotes}
          colors={colors}
          warn={stats.staleQuotes > 0}
          onPress={() => router.push(asHref("/quotes"))}
        />
      </View>

      {loading ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 13, paddingHorizontal: 4 }}>Refreshing pipeline…</Text>
      ) : null}

      {stats.lowFitList?.slice(0, 2).map((row) => (
        <Pressable
          key={row.enquiryId}
          onPress={() => {
            haptics.tap();
            router.push(asHref("/(tabs)/inbox"));
          }}
          style={[styles.row, { borderColor: colors.border, backgroundColor: colors.muted + "22" }]}
        >
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>{row.contactName}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{row.headline}</Text>
        </Pressable>
      ))}

      {stats.staleQuotesList?.slice(0, 2).map((row) => (
        <Pressable
          key={row.quoteId}
          onPress={() => {
            haptics.tap();
            router.push(asHref(`/quotes?id=${row.quoteId}`));
          }}
          style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>{row.contactName}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            Quote quiet {row.daysSinceSent}d — tap to follow up
          </Text>
        </Pressable>
      ))}

      {stats.prepTaskList?.slice(0, 2).map((row) => (
        <Pressable
          key={`${row.quoteId}-${row.taskId}`}
          onPress={() => {
            haptics.tap();
            router.push(asHref(`/quotes?id=${row.quoteId}`));
          }}
          style={[styles.row, { borderColor: colors.primary + "44", backgroundColor: colors.primary + "08" }]}
        >
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>{row.label}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {row.contactName} · {row.overdue ? "Overdue" : `Due ${row.dueDate}`}
          </Text>
        </Pressable>
      ))}

      {stats.pipelineForecast && stats.pipelineForecast.quotedMinor > 0 ? (
        <View style={[styles.forecast, { borderColor: "#10b98155", backgroundColor: "#10b98112" }]}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>Pipeline forecast</Text>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>
            €{(stats.pipelineForecast.expectedMinor / 100).toLocaleString("en-IE", { minimumFractionDigits: 0 })}
            <Text style={{ fontSize: 12, fontWeight: "400", color: colors.mutedForeground }}>
              {" "}
              of €{(stats.pipelineForecast.quotedMinor / 100).toLocaleString("en-IE", { minimumFractionDigits: 0 })}{" "}
              quoted
            </Text>
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{stats.pipelineForecast.weightLabel}</Text>
        </View>
      ) : null}

      {stats.replyBenchmark ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 12, paddingHorizontal: 4 }}>
          Reply speed: {stats.replyBenchmark.label}
        </Text>
      ) : null}
    </Animated.View>
  );
}

function KpiTile({
  label,
  value,
  colors,
  warn,
  onPress,
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof useColors>;
  warn?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.kpi,
        {
          borderColor: warn ? "#b45309" : colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: warn ? "#b45309" : colors.foreground, fontSize: 22, fontWeight: "600" }}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, paddingHorizontal: 16 },
  briefing: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  briefingTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  livLine: { ...type.body, fontSize: 15, lineHeight: 22 },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: { fontFamily: fonts.bodyMed, fontSize: 14 },
  kpiRow: { flexDirection: "row", gap: 8 },
  kpi: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10 },
  row: { borderWidth: 1, borderRadius: 12, padding: 12 },
  rowTitle: { fontFamily: fonts.bodyMed, fontSize: 15, marginBottom: 2 },
  forecast: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
});

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { usePersona } from "@/hooks/usePersona";

const PLACEHOLDERS = [
  {
    id: "a1",
    customer: "Niamh O'Reilly",
    ask: "Refund €60 — first balayage went wrong",
    flagged: "Lara · senior stylist",
    amount: "€60",
  },
  {
    id: "a2",
    customer: "Pádraig Murphy",
    ask: "Waive late-cancel fee · client unwell",
    flagged: "Bríd · front desk",
    amount: "€15",
  },
  {
    id: "a3",
    customer: "Saoirse Doherty",
    ask: "Manual override · double-booked 14:30",
    flagged: "Liv (auto-flagged)",
    amount: "€110",
  },
];

export default function ApprovalsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { kind } = usePersona();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const greeting =
    kind === "founder"
      ? "Three rooms, three calls."
      : kind === "manager"
        ? "Three things need your eye."
        : "Approvals queue.";

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      <View pointerEvents="none" style={styles.glowWrap}>
        <AuroraHalo tone="primary" size={420} style={{ top: -160, left: -100 }} intensity={0.85} />
      </View>

      <View style={styles.headerBlock}>
        <LiviaWordmark size="sm" color={colors.foreground} />
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>The queue</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Approvals</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>{greeting}</Text>
      </View>

      <View
        style={[
          styles.counter,
          { backgroundColor: colors.card, borderColor: aurora.violet + "44" },
          elevation.resting,
        ]}
      >
        <Text style={[styles.counterNum, { color: colors.foreground }]}>3</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.counterLabel, { color: colors.mutedForeground }]}>pending decisions</Text>
          <Text style={[styles.counterMeta, { color: aurora.violet }]}>€185 in motion</Text>
        </View>
      </View>

      {PLACEHOLDERS.map((row) => (
        <View
          key={row.id}
          style={[
            styles.row,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.rowAccent, { backgroundColor: aurora.violet }]} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.rowTop}>
              <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                {row.customer}
              </Text>
              <Text style={[styles.rowAmount, { color: aurora.violet }]}>{row.amount}</Text>
            </View>
            <Text style={[styles.rowAsk, { color: colors.foreground }]} numberOfLines={2}>
              {row.ask}
            </Text>
            <Text style={[styles.rowFlag, { color: colors.mutedForeground }]} numberOfLines={1}>
              flagged by {row.flagged}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      ))}

      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
        Swipe-to-approve and full thread sheets land in the next persona build.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 140, gap: 14 },
  glowWrap: { position: "absolute", top: 0, left: 0, right: 0, height: 320, overflow: "hidden" },
  headerBlock: { gap: 4 },
  eyebrow: { ...type.eyebrow, fontSize: 11 },
  title: { fontFamily: fonts.serifMedium, fontSize: 38, lineHeight: 44, letterSpacing: -0.6 },
  sub: { ...type.body, fontSize: 14, marginTop: 2 },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  counterNum: { fontFamily: fonts.serifMedium, fontSize: 42, letterSpacing: -1 },
  counterLabel: { ...type.body, fontSize: 13 },
  counterMeta: { ...type.numericSm, fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    overflow: "hidden",
  },
  rowAccent: { width: 3, alignSelf: "stretch", borderRadius: 2 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowName: { fontFamily: fonts.bodySemi, fontSize: 15, flex: 1 },
  rowAmount: { ...type.numericSm, fontSize: 14, marginLeft: 8 },
  rowAsk: { ...type.body, fontSize: 13.5 },
  rowFlag: { ...type.caption, fontSize: 11 },
  footnote: { ...type.caption, fontSize: 11, textAlign: "center", marginTop: 16, opacity: 0.7 },
});

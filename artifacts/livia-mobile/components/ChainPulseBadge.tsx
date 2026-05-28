import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, type } from "@/constants/typography";
import type { ChainPulseStatus } from "@/lib/chain-rollup";
import { useColors } from "@/hooks/useColors";

const TONE: Record<
  ChainPulseStatus,
  { label: string; fg: string; bg: string; border: string; icon: keyof typeof Feather.glyphMap }
> = {
  ok: { label: "OK", fg: "#34d399", bg: "#34d39918", border: "#34d39944", icon: "check-circle" },
  watch: { label: "Watch", fg: "#fbbf24", bg: "#fbbf2418", border: "#fbbf2444", icon: "eye" },
  act: { label: "Act", fg: "#f87171", bg: "#f8717118", border: "#f8717144", icon: "alert-triangle" },
};

export function ChainPulseBadge({ status }: { status: ChainPulseStatus }) {
  const t = TONE[status];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Feather name={t.icon} size={11} color={t.fg} />
      <Text style={[styles.text, { color: t.fg }]}>{t.label}</Text>
    </View>
  );
}

export function ChainPulseReason({ reason }: { reason: string | null }) {
  const colors = useColors();
  if (!reason) return null;
  return (
    <Text style={[styles.reason, { color: colors.mutedForeground }]} numberOfLines={2}>
      {reason}
    </Text>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  text: { ...type.eyebrow, fontSize: 10, letterSpacing: 0.5 },
  reason: { ...type.caption, fontSize: 12, marginTop: 4 },
});

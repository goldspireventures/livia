import React from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import colors, { aurora } from "@/constants/colors";
import { fonts } from "@/constants/typography";

// Aurora-aligned status palette. Tints derived from semantic tokens
// (warning, primary cyan, mint success, destructive, muted).
const LIGHT: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "#fef3e7", color: colors.light.warning,     label: "Pending" },
  CONFIRMED: { bg: "#e0f7fb", color: aurora.cyan,              label: "Confirmed" },
  COMPLETED: { bg: "#e0f7ee", color: aurora.mint,              label: "Completed" },
  CANCELLED: { bg: "#fde8e8", color: colors.light.destructive, label: "Cancelled" },
  NO_SHOW:   { bg: colors.light.muted, color: colors.light.mutedForeground, label: "No-show" },
};
const DARK: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "rgba(245,158,11,0.15)", color: colors.dark.warning,     label: "Pending" },
  CONFIRMED: { bg: "rgba(6,182,212,0.18)",  color: aurora.cyan,             label: "Confirmed" },
  COMPLETED: { bg: "rgba(16,185,129,0.18)", color: aurora.mint,             label: "Completed" },
  CANCELLED: { bg: "rgba(239,68,68,0.15)",  color: colors.dark.destructive, label: "Cancelled" },
  NO_SHOW:   { bg: colors.dark.muted, color: colors.dark.mutedForeground, label: "No-show" },
};

interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  const scheme = useColorScheme();
  // Default to dark per ADR 0008
  const map = scheme === "light" ? LIGHT : DARK;
  const config = map[status] ?? map["NO_SHOW"];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  text: {
    fontSize: 10.5,
    fontFamily: fonts.bodySemi,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});

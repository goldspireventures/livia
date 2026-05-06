import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { aurora } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";

interface StatsCardProps {
  label: string;
  value: string | number;
  color?: string;
  subtitle?: string;
  variant?: "default" | "hero";
}

export function StatsCard({
  label,
  value,
  color,
  subtitle,
  variant = "default",
}: StatsCardProps) {
  const colors = useColors();
  const accent = color ?? colors.primary;

  if (variant === "hero") {
    return (
      <View style={styles.heroWrap}>
        <LinearGradient
          colors={[aurora.violet + "44", aurora.cyan + "44", aurora.mint + "22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBorder}
        >
          <View
            style={[
              styles.heroInner,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: accent + "33" }]}>
              <View style={[styles.dotInner, { backgroundColor: accent }]} />
            </View>
            <Text style={[styles.value, styles.heroValue, { color: colors.foreground }]}>
              {value}
            </Text>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: accent }]}>{subtitle}</Text>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: accent + "33" }]}>
        <View style={[styles.dotInner, { backgroundColor: accent }]} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: accent }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    minWidth: 100,
  },
  heroWrap: { flex: 1 },
  heroBorder: {
    flex: 1,
    borderRadius: 15,
    padding: 1,
  },
  heroInner: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
    minWidth: 100,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  value: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  heroValue: { fontSize: 28 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});

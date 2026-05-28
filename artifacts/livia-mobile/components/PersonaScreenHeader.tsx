import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { PERSONA_ACCENT, usePersona } from "@/hooks/usePersona";

export function PersonaScreenHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  const colors = useColors();
  const { kind } = usePersona();
  const accent = PERSONA_ACCENT[kind];

  return (
    <View style={styles.wrap}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <LiviaWordmark size="sm" color={colors.foreground} />
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginBottom: 4 },
  accent: { width: 28, height: 3, borderRadius: 2, marginBottom: 6 },
  eyebrow: { ...type.eyebrow, fontSize: 11, marginTop: 4 },
  title: { fontFamily: fonts.serifMedium, fontSize: 36, lineHeight: 42, letterSpacing: -0.6 },
  sub: { ...type.body, fontSize: 14, marginTop: 2 },
});

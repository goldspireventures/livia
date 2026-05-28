import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { PERSONA_LABEL, isDemoLoginEnabled, usePersona } from "@/hooks/usePersona";

export function PersonaPreviewBanner({ hint }: { hint?: string }) {
  const colors = useColors();
  const { kind, override } = usePersona();
  if (!isDemoLoginEnabled || !override) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.warning + "18", borderColor: colors.warning + "44" }]}>
      <Feather name="eye" size={16} color={colors.warning} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Previewing {PERSONA_LABEL[kind]}
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          {hint ??
            "This is the app layout for that role. For real permissions, sign out and use the demo account for that persona (More → Demo guide)."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  title: { fontFamily: fonts.bodySemi, fontSize: 13 },
  body: { ...type.caption, fontSize: 12, lineHeight: 17, marginTop: 2 },
});

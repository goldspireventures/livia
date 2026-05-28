import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

export function ScreenPurpose({
  title,
  body,
  icon = "info",
}: {
  title: string;
  body: string;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.muted + "55", borderColor: colors.border },
      ]}
    >
      <Feather name={icon} size={16} color={colors.primary} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  title: { fontFamily: fonts.bodySemi, fontSize: 14 },
  body: { ...type.body, fontSize: 13, lineHeight: 19 },
});

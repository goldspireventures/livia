import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import {
  resolveLivWaitlistNudgeCopy,
  shouldShowLivWaitlistNudge,
} from "@workspace/policy";

/** Mobile parity — subtle Liv waitlist nudge on Today when count ≥ threshold. */
export function LivWaitlistNudge({
  activeCount,
}: {
  activeCount: number;
}) {
  const colors = useColors();
  if (!shouldShowLivWaitlistNudge(activeCount)) return null;

  const copy = resolveLivWaitlistNudgeCopy(activeCount);

  return (
    <View
      style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.muted + "33" }]}
      testID="liv-waitlist-nudge"
    >
      <Feather name="zap" size={14} color={colors.primary} style={styles.icon} />
      <View style={styles.body}>
        <Text style={[styles.line, { color: colors.foreground }]}>
          <Text style={styles.livLabel}>Liv</Text>
          {" · "}
          {copy.line}
        </Text>
        <Text style={[styles.subline, { color: colors.mutedForeground }]}>{copy.subline}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  icon: { marginTop: 2 },
  body: { flex: 1, minWidth: 0 },
  line: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  livLabel: { fontFamily: fonts.bodySemi },
  subline: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, marginTop: 2 },
});

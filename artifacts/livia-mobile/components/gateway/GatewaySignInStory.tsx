import { StyleSheet, Text, View } from "react-native";
import { aurum } from "@/constants/colors";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

/** W2 mobile sign-in story — stacked Liv colleague (gateway-default-mobile.target). */
export function GatewaySignInStory({ compact = false }: { compact?: boolean }) {
  const colors = useColors();

  if (compact) {
    return (
      <View style={styles.wrapCompact} testID="gateway-sign-in-story">
        <Text style={[styles.kicker, { color: colors.primary }]}>Your people-business OS</Text>
        <Text style={[styles.headlineCompact, { color: colors.foreground }]}>
          <Text style={{ color: aurum.champagne }}>Tuesday morning, </Text>
          handled.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap} testID="gateway-sign-in-story">
      <Text style={[styles.kicker, { color: colors.primary }]}>Your people-business OS</Text>
      <Text style={[styles.headline, { color: aurum.champagne }]}>
        Tuesday morning,
      </Text>
      <Text style={[styles.headline, { color: colors.foreground }]}>handled.</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        Livia is the company you trust. Liv runs the floor — bookings, messages, the awkward
        reschedules. Calm. Present. European.
      </Text>
      <View
        style={[styles.briefing, { borderColor: colors.border, backgroundColor: colors.card + "cc" }]}
        testID="gateway-sign-in-liv-briefing"
      >
        <Text style={[styles.briefingLabel, { color: colors.primary }]}>Liv · briefing</Text>
        <Text style={[styles.briefingLine, { color: colors.foreground }]}>
          Three no-shows avoided this week.
        </Text>
        <Text style={[styles.briefingSub, { color: colors.mutedForeground }]}>
          Thursday has three open slots — worth a nudge.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    width: "100%",
  },
  wrapCompact: {
    marginBottom: 4,
    width: "100%",
    alignItems: "center",
    gap: 6,
  },
  kicker: {
    ...type.caption,
    fontFamily: fonts.bodyMed,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  headline: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    marginTop: 8,
  },
  headlineCompact: {
    fontFamily: fonts.serifMedium,
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
  },
  body: {
    ...type.body,
    marginTop: 12,
    lineHeight: 22,
  },
  briefing: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  briefingLabel: {
    fontSize: 11,
    fontFamily: fonts.bodyMed,
  },
  briefingLine: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  briefingSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: fonts.body,
  },
});

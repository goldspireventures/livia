import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { aurum } from "@/constants/colors";
import { fonts } from "@/constants/typography";

/**
 * Livia brand mark — RN port of marketing/src/components/brand/LiviaMark.tsx.
 * The L stays white-ish (or `fill`) and the italic v gets the champagne sweep.
 *
 * Sizing follows a single `size` prop (square, in px) so callers don't need
 * to think about width/height separately.
 */
export function LiviaMark({ size = 28, fill = "#ffffff" }: { size?: number; fill?: string }) {
  const id = React.useId().replace(/:/g, "");
  const cg = `cg-${id}`;
  const glow = `glow-${id}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Defs>
        <SvgLinearGradient id={cg} x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor={aurum.cream} />
          <Stop offset="45%" stopColor={aurum.champagne} />
          <Stop offset="60%" stopColor={aurum.bronze} />
          <Stop offset="78%" stopColor={aurum.champagne} />
          <Stop offset="100%" stopColor={aurum.cream} />
        </SvgLinearGradient>
        <RadialGradient id={glow} cx="0.3" cy="0.3" r="0.7">
          <Stop offset="0%" stopColor={aurum.champagne} stopOpacity="0.18" />
          <Stop offset="65%" stopColor={aurum.champagne} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="20" cy="20" r="19" fill={`url(#${glow})`} stroke={fill} strokeOpacity="0.32" strokeWidth="1" />
      <SvgText
        x="11.5"
        y="27"
        fontFamily={fonts.serif}
        fontSize="20"
        fill={fill}
      >
        L
      </SvgText>
      <SvgText
        x="22"
        y="27"
        fontFamily={fonts.serifItalic}
        fontStyle="italic"
        fontSize="20"
        fill={`url(#${cg})`}
      >
        v
      </SvgText>
    </Svg>
  );
}

/**
 * Wordmark = mark + serif "Livia" with the italic v in champagne. Used at the
 * top-left of every primary screen (sign-in, dashboard, bookings, customers,
 * more) so the brand never disappears — guidance from `livia.io`.
 *
 * On platforms that support MaskedView (iOS + Android) the italic v gets a
 * proper champagne gradient. On web we degrade to a champagne fill — close
 * enough; the brand reads correctly either way.
 */
export function LiviaWordmark({
  size = "md",
  color = "#ffffff",
}: {
  size?: "sm" | "md" | "lg";
  color?: string;
}) {
  const markPx = size === "lg" ? 36 : size === "sm" ? 22 : 28;
  const fontSize = size === "lg" ? 32 : size === "sm" ? 20 : 26;

  const v =
    Platform.OS === "web" ? (
      <Text style={[styles.v, { fontSize, color: aurum.champagne }]}>v</Text>
    ) : (
      <MaskedView
        maskElement={<Text style={[styles.v, { fontSize, color: "#fff" }]}>v</Text>}
      >
        <LinearGradient
          colors={[aurum.cream, aurum.champagne, aurum.bronze, aurum.champagne, aurum.cream]}
          locations={[0, 0.45, 0.6, 0.78, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ height: fontSize * 1.1 }}
        >
          <Text style={[styles.v, { fontSize, color: "transparent" }]}>v</Text>
        </LinearGradient>
      </MaskedView>
    );

  return (
    <View style={styles.row}>
      <LiviaMark size={markPx} fill={color} />
      <View style={styles.textRow}>
        <Text style={[styles.text, { fontSize, color }]}>Li</Text>
        {v}
        <Text style={[styles.text, { fontSize, color }]}>ia</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  textRow: { flexDirection: "row", alignItems: "baseline" },
  text: { fontFamily: fonts.serif, includeFontPadding: false, letterSpacing: 0.2 },
  v: { fontFamily: fonts.serifItalic, fontStyle: "italic", includeFontPadding: false, letterSpacing: 0.2 },
});

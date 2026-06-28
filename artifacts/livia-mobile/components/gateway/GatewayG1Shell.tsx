import { Feather } from "@expo/vector-icons";
import React, { type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { GatewayScreenShell } from "@/components/gateway/GatewayScreenShell";
import { fonts } from "@/constants/typography";
import { useMobileSurface } from "@/hooks/useMobileSurface";
import { GATEWAY_LAYOUT, usePhoneLayout } from "@/lib/mobile-layout";
import { gatewayTheme } from "@/lib/gateway-theme";

type Props = {
  children: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  showBadges?: boolean;
  testID?: string;
  footer?: ReactNode;
};

/**
 * W2 G1 shell — mobile port of `GatewayDemoLauncherShell` (demo /demo).
 */
export function GatewayG1Shell({
  children,
  onBack,
  backLabel = "Home",
  showBadges = true,
  testID,
  footer,
}: Props) {
  const { tokens: colors } = useMobileSurface("demo-g1");
  const { g1HeroTitle } = usePhoneLayout();

  return (
    <GatewayScreenShell surfaceId="demo-g1" testID={testID}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: GATEWAY_LAYOUT.contentBottomPad,
          paddingHorizontal: GATEWAY_LAYOUT.padX,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} style={styles.back} testID="mobile-demo-back-entry">
              <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.55)" />
              <Text style={styles.backText}>{backLabel}</Text>
            </Pressable>
          ) : (
            <View />
          )}
          {showBadges ? (
            <View style={styles.badges}>
              <View style={styles.badgePrimary}>
                <Feather name="lock" size={10} color={gatewayTheme.primaryChampagne} />
                <Text style={styles.badgePrimaryText}>Demo gateway</Text>
              </View>
              <Text style={styles.badgeG1}>G1 locked</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.hero}>
          <LiviaWordmark size="lg" color={colors.foreground} />
        </View>

        {children}
        {footer}
      </ScrollView>
    </GatewayScreenShell>
  );
}

export function GatewayG1Hero({
  title,
  titleAccent,
  lede,
  hint,
}: {
  title: string;
  titleAccent?: string;
  lede: string;
  hint?: ReactNode;
}) {
  const { g1HeroTitle, compact } = usePhoneLayout();
  return (
    <View style={styles.heroBlock}>
      <Text style={[styles.h1, { fontSize: g1HeroTitle, lineHeight: g1HeroTitle + 4 }]}>
        {title}
        {titleAccent ? <Text style={styles.h1Italic}> {titleAccent}</Text> : null}
      </Text>
      <Text style={[styles.lede, compact && styles.ledeCompact]}>{lede}</Text>
      {hint}
    </View>
  );
}

export function GatewayG1Footer() {
  return (
    <Text style={styles.footer}>
      <Text style={styles.footerStrong}>One platform.</Text>{" "}
      <Text style={styles.footerItalic}>Infinite</Text> possibilities.
    </Text>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 12, fontFamily: fonts.mono, color: "rgba(255,255,255,0.55)" },
  badges: { alignItems: "flex-end", gap: 6 },
  badgePrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: `${gatewayTheme.primaryChampagne}66`,
    backgroundColor: `${gatewayTheme.primaryChampagne}1a`,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgePrimaryText: {
    fontSize: 9,
    fontFamily: fonts.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: gatewayTheme.primaryChampagne,
  },
  badgeG1: {
    fontSize: 9,
    fontFamily: fonts.mono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: gatewayTheme.aurumChampagne,
    borderWidth: 1,
    borderColor: `${gatewayTheme.aurumChampagne}66`,
    backgroundColor: `${gatewayTheme.aurumChampagne}1a`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hero: { marginBottom: 4 },
  heroBlock: { alignItems: "flex-start", gap: 10, marginBottom: 8 },
  h1: {
    fontFamily: fonts.serifMedium,
    letterSpacing: -0.5,
    color: "#fff",
  },
  h1Italic: {
    fontFamily: fonts.serifItalic,
    color: gatewayTheme.primaryChampagne,
  },
  lede: {
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.65)",
    maxWidth: 380,
  },
  ledeCompact: {
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 13,
    fontFamily: fonts.serif,
    color: "rgba(255,255,255,0.5)",
    alignSelf: "center",
  },
  footerStrong: { color: "rgba(255,255,255,0.72)" },
  footerItalic: {
    fontFamily: fonts.serifItalic,
    color: gatewayTheme.primaryChampagne,
  },
});

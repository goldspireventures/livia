import React, { type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { LiviaMark, LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { ConstellationGlassCard } from "@/components/constellation/ConstellationGlassCard";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { GatewayScreenShell } from "@/components/gateway/GatewayScreenShell";
import { fonts, type } from "@/constants/typography";
import { useMobileSurface } from "@/hooks/useMobileSurface";
import { GATEWAY_LAYOUT, MIN_TOUCH, usePhoneLayout } from "@/lib/mobile-layout";
import type { MobilePreAuthSurfaceId } from "@workspace/policy";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  below?: ReactNode;
  headerAction?: ReactNode;
  surfaceId?: Extract<MobilePreAuthSurfaceId, "gateway-auth" | "guest-hub">;
  scroll?: boolean;
  keyboardAware?: boolean;
  testID?: string;
  contentStyle?: ViewStyle;
};

/**
 * Mobile port of web `GatewayAuthPageShell` — policy preset + frosted auth card.
 */
export function GatewayAuthShell({
  title,
  subtitle,
  children,
  footer,
  below,
  headerAction,
  surfaceId = "gateway-auth",
  scroll = true,
  keyboardAware = false,
  testID,
  contentStyle,
}: Props) {
  const { tokens: colors } = useMobileSurface(surfaceId);
  const { compact, short, gatewayAuthTitle, cardMaxWidth } = usePhoneLayout();

  const body = (
    <View style={[styles.main, contentStyle]}>
      <View style={[styles.cardWrap, { maxWidth: cardMaxWidth }]}>
        <ConstellationGlassCard testID={testID} style={styles.card}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.markRing,
                compact && styles.markRingCompact,
                { borderColor: colors.primary + "33", backgroundColor: colors.primary + "0d" },
              ]}
            >
              <LiviaMark size={compact ? 32 : 36} fill={colors.foreground} />
            </View>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.foreground, fontSize: gatewayAuthTitle, lineHeight: gatewayAuthTitle + 6 },
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text style={[type.caption, styles.cardSubtitle, { color: colors.mutedForeground }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.cardBody}>{children}</View>
        </ConstellationGlassCard>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
        {below}
      </View>
    </View>
  );

  const scrollProps = {
    contentContainerStyle: [
      styles.scroll,
      {
        paddingBottom: GATEWAY_LAYOUT.contentBottomPad,
        flexGrow: 1,
        justifyContent: (short ? "flex-start" : "center") as "flex-start" | "center",
        paddingTop: short ? 8 : 0,
      },
    ],
    keyboardShouldPersistTaps: "handled" as const,
    showsVerticalScrollIndicator: false,
  };

  return (
    <GatewayScreenShell surfaceId={surfaceId}>
      <View style={styles.header}>
        <View style={styles.headerSide}>{headerAction ?? <View style={styles.headerSpacer} />}</View>
        <LiviaWordmark size="md" color={colors.foreground} />
        <View style={styles.headerSide}>
          <View style={styles.headerSpacer} />
        </View>
      </View>
      {scroll ? (
        keyboardAware ? (
          <KeyboardAwareScrollViewCompat {...scrollProps} extraKeyboardSpace={24}>
            {body}
          </KeyboardAwareScrollViewCompat>
        ) : (
          <ScrollView {...scrollProps}>{body}</ScrollView>
        )
      ) : (
        body
      )}
    </GatewayScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GATEWAY_LAYOUT.padX,
    paddingTop: GATEWAY_LAYOUT.headerPadY,
    paddingBottom: 8,
  },
  headerSide: {
    width: MIN_TOUCH,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerSpacer: { width: MIN_TOUCH, height: MIN_TOUCH },
  scroll: {
    paddingHorizontal: GATEWAY_LAYOUT.padX,
  },
  main: {
    justifyContent: "center",
  },
  cardWrap: {
    width: "100%",
    alignSelf: "center",
    gap: 16,
  },
  card: {
    padding: GATEWAY_LAYOUT.authCardPad,
    gap: 16,
  },
  cardHeader: {
    alignItems: "center",
    gap: 10,
  },
  markRing: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  markRingCompact: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  cardTitle: {
    fontFamily: fonts.serifMedium,
    textAlign: "center",
  },
  cardSubtitle: {
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  cardBody: {
    gap: 12,
  },
  footer: {
    alignItems: "center",
  },
});

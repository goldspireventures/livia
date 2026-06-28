import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { ConstellationGlassCard } from "@/components/constellation/ConstellationGlassCard";
import { GatewayScreenShell } from "@/components/gateway/GatewayScreenShell";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { fonts, type } from "@/constants/typography";
import { useMobileSurface } from "@/hooks/useMobileSurface";
import { GATEWAY_LAYOUT, MIN_TOUCH, usePhoneLayout } from "@/lib/mobile-layout";
import { markSignUpFormReset } from "@/lib/mobile-entry-routing";
import { LIVIA_MOBILE_ENTRY_COPY } from "@workspace/policy";

/**
 * Production cold open — guest My Livia setup vs business registration only.
 * Staff sign-in lives on the sign-in screen (secondary) or invite deep link.
 */
export function AppEntryGateway() {
  const { tokens: colors } = useMobileSurface("gateway-cold-open");
  const { compact, short, cardMaxWidth } = usePhoneLayout();
  const router = useRouter();
  const copy = LIVIA_MOBILE_ENTRY_COPY;
  const champagne = colors.primary;

  function goGuest() {
    router.push("/my-livia" as never);
  }

  function goOperatorRegister() {
    markSignUpFormReset();
    router.replace("/sign-in?mode=sign-up" as never);
  }

  return (
    <GatewayScreenShell surfaceId="gateway-cold-open" testID="app-entry-gateway">
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: short ? 20 : 32,
            paddingBottom: GATEWAY_LAYOUT.contentBottomPad,
            flexGrow: 1,
            justifyContent: (short ? "flex-start" : "center") as "flex-start" | "center",
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(420).springify().damping(18)} style={styles.brand}>
          <LiviaWordmark size={compact ? "lg" : "xl"} color={colors.foreground} />
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{copy.subtitle}</Text>
        </Animated.View>

        <View style={[styles.cards, { maxWidth: cardMaxWidth, alignSelf: "center", width: "100%" }]}>
          <Animated.View entering={FadeInDown.delay(80).duration(400).springify()}>
            <GlowPressable
              onPress={goGuest}
              testID="entry-gateway-guest"
              glowColor={champagne}
              haptic="impact"
              style={styles.cardPressable}
            >
              <ConstellationGlassCard style={styles.doorCard}>
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.iconWrap, { backgroundColor: champagne + "18", borderColor: champagne + "40" }]}
                  >
                    <Feather name="calendar" size={22} color={champagne} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{copy.guestTitle}</Text>
                    <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{copy.guestBody}</Text>
                  </View>
                  <Feather name="arrow-right" size={18} color={champagne} />
                </View>
              </ConstellationGlassCard>
            </GlowPressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).duration(400).springify()}>
            <GlowPressable
              onPress={goOperatorRegister}
              testID="entry-gateway-operator-register"
              glowColor={champagne}
              haptic="impact"
              style={styles.cardPressable}
            >
              <ConstellationGlassCard style={styles.doorCard}>
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.iconWrap, { backgroundColor: champagne + "18", borderColor: champagne + "40" }]}
                  >
                    <Feather name="briefcase" size={22} color={champagne} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{copy.operatorTitle}</Text>
                    <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{copy.operatorBody}</Text>
                  </View>
                  <Feather name="arrow-right" size={18} color={champagne} />
                </View>
              </ConstellationGlassCard>
            </GlowPressable>
          </Animated.View>
        </View>
      </ScrollView>
    </GatewayScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: GATEWAY_LAYOUT.padX,
    gap: GATEWAY_LAYOUT.sectionGap,
  },
  brand: {
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
  },
  subtitle: {
    ...type.body,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  cards: {
    gap: GATEWAY_LAYOUT.cardGap,
  },
  cardPressable: {
    width: "100%",
    minHeight: MIN_TOUCH,
  },
  doorCard: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  cardTextCol: {
    flex: 1,
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    lineHeight: 22,
  },
  cardBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
});

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LiviaMark, LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { ConstellationGlassCard } from "@/components/constellation/ConstellationGlassCard";
import { GatewayScreenShell } from "@/components/gateway/GatewayScreenShell";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { fonts } from "@/constants/typography";
import { useMobileSurface } from "@/hooks/useMobileSurface";
import { GATEWAY_LAYOUT, MIN_TOUCH, usePhoneLayout } from "@/lib/mobile-layout";
import { rememberGuestDoor, rememberOperatorDoor } from "@/lib/mobile-entry-routing";
import { LIVIA_MOBILE_ENTRY_COPY } from "@workspace/policy";

/**
 * Production cold open — constellation preset, question + two answer cards.
 */
export function AppEntryGateway() {
  const { tokens: colors } = useMobileSurface("gateway-cold-open");
  const { compact, short, cardMaxWidth } = usePhoneLayout();
  const router = useRouter();
  const copy = LIVIA_MOBILE_ENTRY_COPY;
  const champagne = colors.primary;

  function goGuest() {
    void rememberGuestDoor().then(() => router.push("/my-livia" as never));
  }

  function goOperator() {
    void rememberOperatorDoor().then(() => router.push("/sign-in" as never));
  }

  function goCreateAccount() {
    void rememberOperatorDoor().then(() => router.push("/sign-in?mode=sign-up" as never));
  }

  return (
    <GatewayScreenShell surfaceId="gateway-cold-open" testID="app-entry-gateway">
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: short ? 16 : 28,
            paddingBottom: GATEWAY_LAYOUT.contentBottomPad,
            flexGrow: 1,
            justifyContent: (short ? "flex-start" : "center") as "flex-start" | "center",
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(420).springify().damping(18)} style={styles.brand}>
          <View style={[styles.markRing, { borderColor: champagne + "33", backgroundColor: champagne + "0d" }]}>
            <LiviaMark size={compact ? 40 : 48} fill={colors.foreground} />
          </View>
          <LiviaWordmark size={compact ? "md" : "lg"} color={colors.foreground} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            {copy.titleLead}{" "}
            <Text style={[styles.titleAccent, { color: champagne }]}>{copy.titleAccent}</Text>
          </Text>
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
                <View style={styles.cardRow}>
                  <View
                    style={[styles.iconWrap, { backgroundColor: champagne + "18", borderColor: champagne + "40" }]}
                  >
                    <Feather name="calendar" size={22} color={champagne} />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{copy.guestTitle}</Text>
                  <Feather name="arrow-right" size={18} color={champagne} />
                </View>
              </ConstellationGlassCard>
            </GlowPressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).duration(400).springify()}>
            <GlowPressable
              onPress={goOperator}
              testID="entry-gateway-operator"
              glowColor={champagne}
              haptic="impact"
              style={styles.cardPressable}
            >
              <ConstellationGlassCard style={styles.doorCard}>
                <View style={styles.cardRow}>
                  <View
                    style={[styles.iconWrap, { backgroundColor: champagne + "18", borderColor: champagne + "40" }]}
                  >
                    <Feather name="briefcase" size={22} color={champagne} />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{copy.operatorTitle}</Text>
                  <Feather name="arrow-right" size={18} color={champagne} />
                </View>
              </ConstellationGlassCard>
            </GlowPressable>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(220).duration(380).springify()} style={styles.createRow}>
          <Text style={[styles.createLead, { color: colors.mutedForeground }]}>{copy.createAccountLead}</Text>
          <Pressable onPress={goCreateAccount} hitSlop={8} testID="entry-gateway-create-account">
            <Text style={[styles.createCta, { color: champagne }]}>{copy.createAccountCta} →</Text>
          </Pressable>
        </Animated.View>
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
    gap: 10,
    marginBottom: 4,
  },
  markRing: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
    maxWidth: 320,
    letterSpacing: -0.4,
    marginTop: 8,
  },
  titleAccent: {
    fontFamily: fonts.serifItalic,
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
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    lineHeight: 22,
  },
  createRow: {
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  createLead: {
    fontSize: 13,
    fontFamily: fonts.body,
  },
  createCta: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },
});

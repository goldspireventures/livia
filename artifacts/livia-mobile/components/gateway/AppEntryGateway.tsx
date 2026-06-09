import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { isDemoLoginEnabled } from "@/hooks/usePersona";
import { LIVIA_MOBILE_ENTRY_COPY } from "@workspace/policy";

export function AppEntryGateway() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const copy = LIVIA_MOBILE_ENTRY_COPY;

  function goOperator() {
    haptics.tap();
    router.push("/sign-in" as never);
  }

  function goGuest() {
    haptics.tap();
    router.push("/my-livia" as never);
  }

  function goDemo() {
    haptics.tap();
    router.push("/demo" as never);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="app-entry-gateway">
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <AuroraHalo tone="primary" size={480} intensity={0.85} style={{ top: -100, left: -60 }} />
        <AuroraHalo tone="ambient" size={320} intensity={0.45} style={{ bottom: 80, right: -80 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <LiviaWordmark size="lg" color={colors.foreground} />
          <Text style={[styles.kicker, { color: colors.primary }]}>{copy.kicker}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{copy.title}</Text>
        </View>

        <View style={styles.cards}>
          <Pressable
            onPress={goGuest}
            testID="entry-gateway-guest"
            style={({ pressed }) => [
              styles.card,
              elevation.floating,
              {
                backgroundColor: colors.card + "f2",
                borderColor: colors.primary + "55",
              },
              pressed && styles.cardPressed,
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="calendar" size={22} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{copy.guestTitle}</Text>
              <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{copy.guestBody}</Text>
              <Text style={[styles.cardCta, { color: colors.primary }]}>{copy.guestCta} →</Text>
              <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>{copy.guestPhoneHint}</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={goOperator}
            testID="entry-gateway-operator"
            style={({ pressed }) => [
              styles.card,
              elevation.floating,
              {
                backgroundColor: colors.card + "f2",
                borderColor: colors.border,
              },
              pressed && styles.cardPressed,
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: aurora.violet + "22" }]}>
              <Feather name="briefcase" size={22} color={aurora.violet} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{copy.operatorTitle}</Text>
              <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{copy.operatorBody}</Text>
              <Text style={[styles.cardCta, { color: aurora.violet }]}>{copy.operatorCta} →</Text>
            </View>
          </Pressable>

          {isDemoLoginEnabled ? (
            <Pressable
              onPress={goDemo}
              testID="entry-gateway-demo"
              style={({ pressed }) => [
                styles.demoLink,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={[styles.demoLinkTitle, { color: colors.foreground }]}>
                {copy.demoTitle}
              </Text>
              <Text style={[styles.demoLinkBody, { color: colors.mutedForeground }]}>
                {copy.demoBody}
              </Text>
              <Text style={[styles.cardCta, { color: colors.primary }]}>{copy.demoCta} →</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 22,
    flexGrow: 1,
    justifyContent: "center",
    gap: 28,
  },
  brand: {
    alignItems: "center",
    gap: 10,
  },
  kicker: {
    ...type.caption,
    fontFamily: fonts.bodyMed,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 16,
  },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 26,
    lineHeight: 32,
    textAlign: "center",
    maxWidth: 300,
  },
  cards: {
    gap: 14,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 17,
  },
  cardBody: {
    ...type.caption,
    lineHeight: 18,
  },
  cardCta: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    marginTop: 4,
  },
  cardHint: {
    fontSize: 11,
    fontFamily: fonts.body,
  },
  demoLink: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 4,
    alignItems: "center",
  },
  demoLinkTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  demoLinkBody: {
    ...type.caption,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 300,
  },
});

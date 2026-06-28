import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { fonts } from "@/constants/typography";
import { useHaptics } from "@/hooks/useHaptics";
import {
  isG1WedgeWorldUnlocked,
  listG1WedgeWorldsForDisplay,
  type G1WedgeWorld,
} from "@/lib/g1-wedge-worlds";
import { getGatewayAssetsBaseUrl } from "@/lib/dashboard-url";
import { gatewayTheme } from "@/lib/gateway-theme";
import { getWedgeDemoStory } from "@workspace/policy";

const G1_TRADE_CHIP: Record<string, string> = {
  beauty: "Beauty",
  wellness: "Wellness",
  barber: "Barber",
  hair: "Hair salon",
  medspa: "Medspa",
  tattoo: "Body art",
};

function wedgeImageUrl(world: G1WedgeWorld): string {
  return `${getGatewayAssetsBaseUrl()}${world.imagePath}`;
}

export function MobileDemoWedgeGrid() {
  const router = useRouter();
  const haptics = useHaptics();
  const worlds = listG1WedgeWorldsForDisplay();

  function openWorld(world: G1WedgeWorld) {
    if (!isG1WedgeWorldUnlocked(world.vertical)) return;
    haptics.tap();
    router.push(`/demo/wedge/${world.vertical}?world=${encodeURIComponent(world.key)}` as never);
  }

  return (
    <View style={styles.section} testID="mobile-demo-wedge-grid">
      <Text style={styles.liveNow}>
        <Text style={styles.liveNowStrong}>Live now:</Text> Beauty · Wellness · Hair · Medspa — scroll
        for all worlds.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
        snapToInterval={212}
        decelerationRate="fast"
      >
        {worlds.map((world) => {
          const unlocked = isG1WedgeWorldUnlocked(world.vertical);
          const story = getWedgeDemoStory(world.vertical);
          const hook = unlocked ? story?.beats[0]?.headline : null;

          return (
            <GlowPressable
              key={world.key}
              onPress={() => openWorld(world)}
              disabled={!unlocked}
              glowColor={gatewayTheme.primaryChampagne}
              haptic="impact"
              fill
              contentStyle={{ width: CARD_W, height: CARD_H }}
              testID={`mobile-demo-wedge-${world.key}`}
              accessibilityLabel={`${world.title} — ${unlocked ? "open demo" : "coming soon"}`}
              style={[
                styles.card,
                unlocked && styles.cardUnlocked,
                !unlocked && styles.cardLocked,
                { opacity: !unlocked ? 0.72 : 1 },
              ]}
            >
              <View style={styles.mediaWell}>
                <Image
                  source={{ uri: wedgeImageUrl(world) }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.mediaScrim} />
              </View>
              <View style={styles.base} />
              <View style={[styles.frame, unlocked && styles.frameUnlocked]} />
              <View style={styles.iconRingWrap}>
                <View style={[styles.iconRing, unlocked && styles.iconRingUnlocked]} />
              </View>

              <View style={styles.copy}>
                {G1_TRADE_CHIP[world.key] ? (
                  <Text style={styles.trade}>{G1_TRADE_CHIP[world.key]}</Text>
                ) : null}
                <Text style={[styles.title, unlocked && styles.titleUnlocked]}>{world.title}</Text>
                <Text style={styles.tagline}>{world.tagline}</Text>
                {hook ? <Text style={styles.hook}>{hook}</Text> : null}
              </View>

              <View style={[styles.cta, unlocked && styles.ctaUnlocked]}>
                {unlocked ? (
                  <>
                    <Text style={[styles.ctaText, styles.ctaTextUnlocked]}>Enter world</Text>
                    <Feather name="arrow-right" size={12} color={gatewayTheme.goldLight} />
                  </>
                ) : (
                  <>
                    <Feather name="lock" size={11} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.ctaText}>Coming soon</Text>
                  </>
                )}
              </View>
            </GlowPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CARD_W = 200;
const CARD_H = 320;

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  liveNow: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 14,
  },
  liveNowStrong: { color: "rgba(255,255,255,0.72)" },
  track: { gap: 12, paddingRight: 8, paddingBottom: 8 },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#04080c",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardUnlocked: {
    shadowColor: gatewayTheme.primaryChampagne,
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  cardLocked: {},
  mediaWell: {
    position: "absolute",
    left: 7,
    right: 7,
    top: 7,
    height: "58%",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  mediaScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    // gradient simulated via layered opacity at bottom of photo
    borderBottomWidth: 40,
    borderBottomColor: "rgba(0,0,0,0.35)",
  },
  base: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "52%",
    backgroundColor: "rgba(2,5,8,0.95)",
  },
  frame: {
    position: "absolute",
    left: 6,
    right: 6,
    top: 6,
    bottom: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${gatewayTheme.aurumChampagne}73`,
  },
  frameUnlocked: {
    borderColor: `${gatewayTheme.primaryChampagne}8c`,
  },
  iconRingWrap: {
    position: "absolute",
    top: "54%",
    left: "50%",
    marginLeft: -26,
    marginTop: -26,
    zIndex: 3,
  },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(217,195,154,0.85)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  iconRingUnlocked: {
    shadowColor: gatewayTheme.primaryChampagne,
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  copy: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 52,
    paddingHorizontal: 14,
    alignItems: "center",
    zIndex: 3,
  },
  trade: {
    fontSize: 9,
    fontFamily: fonts.mono,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
  },
  titleUnlocked: { color: gatewayTheme.primaryChampagne },
  tagline: {
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    marginTop: 4,
  },
  hook: {
    fontSize: 10,
    color: "rgba(255,255,255,0.42)",
    textAlign: "center",
    marginTop: 6,
  },
  cta: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingVertical: 8,
    zIndex: 3,
  },
  ctaUnlocked: {
    borderColor: `${gatewayTheme.primaryChampagne}80`,
    backgroundColor: `${gatewayTheme.primaryChampagne}1f`,
  },
  ctaText: {
    fontSize: 10,
    fontFamily: fonts.bodySemi,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
  },
  ctaTextUnlocked: { color: gatewayTheme.goldLight },
});

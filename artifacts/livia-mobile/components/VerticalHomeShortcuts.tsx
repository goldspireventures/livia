import { resolveVerticalKey } from "@workspace/policy";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { asHref } from "@/lib/navigation";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { verticalAccentHex } from "@/lib/vertical-theme";

const SHORTCUTS: Record<
  string,
  Array<{ id: string; title: string; desc: string; href: string; icon: keyof typeof Feather.glyphMap }>
> = {
  hair: [
    { id: "team", title: "Team", desc: "Roster & invites", href: "/staff", icon: "users" },
    { id: "liv", title: "Tune Liv", desc: "Mandate & tools", href: "/liv-mandate", icon: "cpu" },
  ],
  beauty: [
    { id: "inbox", title: "Inbox", desc: "DM threads", href: "/inbox", icon: "message-circle" },
    { id: "liv", title: "Tune Liv", desc: "Mandate & tools", href: "/liv-mandate", icon: "cpu" },
  ],
  "body-art": [
    { id: "proofs", title: "Design proofs", desc: "Approve art", href: "/design-proofs", icon: "image" },
    { id: "liv", title: "Tune Liv", desc: "Mandate & tools", href: "/liv-mandate", icon: "cpu" },
  ],
  wellness: [
    { id: "book", title: "Bookings", desc: "Sessions today", href: "/bookings", icon: "calendar" },
    { id: "liv", title: "Tune Liv", desc: "Mandate & tools", href: "/liv-mandate", icon: "cpu" },
  ],
  fitness: [
    { id: "book", title: "Bookings", desc: "Classes & PT", href: "/bookings", icon: "calendar" },
    { id: "liv", title: "Tune Liv", desc: "Mandate & tools", href: "/liv-mandate", icon: "cpu" },
  ],
  medspa: [
    { id: "clinical", title: "Clinical hub", desc: "Consents & intakes", href: "/clinical-hub", icon: "activity" },
    { id: "liv", title: "Tune Liv", desc: "Mandate & tools", href: "/liv-mandate", icon: "cpu" },
  ],
  "allied-health": [
    { id: "clients", title: "Clients", desc: "Care pathways", href: "/customers", icon: "user" },
    { id: "liv", title: "Tune Liv", desc: "Mandate & tools", href: "/liv-mandate", icon: "cpu" },
  ],
  "pet-grooming": [
    { id: "clients", title: "Pet parents", desc: "Profiles & notes", href: "/customers", icon: "heart" },
    { id: "liv", title: "Tune Liv", desc: "Mandate & tools", href: "/liv-mandate", icon: "cpu" },
  ],
  "automotive-detailing": [
    { id: "book", title: "Bookings", desc: "Bay schedule", href: "/bookings", icon: "calendar" },
    { id: "liv", title: "Tune Liv", desc: "Mandate & tools", href: "/liv-mandate", icon: "cpu" },
  ],
};

export function VerticalHomeShortcuts() {
  const { currentBusiness } = useBusiness();
  const colors = useColors();
  const haptics = useHaptics();
  const router = useRouter();
  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const key = resolveVerticalKey(vertical, currentBusiness?.category);
  const pack = verticalPackUi(vertical, currentBusiness?.category);
  const accent = verticalAccentHex(vertical, currentBusiness?.category);
  const items = SHORTCUTS[key] ?? SHORTCUTS.hair;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.mutedForeground }]}>
        {pack.label} · shortcuts
      </Text>
      <View style={styles.grid}>
        {items.map((m, i) => (
          <Animated.View key={m.id} entering={FadeInRight.delay(i * 60).duration(320)}>
            <Pressable
              onPress={() => {
                haptics.tap();
                router.push(asHref(m.href));
              }}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: accent + "44" },
                elevation.resting,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: accent + "22" }]}>
                <Feather name={m.icon} size={16} color={accent} />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {m.title}
              </Text>
              <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {m.desc}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  heading: { ...type.eyebrow, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: 158,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.bodySemi, fontSize: 14 },
  desc: { fontSize: 11, lineHeight: 15 },
});

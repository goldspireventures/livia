import { Feather } from "@expo/vector-icons";
import type { PresentationLayoutMorph } from "@workspace/policy";
import { resolvePresentationLayoutMorphSafe } from "@/lib/presentation-layout";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { fonts } from "@/constants/typography";
import { useHaptics } from "@/hooks/useHaptics";
import { asHref } from "@/lib/navigation";
import { usePresentationAccent } from "@/contexts/PresentationThemeContext";

type Lane = { id: string; label: string; icon: keyof typeof Feather.glyphMap; href: string };

const MORPH_LANES: Partial<Record<PresentationLayoutMorph, Lane[]>> = {
  "split-inbox": [
    { id: "inbox", label: "Inbox lane", icon: "inbox", href: "/inbox" },
    { id: "bookings", label: "Chair lane", icon: "calendar", href: "/bookings" },
  ],
  cockpit: [
    { id: "bookings", label: "Floor", icon: "grid", href: "/bookings" },
    { id: "inbox", label: "Signals", icon: "activity", href: "/inbox" },
  ],
  "menu-card": [
    { id: "bookings", label: "Menu", icon: "layers", href: "/bookings" },
    { id: "customers", label: "Guests", icon: "users", href: "/customers" },
  ],
  atrium: [
    { id: "bookings", label: "Rooms", icon: "home", href: "/bookings" },
    { id: "inbox", label: "Reception", icon: "message-circle", href: "/inbox" },
  ],
  ledger: [
    { id: "bookings", label: "Ledger", icon: "book-open", href: "/bookings" },
    { id: "more", label: "Reports", icon: "bar-chart-2", href: "/more" },
  ],
  "timeline-rail": [
    { id: "bookings", label: "Sessions", icon: "clock", href: "/bookings" },
    { id: "inbox", label: "Guest comms", icon: "mail", href: "/inbox" },
  ],
  pipeline: [
    { id: "bookings", label: "Pipeline", icon: "git-branch", href: "/bookings" },
    { id: "customers", label: "Guests", icon: "users", href: "/customers" },
  ],
  constellation: [
    { id: "bookings", label: "Today", icon: "sun", href: "/bookings" },
    { id: "inbox", label: "Inbox", icon: "inbox", href: "/inbox" },
  ],
};

const MORPH_LABEL: Partial<Record<PresentationLayoutMorph, string>> = {
  "split-inbox": "Split inbox morph",
  cockpit: "Cockpit morph",
  "menu-card": "Menu card morph",
  atrium: "Atrium morph",
  ledger: "Evening ledger morph",
  "timeline-rail": "Session rail morph",
  pipeline: "Pipeline morph",
  constellation: "Schedule",
  standard: "Standard layout",
};

type Props = {
  vertical?: string | null;
  category?: string | null;
  cssPreset?: string | null;
};

export function MobileTodayMorphStrip({ vertical, category, cssPreset }: Props) {
  const router = useRouter();
  const haptics = useHaptics();
  const morph = resolvePresentationLayoutMorphSafe(vertical, cssPreset);
  const lanes = MORPH_LANES[morph] ?? MORPH_LANES.constellation!;
  const accent = usePresentationAccent();
  const label = MORPH_LABEL[morph] ?? "Today layout";

  if (vertical !== "beauty" && vertical !== "wellness") return null;

  return (
    <Animated.View entering={FadeInDown.delay(120).duration(380).springify()} style={styles.wrap}>
      <Text style={[styles.morphLabel, { color: accent }]}>{label}</Text>
      <View style={styles.laneRow}>
        {lanes.map((lane, i) => (
          <GlowPressable
            key={lane.id}
            onPress={() => {
              haptics.selection();
              router.push(asHref(lane.href));
            }}
            glowColor={accent}
            haptic="selection"
            style={[
              styles.lane,
              {
                borderColor: accent + (i === 0 ? "55" : "33"),
                backgroundColor: accent + (i === 0 ? "14" : "08"),
              },
            ]}
          >
            <Feather name={lane.icon} size={15} color={accent} />
            <Text style={[styles.laneText, { color: accent }]}>{lane.label}</Text>
            <Feather name="chevron-right" size={14} color={accent + "aa"} />
          </GlowPressable>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 14 },
  morphLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  laneRow: { flexDirection: "row", gap: 10 },
  lane: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  laneText: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
});

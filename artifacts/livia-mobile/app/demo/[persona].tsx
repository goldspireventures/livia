/**
 * Mobile demo · per-persona showcase
 *
 * Single-file, hand-crafted distinct surfaces — proves the hotel principle
 * on phones. The point is *not* to be a full mobile app for every persona
 * (that lands in the mobile-roadmap Phase B–D builds). It's to land an
 * unmistakable first frame the moment the visitor crosses the threshold.
 */

import { Feather } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { asHref } from "@/lib/navigation";
import React, { useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { aurora } from "@/constants/colors";
import { fonts } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

interface PersonaSpec {
  id: string;
  displayName: string;
  roleLabel: string;
  accent: string;
  welcomeLine: string;
  welcomeSub: string;
  ritualLine: string;
  alertText: string;
  alertLabel: string;
  alertIcon: keyof typeof Feather.glyphMap;
  nativeMomentTitle: string;
  nativeMomentBody: string;
  nativeMomentIcon: keyof typeof Feather.glyphMap;
}

const SPECS: Record<string, PersonaSpec> = {
  org_admin: {
    id: "org_admin", displayName: "Aoife Brennan", roleLabel: "Org admin · 3 locations", accent: "#d9c39a",
    welcomeLine: "Good morning, Aoife.",
    welcomeSub: "Three rooms, one quiet read.",
    ritualLine: "The morning glance — what's healthy, what needs a hand.",
    alertText: "Cork is light today (71% util). Liv suggests opening two 18:00 walk-in slots.",
    alertLabel: "Liv just acted", alertIcon: "cpu",
    nativeMomentTitle: "Daily glance · Live Activity",
    nativeMomentBody: "Your three-shop digest surfaces on the Lock Screen at 7:42 AM, before you open the app.",
    nativeMomentIcon: "smartphone",
  },
  owner: {
    id: "owner", displayName: "Sarah Kavanagh", roleLabel: "Single-shop owner", accent: aurora.cyan,
    welcomeLine: "Today's flight plan, Sarah.",
    welcomeSub: "Nine bookings · two waiting on you.",
    ritualLine: "Confirm what's pending. Watch the timeline. Trust Liv with the rest.",
    alertText: "Liv just confirmed a 14:30 colour for Saoirse — replied in 18 seconds at 2:14 AM.",
    alertLabel: "Liv just acted", alertIcon: "cpu",
    nativeMomentTitle: "Cockpit widget",
    nativeMomentBody: "Today's bookings, pending count, Liv's overnight wins — all glanceable on your home screen.",
    nativeMomentIcon: "grid",
  },
  manager: {
    id: "manager", displayName: "Áine Connolly", roleLabel: "Manager · ADMIN", accent: aurora.violet,
    welcomeLine: "Three things need your eye, Áine.",
    welcomeSub: "Sarah's away — you're the steady hand today.",
    ritualLine: "Approvals first. Exceptions second. Money never reaches you.",
    alertText: "A new hire request from Tomás needs a sign-off — same shift two weeks running.",
    alertLabel: "Decision needed", alertIcon: "alert-circle",
    nativeMomentTitle: "Push · 'Áine, decision needed'",
    nativeMomentBody: "Approvals reach you the moment they're raised — never an open browser tab away.",
    nativeMomentIcon: "bell",
  },
  staff: {
    id: "staff",
    displayName: "Lara McCarthy",
    roleLabel: "Staff · your chair",
    accent: aurora.mint,
    welcomeLine: "Hey Lara — next up at 10:30.",
    welcomeSub: "Sinéad's balayage, your favourite kind of morning.",
    ritualLine: "One countdown. One chair. One person at a time.",
    alertText: "Sinéad confirmed her 10:30. She mentioned her wedding is Saturday — small note saved.",
    alertLabel: "Customer note",
    alertIcon: "heart",
    nativeMomentTitle: "Live Activity · countdown",
    nativeMomentBody:
      "Your Lock Screen knows when the next chair starts — no app to open, no clock to check.",
    nativeMomentIcon: "clock",
  },
  receptionist: {
    id: "receptionist", displayName: "Bríd Murphy", roleLabel: "Front desk", accent: "#818cf8",
    welcomeLine: "The wall, Bríd.",
    welcomeSub: "Four staff, nine appointments, one Aoibhinn waiting on a callback.",
    ritualLine: "Watch the wall. Take the call. Move the pin.",
    alertText: "Aoibhinn (12:00) called — running 10 minutes late. Suggest pushing to 12:15?",
    alertLabel: "Live caller", alertIcon: "phone",
    nativeMomentTitle: "Tablet mode · landscape",
    nativeMomentBody: "Drag a chair to a new staff member. The colour-coded grid never lies.",
    nativeMomentIcon: "tablet",
  },
};

const ORDER = ["org_admin", "owner", "manager", "staff", "receptionist"];

function resolveDemoPersonaSlug(raw: string): string | null {
  if (SPECS[raw]) return raw;
  // Legacy route alias
  if (raw === "founder") return "org_admin";
  if (raw === "staff-senior" || raw === "staff-junior") return "staff";
  if (raw === "customer") return null;
  return null;
}

export default function MobilePersonaShowcase() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ persona: string }>();
  const rawSlug = params.persona as string;
  const personaId = resolveDemoPersonaSlug(rawSlug);

  useEffect(() => {
    if (!personaId) {
      router.replace(asHref("/demo"));
      return;
    }
    if (rawSlug !== personaId) {
      router.replace(asHref(`/demo/${personaId}`));
    }
  }, [personaId, rawSlug, router]);

  const spec = personaId ? SPECS[personaId] : undefined;

  if (!spec || !personaId) {
    return null;
  }

  const idx = ORDER.indexOf(spec.id);
  const next = ORDER[(idx + 1) % ORDER.length];
  const prev = ORDER[(idx - 1 + ORDER.length) % ORDER.length];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID={`mobile-demo-showcase-${spec.id}`}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient halo in this persona's colour */}
        <View pointerEvents="none" style={[styles.halo, { backgroundColor: spec.accent, opacity: 0.18 }]} />

        {/* Back to gateway */}
        <Link href={asHref("/demo")} asChild>
          <Pressable
            testID="mobile-demo-back"
            style={[styles.backPill, { borderColor: spec.accent + "55", backgroundColor: colors.card }]}
          >
            <Feather name="arrow-left" size={12} color={colors.mutedForeground} />
            <Text style={[styles.backText, { color: colors.mutedForeground }]}>Back to gateway</Text>
          </Pressable>
        </Link>

        {/* Persona badge */}
        <View style={[styles.badge, { borderColor: spec.accent + "55", backgroundColor: spec.accent + "1a", marginTop: 16 }]}>
          <Feather name="star" size={10} color={spec.accent} />
          <Text style={[styles.badgeText, { color: spec.accent }]}>{spec.roleLabel}</Text>
        </View>

        {/* Welcome */}
        <Text style={[styles.h1, { color: colors.text, fontFamily: fonts.serif }]}>{spec.welcomeLine}</Text>
        <Text style={[styles.h1Italic, { color: colors.mutedForeground, fontFamily: fonts.serifItalic }]}>
          {spec.welcomeSub}
        </Text>
        <Text style={[styles.ritual, { color: colors.mutedForeground, fontFamily: fonts.mono }]}>
          {spec.ritualLine}
        </Text>

        {/* Alert */}
        <View style={[styles.alert, { borderColor: spec.accent + "55", backgroundColor: spec.accent + "12" }]}>
          <View style={[styles.alertIconWrap, { borderColor: spec.accent + "55", backgroundColor: spec.accent + "1a" }]}>
            <Feather name={spec.alertIcon} size={14} color={spec.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertLabel, { color: spec.accent }]}>{spec.alertLabel}</Text>
            <Text style={[styles.alertText, { color: colors.text }]}>{spec.alertText}</Text>
          </View>
        </View>

        {/* Native moment */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Native moment</Text>
        <View style={[styles.native, { borderColor: spec.accent + "55", backgroundColor: colors.card }]}>
          <View style={[styles.alertIconWrap, { borderColor: spec.accent + "55", backgroundColor: spec.accent + "1a" }]}>
            <Feather name={spec.nativeMomentIcon} size={16} color={spec.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.nativeTitle, { color: colors.text }]}>{spec.nativeMomentTitle}</Text>
            <Text style={[styles.nativeBody, { color: colors.text + "cc" }]}>{spec.nativeMomentBody}</Text>
          </View>
        </View>

        <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
          This is the first frame. The full ritual lives in the production app —
          built persona-by-persona along docs/mobile-roadmap.md.
        </Text>
      </ScrollView>

      {/* Persona switcher chip — fixed bottom */}
      <View style={[styles.chipBar, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border, backgroundColor: colors.background + "ee" }]}>
        <Link href={asHref(`/demo/${prev}`)} asChild>
          <Pressable testID="mobile-demo-prev" style={[styles.chipArrow, { borderColor: colors.border }]}>
            <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
          </Pressable>
        </Link>
        <Link href={asHref("/demo")} asChild>
          <Pressable
            testID="mobile-demo-switch"
            style={[styles.chipMain, { borderColor: spec.accent + "55", backgroundColor: spec.accent + "1a" }]}
          >
            <View style={[styles.chipDot, { backgroundColor: spec.accent }]} />
            <Text style={[styles.chipName, { color: spec.accent }]}>{spec.displayName}</Text>
            <Text style={[styles.chipSep, { color: colors.mutedForeground }]}>·</Text>
            <Text style={[styles.chipMuted, { color: colors.mutedForeground }]}>Switch persona</Text>
          </Pressable>
        </Link>
        <Link href={asHref(`/demo/${next}`)} asChild>
          <Pressable testID="mobile-demo-next" style={[styles.chipArrow, { borderColor: colors.border }]}>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  halo: { position: "absolute", top: -160, right: -160, width: 380, height: 380, borderRadius: 380 },
  backPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  backText: { fontSize: 11, fontFamily: fonts.mono },
  badge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 0.6, textTransform: "uppercase" },
  h1: { fontSize: 32, lineHeight: 36, letterSpacing: -0.5, marginTop: 16 },
  h1Italic: { fontSize: 24, lineHeight: 30, fontStyle: "italic", marginTop: 2 },
  ritual: { fontSize: 12, lineHeight: 18, marginTop: 12 },
  alert: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 24 },
  alertIconWrap: { width: 30, height: 30, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  alertLabel: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 },
  alertText: { fontSize: 13, lineHeight: 18 },
  sectionLabel: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 0.6, textTransform: "uppercase", marginTop: 28, marginBottom: 10 },
  native: { flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderRadius: 16, padding: 14 },
  nativeTitle: { fontSize: 13, fontFamily: fonts.bodyMed, marginBottom: 4 },
  nativeBody: { fontSize: 13, lineHeight: 18 },
  footnote: { fontSize: 11, fontFamily: fonts.mono, marginTop: 28, lineHeight: 16, opacity: 0.7 },
  chipBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  chipArrow: { width: 38, height: 38, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chipMain: { flex: 1, height: 38, borderRadius: 999, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  chipDot: { width: 7, height: 7, borderRadius: 7 },
  chipName: { fontSize: 12, fontFamily: fonts.bodyMed },
  chipSep: { fontSize: 12 },
  chipMuted: { fontSize: 11, fontFamily: fonts.mono },
});

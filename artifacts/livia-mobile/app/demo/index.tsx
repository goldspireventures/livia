/**
 * Mobile demo gateway · launcher
 *
 * Public route — no Clerk required (see app/_layout.tsx AuthGate bypass).
 * Mirrors the dashboard `/demo` showcase but with phone-first chrome.
 * Per ADR 0011 (mobile-flagship), this surface is where Livia is *alive*
 * — the per-persona rituals (lock-screen countdown, widget, wallet pass,
 * haptic walk-in tap) feel native here in a way the desktop can't match.
 */

import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { asHref } from "@/lib/navigation";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { aurora } from "@/constants/colors";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

interface PersonaCard {
  id: string;
  displayName: string;
  roleLabel: string;
  tease: string;
  accent: string;
  icon: keyof typeof Feather.glyphMap;
}

const PERSONAS: PersonaCard[] = [
  { id: "org_admin",    displayName: "Aoife Brennan",    roleLabel: "Org admin · 3 locations", tease: "Every location before the first coffee. One glance.", accent: "#d9c39a", icon: "star" },
  { id: "owner",        displayName: "Sarah Kavanagh",   roleLabel: "Single-shop owner",  tease: "The cockpit. Your day, alive in one screen.",       accent: aurora.cyan,  icon: "grid" },
  { id: "manager",      displayName: "Áine Connolly",    roleLabel: "Manager · ADMIN",       tease: "Approvals queue. No money, just judgement calls.",  accent: aurora.violet,icon: "shield" },
  { id: "staff",        displayName: "Lara McCarthy",    roleLabel: "Staff · your chair",    tease: "Your day. Just yours. Countdown to the next chair.", accent: aurora.mint,  icon: "sun" },
  { id: "receptionist", displayName: "Bríd Murphy",      roleLabel: "Front desk",            tease: "The desk view. Every chair, every staff, one wall.", accent: "#818cf8",   icon: "headphones" },
];

export default function MobileDemoLauncher() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="mobile-demo-launcher">
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <AuroraHalo tone="primary" size={440} intensity={0.8} style={{ top: -100, left: -60 }} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero */}
        <View style={[styles.tag, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={[styles.tagDot, { backgroundColor: aurora.cyan }]} />
          <Text style={[styles.tagText, { color: aurora.cyan }]}>Livia · the demo gateway</Text>
        </View>
        <Text style={[styles.h1, { color: colors.text, fontFamily: fonts.serif }]}>
          Same building.
        </Text>
        <Text style={[styles.h1Italic, { color: colors.mutedForeground, fontFamily: fonts.serifItalic }]}>
          A different ritual at every door.
        </Text>
        <Text style={[styles.lede, { color: colors.mutedForeground }]}>
          Pick a persona. Step into their morning. The data is the same — the room
          is theirs.
        </Text>

        {/* Cards */}
        <View style={{ gap: 12, marginTop: 28 }}>
          {PERSONAS.map((p) => (
            <Link key={p.id} href={asHref(`/demo/${p.id}`)} asChild>
              <Pressable
                testID={`mobile-demo-card-${p.id}`}
                style={({ pressed }) => [
                  styles.card,
                  { borderColor: p.accent + "55", backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={[styles.cardHaloMini, { backgroundColor: p.accent }]} />
                <View style={[styles.cardIcon, { borderColor: p.accent + "55", backgroundColor: p.accent + "1a" }]}>
                  <Feather name={p.icon} size={18} color={p.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.cardName, { color: colors.text, fontFamily: fonts.serif }]}>
                    {p.displayName}
                  </Text>
                  <Text style={[styles.cardRole, { color: colors.mutedForeground }]}>{p.roleLabel}</Text>
                  <Text style={[styles.cardTease, { color: colors.text + "cc" }]}>{p.tease}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={p.accent} />
              </Pressable>
            </Link>
          ))}
        </View>

        <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
          Public showcase. No sign-in needed. The full architecture lives in
          docs/personas.md and docs/demo-gateway.md.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  halo: { position: "absolute", top: -120, left: -120, width: 360, height: 360, borderRadius: 360 },
  halo2: { position: "absolute", bottom: -120, right: -120, width: 320, height: 320, borderRadius: 320 },
  tag: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 16 },
  tagDot: { width: 6, height: 6, borderRadius: 6 },
  tagText: { fontSize: 10, fontFamily: fonts.mono, letterSpacing: 1, textTransform: "uppercase" },
  h1: { fontSize: 36, lineHeight: 40, letterSpacing: -0.5 },
  h1Italic: { fontSize: 28, lineHeight: 34, fontStyle: "italic", marginTop: 2, marginBottom: 16 },
  lede: { fontSize: 14, lineHeight: 20, maxWidth: 360 },
  card: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16, padding: 14, overflow: "hidden", position: "relative" },
  cardHaloMini: { position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: 120, opacity: 0.18 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cardName: { fontSize: 18, marginBottom: 1 },
  cardRole: { fontSize: 11, fontFamily: fonts.mono, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 },
  cardTease: { fontSize: 13, lineHeight: 18 },
  footnote: { fontSize: 11, fontFamily: fonts.mono, marginTop: 28, lineHeight: 16, opacity: 0.7 },
});

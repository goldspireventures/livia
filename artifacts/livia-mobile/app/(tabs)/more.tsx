import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet } from "@/components/BottomSheet";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { aurum } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import {
  ALL_PERSONAS,
  PERSONA_ACCENT,
  PERSONA_LABEL,
  isDemoLoginEnabled,
  setDevPersonaOverride,
  usePersona,
  type PersonaKind,
} from "@/hooks/usePersona";

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: "users", label: "Staff", route: "/staff/" },
  { icon: "briefcase", label: "Services", route: "/services/" },
];

export default function MoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { businesses, currentBusiness, setCurrentBusiness } = useBusiness();
  const { signOut } = useAuth();
  const { kind: currentPersona, override } = usePersona();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [personaSheetOpen, setPersonaSheetOpen] = useState(false);

  const handlePickPersona = async (p: PersonaKind | null) => {
    haptics.selection();
    await setDevPersonaOverride(p);
    setPersonaSheetOpen(false);
    router.replace("/" as never);
  };

  const otherBusinesses = businesses.filter((b) => b.id !== currentBusiness?.id);
  const hasOthers = otherBusinesses.length > 0;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8 }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.headerTop}>
        <LiviaWordmark size="sm" color={colors.foreground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>More</Text>

      {/* Current business card — tappable when there are others to switch to */}
      {currentBusiness && (
        <Pressable
          onPress={() => {
            if (!hasOthers) return;
            haptics.tap();
            setSwitcherOpen(true);
          }}
          style={({ pressed }) => [
            styles.businessCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            elevation.resting,
            pressed && hasOthers && { transform: [{ scale: 0.99 }] },
          ]}
          testID="business-card"
        >
          <View
            style={[
              styles.bizAvatar,
              { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" },
            ]}
          >
            <Text style={[styles.bizInitial, { color: colors.primary }]}>
              {currentBusiness.name[0]?.toUpperCase() ?? "B"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>
              {currentBusiness.name}
            </Text>
            {currentBusiness.slug && (
              <Text style={[styles.bizSlug, { color: colors.mutedForeground }]}>
                livia.io/b/{currentBusiness.slug}
              </Text>
            )}
          </View>
          {hasOthers ? (
            <View style={styles.bizCardRight}>
              <View
                style={[
                  styles.activePill,
                  { backgroundColor: aurum.champagne + "22", borderColor: aurum.champagne + "55" },
                ]}
              >
                <Text style={[styles.activePillText, { color: aurum.champagne }]}>Active</Text>
              </View>
              <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            </View>
          ) : null}
        </Pressable>
      )}

      {/* Business switcher → bottom sheet */}
      <BottomSheet visible={switcherOpen} onClose={() => setSwitcherOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Switch business</Text>
        <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
          Pick a workspace to step into.
        </Text>
        <View style={{ marginTop: 14, paddingBottom: 8 }}>
          {otherBusinesses.map((biz) => (
            <Pressable
              key={biz.id}
              onPress={() => {
                haptics.selection();
                setCurrentBusiness(biz);
                setSwitcherOpen(false);
              }}
              style={({ pressed }) => [
                styles.sheetRow,
                pressed && { backgroundColor: colors.muted },
              ]}
              testID={`switch-business-${biz.id}`}
            >
              <View
                style={[
                  styles.sheetAvatar,
                  { backgroundColor: colors.primary + "1c", borderColor: colors.primary + "55" },
                ]}
              >
                <Text style={[styles.switchInitial, { color: colors.primary }]}>
                  {biz.name[0]?.toUpperCase() ?? "B"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]} numberOfLines={1}>
                  {biz.name}
                </Text>
                {biz.slug && (
                  <Text style={[styles.bizSlug, { color: colors.mutedForeground }]}>
                    /b/{biz.slug}
                  </Text>
                )}
              </View>
              <Feather name="arrow-right" size={16} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* Main navigation */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
          elevation.resting,
        ]}
      >
        {MENU_ITEMS.map((item, index) => (
          <Pressable
            key={item.route}
            style={({ pressed }) => [
              styles.menuItem,
              index < MENU_ITEMS.length - 1 && [
                styles.menuItemBorder,
                { borderBottomColor: colors.border },
              ],
              pressed && { backgroundColor: colors.primary + "0c" },
            ]}
            onPress={() => {
              haptics.tap();
              router.push(item.route as never);
            }}
            testID={`menu-${item.label.toLowerCase()}`}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.primary + "1a" }]}>
              <Feather name={item.icon} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      {/* Dev: switch persona */}
      {isDemoLoginEnabled ? (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
            elevation.resting,
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && { backgroundColor: colors.primary + "0c" },
            ]}
            onPress={() => {
              haptics.tap();
              setPersonaSheetOpen(true);
            }}
            testID="switch-persona-button"
          >
            <View
              style={[
                styles.menuIcon,
                { backgroundColor: PERSONA_ACCENT[currentPersona] + "1f" },
              ]}
            >
              <Feather name="users" size={18} color={PERSONA_ACCENT[currentPersona]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>Switch persona</Text>
              <Text style={[styles.bizSlug, { color: colors.mutedForeground }]}>
                {override ? `Override: ${PERSONA_LABEL[currentPersona]}` : `Auto: ${PERSONA_LABEL[currentPersona]}`}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}

      <BottomSheet visible={personaSheetOpen} onClose={() => setPersonaSheetOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Switch persona</Text>
        <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
          Dev-only. The data you see is your own; only the app shell flips.
        </Text>
        <View style={{ marginTop: 14, paddingBottom: 8 }}>
          {ALL_PERSONAS.map((p) => {
            const isCurrent = p === currentPersona;
            const accent = PERSONA_ACCENT[p];
            return (
              <Pressable
                key={p}
                onPress={() => handlePickPersona(p)}
                style={({ pressed }) => [
                  styles.sheetRow,
                  pressed && { backgroundColor: colors.muted },
                ]}
                testID={`persona-row-${p}`}
              >
                <View
                  style={[
                    styles.sheetAvatar,
                    { backgroundColor: accent + "1c", borderColor: accent + "55" },
                  ]}
                >
                  <Text style={[styles.switchInitial, { color: accent }]}>{p[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]} numberOfLines={1}>
                    {PERSONA_LABEL[p]}
                  </Text>
                </View>
                {isCurrent ? (
                  <Text style={[styles.activePillText, { color: accent }]}>Active</Text>
                ) : (
                  <Feather name="arrow-right" size={16} color={accent} />
                )}
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => handlePickPersona(null)}
            style={({ pressed }) => [
              styles.sheetRow,
              pressed && { backgroundColor: colors.muted },
            ]}
            testID="persona-row-auto"
          >
            <View
              style={[
                styles.sheetAvatar,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Feather name="refresh-ccw" size={14} color={colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>Reset to auto-detect</Text>
              <Text style={[styles.bizSlug, { color: colors.mutedForeground }]}>
                Use the persona derived from your real role.
              </Text>
            </View>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Sign out */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
          elevation.resting,
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            pressed && { backgroundColor: colors.destructive + "0c" },
          ]}
          onPress={() => {
            haptics.warning();
            signOut();
          }}
          testID="sign-out-button"
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.destructive + "1a" }]}>
            <Feather name="log-out" size={18} color={colors.destructive} />
          </View>
          <Text style={[styles.menuLabel, { color: colors.destructive }]}>Sign out</Text>
        </Pressable>
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        Livia · v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 140, gap: 16 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  sectionGroup: { gap: 8 },
  sectionLabel: { ...type.eyebrow, fontSize: 11, paddingLeft: 4 },
  businessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  bizAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bizInitial: { ...type.numericSm, fontSize: 22 },
  switchInitial: { ...type.numericSm, fontSize: 14 },
  bizName: { fontFamily: fonts.serifMedium, fontSize: 18 },
  bizSlug: { ...type.caption, fontSize: 12, marginTop: 1 },
  bizCardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  activePill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  activePillText: { fontSize: 10.5, fontFamily: fonts.bodySemi, letterSpacing: 0.6 },
  sheetTitle: { fontFamily: fonts.serifMedium, fontSize: 22, letterSpacing: -0.3, paddingHorizontal: 4 },
  sheetSub: { ...type.body, fontSize: 13, paddingHorizontal: 4, marginTop: 2 },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  sheetAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: { borderBottomWidth: 1 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: { flex: 1, fontSize: 16, fontFamily: fonts.bodyMed },
  version: { ...type.caption, fontSize: 11.5, textAlign: "center", marginTop: 8 },
});

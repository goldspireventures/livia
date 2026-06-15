import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet } from "@/components/BottomSheet";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { OperationalScreen } from "@/components/OperationalScreen";
import { aurum } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { PERSONA_LABEL, usePersona } from "@/hooks/usePersona";
import { useGetTenantCapabilities } from "@workspace/api-client-react";
import {
  filterMobileMenuItems,
  filterMobileMenuItemsByOperatorShape,
  operatorNeedsWorkforceNav,
} from "@workspace/policy";
import { canViewDayPackages, canViewPremises } from "@/lib/settings-persona";
import { menuItemsForPersona } from "@/lib/mobile-menu";
import { getPublicBookingLabel } from "@/lib/public-booking-url";
import { useMobileOwnerIntelTabBadges } from "@/hooks/useMobileOwnerIntelTabBadges";

export default function MoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { businesses, currentBusiness, setCurrentBusiness, isDemoAccount } = useBusiness();
  const { signOut } = useAuth();
  const { kind: currentPersona } = usePersona();
  const tier = (currentBusiness as { tier?: string } | undefined)?.tier;
  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const bid = currentBusiness?.id ?? "";
  const { data: tenantCaps } = useGetTenantCapabilities(bid, {
    query: { enabled: !!bid } as never,
  });
  const rawStaffCount = tenantCaps?.readinessFacts?.staffCount;
  const operatorSignals = {
    tier: tier ?? "solo",
    activeStaffCount: typeof rawStaffCount === "number" ? rawStaffCount : 1,
  };
  const showWorkforceNav = operatorNeedsWorkforceNav(operatorSignals);
  const intelTabBadges = useMobileOwnerIntelTabBadges();
  const settingsBadge = intelTabBadges.more ?? 0;

  const menuItems = filterMobileMenuItemsByOperatorShape(
    filterMobileMenuItems(
      menuItemsForPersona({
        persona: currentPersona,
        vertical,
        tier,
        businessCount: businesses.length,
        showWorkforceNav,
        showPremises: canViewPremises(currentPersona, {
          tier: (currentBusiness as { tier?: string } | undefined)?.tier,
          premisesSharing: (currentBusiness as { premisesSharing?: boolean } | undefined)
            ?.premisesSharing,
        }),
        showDayPackages:
          canViewDayPackages(currentPersona) &&
          (vertical === "wellness" || vertical === "medspa"),
        isDemo: isDemoAccount,
      }),
      tenantCaps?.platformCapabilities,
    ),
    operatorSignals,
  );
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [founderTapCount, setFounderTapCount] = useState(0);
  const [founderTapAt, setFounderTapAt] = useState<number | null>(null);

  const otherBusinesses = businesses.filter((b) => b.id !== currentBusiness?.id);
  const hasOthers = otherBusinesses.length > 0;

  return (
    <OperationalScreen
      ritualPage
      title="More"
      subtitle={
        currentBusiness?.name
          ? `${currentBusiness.name} · ${PERSONA_LABEL[currentPersona]}`
          : PERSONA_LABEL[currentPersona]
      }
      contentStyle={{ paddingBottom: 140 }}
    >
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
                {getPublicBookingLabel(currentBusiness.slug)}
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
                    {getPublicBookingLabel(biz.slug)}
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
        {menuItems.map((item, index) => (
          <Pressable
            key={`${item.section ?? "m"}-${item.route}`}
            style={({ pressed }) => [
              styles.menuItem,
              index < menuItems.length - 1 && [
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
              <Feather name={item.icon as keyof typeof Feather.glyphMap} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
            {item.badgeKey === "settings" && settingsBadge > 0 ? (
              <View style={[styles.menuBadge, { backgroundColor: colors.destructive }]}>
                <Text style={styles.menuBadgeText}>{settingsBadge}</Text>
              </View>
            ) : null}
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

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

      <Pressable
        onPress={() => {
          const now = Date.now();
          const within = founderTapAt ? now - founderTapAt < 2500 : false;
          const nextCount = within ? founderTapCount + 1 : 1;
          setFounderTapAt(now);
          setFounderTapCount(nextCount);
          if (nextCount >= 7) {
            haptics.selection();
            setFounderTapCount(0);
            setFounderTapAt(null);
            router.push("/_internal/desk" as never);
          }
        }}
        style={{ paddingVertical: 6, alignItems: "center" }}
        accessibilityLabel="App version"
        testID="app-version"
      >
        <Text style={[styles.version, { color: colors.mutedForeground }]}>Livia · v1.0.0</Text>
      </Pressable>
    </OperationalScreen>
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
  menuBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  menuBadgeText: { color: "#fff", fontSize: 10, fontFamily: fonts.bodySemi },
  version: { ...type.caption, fontSize: 11.5, textAlign: "center", marginTop: 8 },
});

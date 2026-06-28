import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/constants/typography";
import { useTenantPresentation } from "@/contexts/PresentationThemeContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { usePersona, type PersonaKind } from "@/hooks/usePersona";
import { useBusiness } from "@/contexts/BusinessContext";
import { useTenantExperience } from "@/hooks/useTenantExperience";
import { useMobileOwnerIntelTabBadges } from "@/hooks/useMobileOwnerIntelTabBadges";
import { verticalOperationalCopy } from "@workspace/policy";
import { GatewayHandoffVeil } from "@/components/gateway/GatewayHandoffVeil";
import { MobileOperatorChrome } from "@/components/shell/MobileOperatorChrome";

type TabKey =
  | "index"
  | "my-day"
  | "shops"
  | "approvals"
  | "inbox"
  | "bookings"
  | "customers"
  | "more";

const TAB_VISIBILITY: Record<PersonaKind, TabKey[]> = {
  org_admin: ["index", "shops", "approvals", "inbox", "more"],
  owner: ["index", "bookings", "customers", "inbox", "more"],
  manager: ["approvals", "bookings", "customers", "inbox", "more"],
  staff: ["my-day", "bookings", "customers", "more"],
  receptionist: ["bookings", "customers", "inbox", "more"],
};

/** Ritual labels — aligned with web `persona-rituals.ts` */
const TAB_RITUAL_TITLE: Record<PersonaKind, Partial<Record<TabKey, string>>> = {
  org_admin: { index: "Today", shops: "Glance", approvals: "Approvals", inbox: "Queue" },
  owner: { index: "Today", bookings: "Bookings", inbox: "Inbox", customers: "Clients" },
  manager: { approvals: "Queue", bookings: "Floor", inbox: "Queue", customers: "Clients" },
  staff: { "my-day": "My chair", bookings: "Appointments", customers: "Clients" },
  receptionist: { bookings: "Floor", inbox: "Messages", customers: "Clients" },
};

interface TabSpec {
  name: TabKey;
  title: string;
  sf: { default: string; selected: string };
  feather: keyof typeof Feather.glyphMap;
}

const ALL_TABS: TabSpec[] = [
  { name: "index", title: "Today", sf: { default: "house", selected: "house.fill" }, feather: "home" },
  { name: "my-day", title: "My day", sf: { default: "sun.max", selected: "sun.max.fill" }, feather: "sun" },
  { name: "shops", title: "Shops", sf: { default: "building.2", selected: "building.2.fill" }, feather: "grid" },
  { name: "approvals", title: "Approvals", sf: { default: "checkmark.shield", selected: "checkmark.shield.fill" }, feather: "shield" },
  { name: "inbox", title: "Inbox", sf: { default: "tray", selected: "tray.fill" }, feather: "inbox" },
  { name: "bookings", title: "Bookings", sf: { default: "calendar", selected: "calendar" }, feather: "calendar" },
  { name: "customers", title: "Clients", sf: { default: "person.2", selected: "person.2.fill" }, feather: "users" },
  { name: "more", title: "More", sf: { default: "ellipsis", selected: "ellipsis" }, feather: "menu" },
];

const DEFAULT_VISIBLE: TabKey[] = TAB_VISIBILITY.owner;

export default function TabLayout() {
  return <TabLayoutInner />;
}

function TabLayoutInner() {
  const colors = useColors();
  const presentation = useTenantPresentation();
  const haptics = useHaptics();
  const isDark = presentation.colorMode !== "light";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();
  const { kind, isLoading } = usePersona();
  const { currentBusiness } = useBusiness();
  const { data: tenantXp } = useTenantExperience(currentBusiness?.id);
  const wellnessOp =
    tenantXp?.vertical === "wellness"
      ? verticalOperationalCopy(
          (currentBusiness as { vertical?: string } | undefined)?.vertical,
          currentBusiness?.category,
        )
      : null;
  const intelTabBadges = useMobileOwnerIntelTabBadges();

  const visible = useMemo(
    () => new Set<TabKey>(isLoading ? DEFAULT_VISIBLE : TAB_VISIBILITY[kind]),
    [isLoading, kind],
  );

  const onTabPress = () => haptics.selection();

  const frostedTabBar = presentation.tabBarChrome === "frosted-glass";
  const tabBarBorder = frostedTabBar ? "rgba(217,195,154,0.12)" : colors.border;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <GatewayHandoffVeil />
      <MobileOperatorChrome />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: presentation.colorOverrides.primary ?? colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        sceneStyle: {
          backgroundColor: presentation.transparentScreens ? "transparent" : colors.background,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS
            ? "transparent"
            : frostedTabBar
              ? "rgba(44,47,58,0.92)"
              : colors.background + "ee",
          borderTopWidth: isWeb || frostedTabBar ? StyleSheet.hairlineWidth : 0,
          borderTopColor: tabBarBorder,
          elevation: 0,
          paddingBottom: isWeb ? 0 : insets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={frostedTabBar ? 72 : 90}
              tint={isDark ? "dark" : "light"}
              style={[
                StyleSheet.absoluteFill,
                {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: tabBarBorder,
                  backgroundColor: frostedTabBar ? "rgba(44,47,58,0.55)" : undefined,
                },
              ]}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + "f5" }]} />
          ),
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fonts.bodyMed,
          letterSpacing: 0.3,
        },
        tabBarButton: (props: BottomTabBarButtonProps) => {
          const { onPressIn, ...rest } = props;
          return (
            <PlatformPressable
              {...rest}
              onPressIn={(e) => {
                onTabPress();
                onPressIn?.(e);
              }}
            />
          );
        },
      }}
    >
      {ALL_TABS.map((t) => {
        let ritualTitle = TAB_RITUAL_TITLE[kind]?.[t.name] ?? t.title;
        if (wellnessOp) {
          if (t.name === "bookings") ritualTitle = wellnessOp.bookingsPageTitle;
          if (t.name === "customers") ritualTitle = "Guests";
        }
        return (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: isLoading ? t.title : ritualTitle,
            href: visible.has(t.name) ? undefined : null,
            tabBarBadge:
              intelTabBadges[t.name as keyof typeof intelTabBadges] ?? undefined,
            tabBarIcon: ({ color, focused }) =>
              isIOS ? (
                <SymbolView
                  name={(focused ? t.sf.selected : t.sf.default) as never}
                  tintColor={color}
                  size={focused ? 23 : 21}
                />
              ) : (
                <Feather name={t.feather} size={focused ? 23 : 21} color={color} />
              ),
          }}
        />
      );
      })}
    </Tabs>
    </>
  );
}

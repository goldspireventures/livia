import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { usePersona, type PersonaKind } from "@/hooks/usePersona";

type TabKey = "index" | "my-day" | "shops" | "approvals" | "bookings" | "customers" | "more";

const TAB_VISIBILITY: Record<PersonaKind, TabKey[]> = {
  founder: ["index", "shops", "approvals", "bookings", "more"],
  owner: ["index", "bookings", "customers", "more"],
  manager: ["approvals", "bookings", "customers", "more"],
  "staff-senior": ["my-day", "bookings", "customers", "more"],
  "staff-junior": ["my-day", "bookings", "more"],
  receptionist: ["index", "bookings", "customers", "more"],
  customer: ["index", "more"],
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
  { name: "bookings", title: "Bookings", sf: { default: "calendar", selected: "calendar" }, feather: "calendar" },
  { name: "customers", title: "Clients", sf: { default: "person.2", selected: "person.2.fill" }, feather: "users" },
  { name: "more", title: "More", sf: { default: "ellipsis", selected: "ellipsis" }, feather: "menu" },
];

function NativeTabLayout({ visible }: { visible: Set<TabKey> }) {
  return (
    <NativeTabs>
      {ALL_TABS.filter((t) => visible.has(t.name)).map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name}>
          <Icon sf={t.sf} />
          <Label>{t.title}</Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

function ClassicTabLayout({ visible }: { visible: Set<TabKey> }) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const haptics = useHaptics();
  const isDark = colorScheme !== "light";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  const onTabPress = () => haptics.selection();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background + "ee",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: isWeb ? 0 : insets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "light"}
              style={[StyleSheet.absoluteFill, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
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
      {ALL_TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            href: visible.has(t.name) ? undefined : null,
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name={t.sf.selected as never} tintColor={color} size={22} />
              ) : (
                <Feather name={t.feather} size={22} color={color} />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}

const SAFE_INITIAL_TABS: TabKey[] = ["index", "bookings", "customers", "more"];

export default function TabLayout() {
  const { kind, isLoading } = usePersona();
  const visible = new Set<TabKey>(
    isLoading ? SAFE_INITIAL_TABS : (TAB_VISIBILITY[kind] ?? TAB_VISIBILITY.owner),
  );

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout visible={visible} />;
  }
  return <ClassicTabLayout visible={visible} />;
}

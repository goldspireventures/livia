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
import { useMembership } from "@/hooks/useMembership";

function NativeTabLayout({ isStaff }: { isStaff: boolean }) {
  return (
    <NativeTabs>
      {isStaff ? (
        <NativeTabs.Trigger name="my-day">
          <Icon sf={{ default: "sun.max", selected: "sun.max.fill" }} />
          <Label>My day</Label>
        </NativeTabs.Trigger>
      ) : (
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "house", selected: "house.fill" }} />
          <Label>Today</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="bookings">
        <Icon sf={{ default: "calendar", selected: "calendar" }} />
        <Label>Bookings</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="customers">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Clients</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf="ellipsis" />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout({ isStaff }: { isStaff: boolean }) {
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
      {/* Owner/admin Today screen — hidden from STAFF (they get my-day instead). */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          href: isStaff ? null : undefined,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="my-day"
        options={{
          title: "My day",
          href: isStaff ? undefined : null,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="sun.max.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="sun" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="calendar" tintColor={color} size={22} />
            ) : (
              <Feather name="calendar" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Clients",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.2.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="users" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="ellipsis" tintColor={color} size={22} />
            ) : (
              <Feather name="menu" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { role } = useMembership();
  const isStaff = role === "STAFF";

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout isStaff={isStaff} />;
  }
  return <ClassicTabLayout isStaff={isStaff} />;
}

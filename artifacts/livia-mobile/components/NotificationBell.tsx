import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Notifications from "expo-notifications";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";

/** Header bell — opens full notification centre; syncs app icon badge on native. */
export function NotificationBell() {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();
  const { unreadCount } = useInAppNotifications();

  useEffect(() => {
    if (Platform.OS === "web") return;
    void Notifications.setBadgeCountAsync(unreadCount).catch(() => undefined);
  }, [unreadCount]);

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        router.push("/notifications" as never);
      }}
      hitSlop={12}
      accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      style={styles.wrap}
      testID="notification-bell"
    >
      <Feather name="bell" size={22} color={colors.foreground} />
      {unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 6, position: "relative" },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 9, fontWeight: "700" },
});

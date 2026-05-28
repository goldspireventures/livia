import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { EmptyState } from "@/components/EmptyState";
import { useInAppNotifications, type InAppNotification } from "@/hooks/useInAppNotifications";

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function priorityBorder(p: InAppNotification["priority"], colors: ReturnType<typeof useColors>) {
  switch (p) {
    case "act":
      return "#ef4444";
    case "watch":
      return "#d97706";
    default:
      return colors.border;
  }
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { notifications, unreadCount, isLoading, markRead, markAllRead, refetch } =
    useInAppNotifications();

  const openItem = async (n: InAppNotification) => {
    if (!n.readAt) await markRead(n.id);
    const route = n.mobileHref ?? n.href;
    if (route) router.push(route as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable
            onPress={() => {
              haptics.tap();
              void markAllRead();
            }}
          >
            <Text style={[styles.markAll, { color: colors.primary }]}>Read all</Text>
          </Pressable>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.lede, { color: colors.mutedForeground }]}>
          Liv only pings you when something needs a human — tap through to resolve.
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="bell"
            title="All caught up"
            subtitle="You'll see pings when Liv needs a yes, a message lands, or a booking waits on you."
          />
        ) : (
          notifications.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => void openItem(n)}
              style={[
                styles.card,
                {
                  backgroundColor: n.readAt ? colors.card : colors.primary + "10",
                  borderColor: colors.border,
                  borderLeftColor: priorityBorder(n.priority, colors),
                },
              ]}
            >
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {n.title}
                </Text>
                {!n.readAt ? (
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
              <Text style={[styles.cardBody, { color: colors.mutedForeground }]} numberOfLines={3}>
                {n.body}
              </Text>
              <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                {relativeTime(n.createdAt)}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: fonts.bodyMed, fontSize: 17 },
  markAll: { fontFamily: fonts.bodySemi, fontSize: 13 },
  lede: { ...type.body, fontSize: 13, lineHeight: 18, marginBottom: 16 },
  empty: { ...type.body, textAlign: "center", marginTop: 40 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 10,
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  cardBody: { ...type.body, fontSize: 13, lineHeight: 18, marginTop: 6 },
  cardMeta: { ...type.caption, marginTop: 8 },
});

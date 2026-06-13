import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  groupNotificationsByDay,
  notificationFeedIcon,
  notificationsEmptySubtitle,
  type NotificationFeedIcon,
} from "@workspace/policy";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { EmptyState } from "@/components/EmptyState";
import { useInAppNotifications, type InAppNotification } from "@/hooks/useInAppNotifications";

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
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

function feedIconName(type: NotificationFeedIcon): keyof typeof Feather.glyphMap {
  switch (type) {
    case "booking":
      return "calendar";
    case "inbox":
      return "message-circle";
    case "chain":
      return "layers";
    default:
      return "check-circle";
  }
}

function NotificationRow({
  n,
  colors,
  onPress,
}: {
  n: InAppNotification;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const icon = feedIconName(notificationFeedIcon(n.kind));
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: n.readAt ? colors.card : colors.primary + "12",
          borderColor: colors.border,
          borderLeftColor: priorityBorder(n.priority, colors),
          opacity: n.readAt ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text
          style={[
            styles.rowTitle,
            { color: colors.foreground, fontFamily: n.readAt ? fonts.bodyMed : fonts.bodySemi },
          ]}
          numberOfLines={1}
        >
          {n.title}
        </Text>
        <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
          {n.body}
        </Text>
      </View>
      <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>{relativeTime(n.createdAt)}</Text>
    </Pressable>
  );
}

function NotificationGroup({
  label,
  items,
  colors,
  onOpen,
}: {
  label: string;
  items: InAppNotification[];
  colors: ReturnType<typeof useColors>;
  onOpen: (n: InAppNotification) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {items.map((n) => (
        <NotificationRow key={n.id} n={n} colors={colors} onPress={() => onOpen(n)} />
      ))}
    </View>
  );
}

function LoadingSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.group}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={[styles.skeleton, { backgroundColor: colors.muted }]} />
      ))}
    </View>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { notifications, unreadCount, isLoading, markRead, markAllRead, refetch } =
    useInAppNotifications();

  const { today, earlier } = groupNotificationsByDay(notifications);

  const openItem = async (n: InAppNotification) => {
    haptics.tap();
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
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={{ width: 88 }} />
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
        {isLoading ? (
          <LoadingSkeleton colors={colors} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="bell"
            title="You're all caught up"
            subtitle={notificationsEmptySubtitle()}
          />
        ) : (
          <>
            <NotificationGroup label="Today" items={today} colors={colors} onOpen={openItem} />
            <NotificationGroup label="Earlier" items={earlier} colors={colors} onOpen={openItem} />
          </>
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
  group: { marginBottom: 20, gap: 8 },
  groupLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, lineHeight: 20 },
  rowSubtitle: { ...type.body, fontSize: 14, lineHeight: 19, marginTop: 2 },
  rowTime: { ...type.caption, fontSize: 11, alignSelf: "flex-start", paddingTop: 2 },
  skeleton: { height: 72, borderRadius: 12, marginBottom: 8 },
});

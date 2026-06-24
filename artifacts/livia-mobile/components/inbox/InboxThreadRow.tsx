import { Feather } from "@expo/vector-icons";
import type { ConversationListItem } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { InboxChannelIcon } from "@/components/inbox/InboxChannelIcon";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import type { OperationalChrome } from "@/lib/operational-chrome";

type Props = {
  thread: ConversationListItem;
  index: number;
  accent: string;
  chrome: OperationalChrome;
  formatRelative: (iso: string) => string;
  needsYouHighlight?: boolean;
  beautyAccent?: boolean;
  multiChannelHint?: string | null;
};

export function InboxThreadRow({
  thread: t,
  index,
  accent,
  chrome,
  formatRelative,
  needsYouHighlight,
  beautyAccent,
  multiChannelHint,
}: Props) {
  const colors = useColors();
  const router = useRouter();
  const needsYou = t.status === "OPEN" && !t.aiHandled;
  const attention = needsYouHighlight && needsYou;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 45, 320)).duration(340).springify()}>
      <GlowPressable
        onPress={() => router.push(`/conversation/${t.id}` as never)}
        glowColor={attention ? accent : colors.primary}
        haptic="tap"
        contentStyle={styles.rowInner}
        style={[
          styles.row,
          { alignSelf: "stretch" },
          chrome.native
            ? chrome.row(attention)
            : {
                backgroundColor: colors.card,
                borderColor: beautyAccent
                  ? colors.primary + "55"
                  : attention
                    ? aurora.violet + "66"
                    : colors.border,
                borderLeftWidth: beautyAccent ? 3 : 1,
                borderLeftColor: beautyAccent ? colors.primary : undefined,
              },
          elevation.resting,
        ]}
      >
        <View
          style={[
            styles.avatar,
            chrome.native ? chrome.avatarRing() : { backgroundColor: accent + "22" },
          ]}
        >
          <Feather name="message-circle" size={18} color={accent} />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
              {t.customerName?.trim() || "Guest"}
            </Text>
            <Text style={[styles.when, { color: colors.mutedForeground }]} numberOfLines={1}>
              {formatRelative(t.lastMessageAt)}
            </Text>
          </View>
          {t.lastMessage ? (
            <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={1}>
              {t.lastMessage}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <InboxChannelIcon channel={t.channel} size="sm" />
            {needsYou ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: (beautyAccent ? colors.primary : aurora.violet) + "22",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: beautyAccent ? colors.primary : aurora.violet },
                  ]}
                >
                  Needs you
                </Text>
              </View>
            ) : t.aiHandled && t.status === "OPEN" ? (
              <View style={[styles.badge, { backgroundColor: aurora.cyan + "22" }]}>
                <Text style={[styles.badgeText, { color: aurora.cyan }]}>Liv on</Text>
              </View>
            ) : t.status === "HANDED_OFF" ? (
              <View style={[styles.badge, { backgroundColor: colors.muted + "33" }]}>
                <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                  Taken over
                </Text>
              </View>
            ) : null}
            {multiChannelHint ? (
              <View style={[styles.badge, { backgroundColor: accent + "18" }]}>
                <Text style={[styles.badgeText, { color: accent }]}>{multiChannelHint}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={styles.chevron} />
      </GlowPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    width: "100%",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, minWidth: 0, gap: 4 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontFamily: fonts.bodyMed, fontSize: 16, flex: 1, minWidth: 0 },
  when: { ...type.caption, flexShrink: 0 },
  chevron: { flexShrink: 0 },
  preview: { ...type.body, fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  meta: { ...type.caption, fontSize: 11 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontFamily: fonts.bodyMed, fontSize: 10 },
});

import { useListConversations, type ConversationListItem } from "@workspace/api-client-react";
import {
  countByInboxQueueLens,
  defaultInboxQueueLens,
  inboxScreenTitle,
  INBOX_QUEUE_LENS_LABELS,
  matchesInboxQueueLens,
  type InboxQueueLens,
} from "@workspace/policy";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { OperationalScreen } from "@/components/OperationalScreen";
import { verticalAccentHex } from "@/lib/vertical-theme";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { usePersona } from "@/hooks/usePersona";
import { asHref } from "@/lib/navigation";
import { OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";

const QUEUE_LENSES: InboxQueueLens[] = [
  "needs_you",
  "liv_handling",
  "taken_over",
  "closed",
];

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function InboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const { currentBusiness } = useBusiness();
  const { kind: persona } = usePersona();
  const businessId = currentBusiness?.id ?? "";
  const bizMeta = currentBusiness as { vertical?: string; category?: string } | undefined;
  const accent = verticalAccentHex(bizMeta?.vertical, bizMeta?.category);

  const showQueue = persona === "manager" || persona === "owner" || persona === "org_admin";
  const canQuickBook =
    persona === "owner" || persona === "manager" || persona === "org_admin" || persona === "receptionist";
  const [queueLens, setQueueLens] = useState<InboxQueueLens>("liv_handling");

  useEffect(() => {
    if (showQueue) setQueueLens(defaultInboxQueueLens(persona));
  }, [persona, showQueue]);

  const { data, isLoading, refetch, isRefetching } = useListConversations(
    businessId,
    undefined,
    { query: { enabled: !!businessId, refetchInterval: OPERATIONAL_REFETCH_MS } as never },
  );

  const threads: ConversationListItem[] = Array.isArray(data) ? data : [];
  const queueCounts = useMemo(() => countByInboxQueueLens(threads), [threads]);
  const filtered = useMemo(() => {
    if (!showQueue) return threads;
    return threads.filter((t) => matchesInboxQueueLens(t, queueLens));
  }, [threads, queueLens, showQueue]);

  useEffect(() => {
    const cid = params.conversationId;
    if (typeof cid === "string" && cid.length > 0) {
      router.push(`/conversation/${cid}` as never);
    }
  }, [params.conversationId, router]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const screenTitle = inboxScreenTitle(persona);
  const lede = showQueue
    ? INBOX_QUEUE_LENS_LABELS[queueLens].description
    : "Tap a thread to open the full conversation — take over, reply, or return to Liv.";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <OperationalScreen
        eyebrow="Liv conversations"
        title={screenTitle}
        subtitle={lede}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentStyle={{ paddingBottom: 120 }}
      >
        {showQueue ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipScroll}
          >
            {QUEUE_LENSES.map((lens) => {
              const active = queueLens === lens;
              const count = queueCounts[lens];
              return (
                <Pressable
                  key={lens}
                  onPress={() => setQueueLens(lens)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary + "22" : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? colors.primary : colors.mutedForeground },
                    ]}
                  >
                    {INBOX_QUEUE_LENS_LABELS[lens].short}
                    {count > 0 ? ` (${count})` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="message-circle"
            title={
              showQueue
                ? `Nothing in ${INBOX_QUEUE_LENS_LABELS[queueLens].short}`
                : "Inbox is quiet"
            }
            subtitle={
              showQueue
                ? INBOX_QUEUE_LENS_LABELS[queueLens].description
                : "When customers message on WhatsApp, Instagram, SMS, or your booking page, threads land here."
            }
            actionLabel={canQuickBook ? "New booking" : undefined}
            onAction={canQuickBook ? () => router.push(asHref("/booking/new")) : undefined}
          />
        ) : (
          filtered.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => router.push(`/conversation/${t.id}` as never)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor:
                    showQueue && queueLens === "needs_you" && t.status === "OPEN" && !t.aiHandled
                      ? aurora.violet + "66"
                      : colors.border,
                  opacity: pressed ? 0.92 : 1,
                },
                elevation.resting,
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: accent + "22" }]}>
                <Feather name="message-circle" size={18} color={accent} />
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                    {t.customerName ?? "Unknown"}
                  </Text>
                  <Text style={[styles.when, { color: colors.mutedForeground }]}>
                    {formatRelative(t.lastMessageAt)}
                  </Text>
                </View>
                <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {t.lastMessage ?? "—"}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                    {t.channel}
                  </Text>
                  {t.status === "OPEN" && !t.aiHandled ? (
                    <View style={[styles.badge, { backgroundColor: aurora.violet + "22" }]}>
                      <Text style={[styles.badgeText, { color: aurora.violet }]}>Needs you</Text>
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
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))
        )}
      </OperationalScreen>

      {canQuickBook ? (
        <Pressable
          onPress={() => router.push(asHref("/booking/new"))}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.primary,
              bottom: insets.bottom + 72,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="New booking"
        >
          <Feather name="plus" size={24} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chipScroll: { marginBottom: 14, marginHorizontal: -4 },
  chipRow: { gap: 8, paddingHorizontal: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontFamily: fonts.bodyMed, fontSize: 13 },
  empty: { ...type.body, marginTop: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { fontFamily: fonts.bodyMed, fontSize: 16, flex: 1 },
  when: { ...type.caption },
  preview: { ...type.body, fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  meta: { ...type.caption, fontSize: 11 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontFamily: fonts.bodyMed, fontSize: 10 },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});

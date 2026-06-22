import {
  getGetConversationQueryKey,
  useGetConversation,
  useGetCustomerRelationship,
  useListConversations,
  useUpdateConversation,
  UpdateConversationBodyStatus,
  type ConversationMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ConstellationGlassCard } from "@/components/constellation/ConstellationGlassCard";
import { OperatorSurfaceShell } from "@/components/shell/OperatorSurfaceShell";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { aurora } from "@/constants/colors";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { useMembership } from "@/hooks/useMembership";
import { formatTimeInZone, resolveBusinessTimeZone } from "@/lib/datetime";
import { getApiBaseUrl } from "@/lib/api-base";
import { gatewayTheme } from "@/lib/gateway-theme";
import { inboxLivSuggestions } from "@/lib/liv-inbox-suggestions";
import { asHref } from "@/lib/navigation";
import { useOperationalChrome } from "@/lib/operational-chrome";
import {
  inboxChannelLabel,
  inboxCrossChannelOperatorNote,
  inboxReplyDeliveredOnChannel,
  inboxReplyPlaceholder,
  inboxSiblingThreadsBanner,
  inboxUnifiedGuestChannelsLabel,
  inboxUnifiedReplyHint,
  groupInboxThreadsByCustomer,
} from "@workspace/policy";

function roleLabel(role: ConversationMessage["role"]): string {
  switch (role) {
    case "USER":
      return "Guest";
    case "ASSISTANT":
      return "Liv";
    case "SYSTEM":
      return "System";
    default:
      return role;
  }
}

function StatusPill({
  aiHandled,
  status,
  accent,
  colors,
}: {
  aiHandled: boolean;
  status?: string;
  accent: string;
  colors: ReturnType<typeof useColors>;
}) {
  const needsYou = status === "OPEN" && !aiHandled;
  const handedOff = status === "HANDED_OFF";
  const label = needsYou ? "Needs you" : handedOff ? "You're replying" : aiHandled ? "Liv on" : "Open";
  const tone = needsYou ? accent : handedOff ? colors.mutedForeground : aurora.cyan;
  return (
    <View style={[styles.statusPill, { borderColor: tone + "55", backgroundColor: tone + "18" }]}>
      <Text style={[styles.statusPillText, { color: tone }]}>{label}</Text>
    </View>
  );
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = typeof id === "string" ? id : "";
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { getToken } = useAuth();
  const { currentBusiness } = useBusiness();
  const businessId = currentBusiness?.id ?? "";
  const chrome = useOperationalChrome(businessId);
  const accent = chrome.constellation ? gatewayTheme.aurumChampagne : colors.primary;
  const { markReadByResource } = useInAppNotifications();
  const haptics = useHaptics();
  const businessTz = resolveBusinessTimeZone(currentBusiness);

  useEffect(() => {
    if (!businessId || !conversationId) return;
    void markReadByResource({
      resourceKind: "conversation",
      resourceId: conversationId,
      businessId,
    });
  }, [businessId, conversationId, markReadByResource]);

  const [replyDraft, setReplyDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [livAssisting, setLivAssisting] = useState(false);
  const { role } = useMembership();
  const canAskLiv = role === "OWNER" || role === "ADMIN" || role === "STAFF";

  const { data: listData } = useListConversations(businessId, undefined, {
    query: { enabled: !!businessId } as never,
  });
  const threads = Array.isArray(listData) ? listData : [];
  const summary = useMemo(
    () => threads.find((t) => t.id === conversationId) ?? null,
    [threads, conversationId],
  );

  const { data: detail, isLoading: detailLoading } = useGetConversation(
    businessId,
    conversationId,
    { query: { enabled: !!businessId && !!conversationId } as never },
  );

  const customerId = summary?.customerId ?? detail?.conversation?.customerId ?? null;

  const { data: relationship } = useGetCustomerRelationship(
    businessId,
    customerId ?? "",
    { query: { enabled: !!businessId && !!customerId } as never },
  );

  const { mutateAsync: patchConversation, isPending: patchPending } = useUpdateConversation();

  const convStatus = detail?.conversation?.status ?? summary?.status;
  const aiHandled = detail?.conversation?.aiHandled ?? summary?.aiHandled ?? true;
  const messages: (ConversationMessage & { channel?: string })[] = detail?.messages ?? [];
  const isUnifiedView = detail?.isUnifiedView ?? false;
  const replyConversationId = detail?.replyConversationId ?? conversationId;
  const replyChannel = detail?.replyChannel ?? summary?.channel;
  const guestGroups = useMemo(() => groupInboxThreadsByCustomer(threads), [threads]);
  const unifiedChannelsLabel = useMemo(() => {
    if (!isUnifiedView || !customerId) return null;
    const group = guestGroups.find((g) => g.customerId === customerId);
    return group ? inboxUnifiedGuestChannelsLabel(group.channels) : null;
  }, [isUnifiedView, customerId, guestGroups]);
  const siblingThreads = useMemo(() => {
    if (isUnifiedView) return [];
    if (detail?.siblingThreads?.length) return detail.siblingThreads;
    if (!customerId) return [];
    return threads
      .filter(
        (t) =>
          t.customerId === customerId &&
          t.id !== conversationId &&
          t.status !== "CLOSED",
      )
      .map((t) => ({
        id: t.id,
        channel: t.channel,
        status: t.status,
        lastMessage: t.lastMessage ?? null,
      }));
  }, [isUnifiedView, detail?.siblingThreads, customerId, conversationId, threads]);
  const siblingBanner = isUnifiedView ? null : inboxSiblingThreadsBanner(siblingThreads);
  const businessVertical = (currentBusiness as { vertical?: string } | null)?.vertical;
  const livSuggestionChips = useMemo(
    () =>
      inboxLivSuggestions(
        businessVertical,
        (currentBusiness as { category?: string | null } | null)?.category,
        convStatus === "HANDED_OFF" ? "handoff" : "open",
      ).slice(0, 2),
    [businessVertical, currentBusiness, convStatus],
  );

  const invalidate = async () => {
    const { invalidateOperationalState } = await import("@/lib/operational-cache");
    invalidateOperationalState(qc, businessId);
    await qc.invalidateQueries({
      queryKey: getGetConversationQueryKey(businessId, conversationId),
    });
  };

  const handOff = async () => {
    if (!businessId || !conversationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await patchConversation({
      businessId,
      conversationId,
      data: { status: UpdateConversationBodyStatus.HANDED_OFF },
    });
    await invalidate();
  };

  const returnToLiv = async () => {
    if (!businessId || !conversationId) return;
    await patchConversation({
      businessId,
      conversationId,
      data: { status: UpdateConversationBodyStatus.OPEN, aiHandled: true },
    });
    await invalidate();
  };

  const sendReply = async () => {
    if (!businessId || !replyConversationId || !replyDraft.trim()) return;
    const releaseAfterSend = convStatus === "HANDED_OFF";
    setSending(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${getApiBaseUrl()}/api/businesses/${businessId}/conversations/${replyConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: replyDraft.trim() }),
        },
      );
      if (!res.ok) throw new Error("send failed");
      setReplyDraft("");
      if (releaseAfterSend) {
        await patchConversation({
          businessId,
          conversationId,
          data: { status: UpdateConversationBodyStatus.OPEN, aiHandled: true },
        });
      }
      await invalidate();
    } finally {
      setSending(false);
    }
  };

  const title = summary?.customerName ?? "Conversation";
  const composing = convStatus === "HANDED_OFF" || !aiHandled;

  const bubbleStyle = (role: ConversationMessage["role"]) => {
    if (role === "USER") {
      return chrome.constellation
        ? {
            backgroundColor: "rgba(42,45,58,0.72)",
            borderColor: "rgba(217,195,154,0.2)",
            alignSelf: "flex-start" as const,
          }
        : { backgroundColor: colors.card, borderColor: colors.border, alignSelf: "flex-start" as const };
    }
    if (role === "ASSISTANT") {
      return {
        backgroundColor: aurora.cyan + "18",
        borderColor: aurora.cyan + "44",
        alignSelf: "flex-end" as const,
      };
    }
    return { backgroundColor: colors.muted + "44", borderColor: colors.border, alignSelf: "center" as const };
  };

  const headerCard = (
    <View style={styles.headerRow}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>
      <Pressable
        onPress={() => {
          if (customerId) router.push(asHref(`/customer/${customerId}`));
        }}
        disabled={!customerId}
        style={styles.headerBody}
        accessibilityRole={customerId ? "link" : "text"}
        accessibilityLabel={customerId ? "Open guest profile" : title}
      >
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
          <StatusPill aiHandled={aiHandled} status={convStatus} accent={accent} colors={colors} />
        </View>
        <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {isUnifiedView && unifiedChannelsLabel
            ? `Liv active on ${unifiedChannelsLabel}`
            : inboxChannelLabel(summary?.channel)}
          {customerId ? " · tap for profile" : ""}
        </Text>
        <Text style={[styles.channelHint, { color: colors.mutedForeground }]}>
          {isUnifiedView
            ? inboxUnifiedReplyHint(replyChannel)
            : inboxReplyDeliveredOnChannel(summary?.channel)}
        </Text>
        {relationship?.headline ? (
          <Text style={[styles.relHeadline, { color: accent }]} numberOfLines={2}>
            {relationship.headline}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );

  return (
    <OperatorSurfaceShell>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <View style={[styles.headerWrap, { paddingTop: insets.top + 8 }]}>
          {chrome.constellation ? (
            <ConstellationGlassCard style={styles.headerCard}>{headerCard}</ConstellationGlassCard>
          ) : (
            <View
              style={[
                chrome.panel({ padding: 12 }),
                styles.headerCard,
                !chrome.native && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              {headerCard}
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.messages, { paddingBottom: composing ? insets.bottom + 160 : insets.bottom + 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {siblingBanner ? (
            chrome.constellation ? (
              <ConstellationGlassCard style={styles.siblingBanner}>
                <Text style={[styles.crossChannelNote, { color: colors.foreground }]}>{siblingBanner}</Text>
                <View style={styles.siblingRow}>
                  {siblingThreads.map((s) => (
                    <GlowPressable
                      key={s.id}
                      glowColor={accent}
                      haptic="selection"
                      onPress={() => router.replace(asHref(`/conversation/${s.id}`))}
                      style={[styles.siblingChip, { borderColor: accent + "55" }]}
                      contentStyle={styles.siblingChipInner}
                    >
                      <Text style={[styles.siblingChipText, { color: colors.foreground }]}>
                        {inboxChannelLabel(s.channel)}
                      </Text>
                    </GlowPressable>
                  ))}
                </View>
              </ConstellationGlassCard>
            ) : (
              <View style={[chrome.panel({ padding: 12 }), styles.siblingBanner]}>
                <Text style={[styles.crossChannelNote, { color: colors.foreground }]}>{siblingBanner}</Text>
                <View style={styles.siblingRow}>
                  {siblingThreads.map((s) => (
                    <GlowPressable
                      key={s.id}
                      glowColor={accent}
                      haptic="selection"
                      onPress={() => router.replace(asHref(`/conversation/${s.id}`))}
                      style={[styles.siblingChip, { borderColor: accent + "55" }]}
                      contentStyle={styles.siblingChipInner}
                    >
                      <Text style={[styles.siblingChipText, { color: colors.foreground }]}>
                        {inboxChannelLabel(s.channel)}
                      </Text>
                    </GlowPressable>
                  ))}
                </View>
              </View>
            )
          ) : null}

          {detailLoading ? (
            <ActivityIndicator color={accent} style={{ marginTop: 24 }} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyWrap}>
              {summary?.lastMessage ? (
                chrome.constellation ? (
                  <ConstellationGlassCard style={styles.emptyPreview}>
                    <Text style={[styles.msgMeta, { color: colors.mutedForeground }]}>Latest in inbox</Text>
                    <Text style={[styles.msg, { color: colors.foreground }]}>{summary.lastMessage}</Text>
                  </ConstellationGlassCard>
                ) : (
                  <View style={[chrome.panel({ padding: 12 }), styles.emptyPreview]}>
                    <Text style={[styles.msgMeta, { color: colors.mutedForeground }]}>Latest in inbox</Text>
                    <Text style={[styles.msg, { color: colors.foreground }]}>{summary.lastMessage}</Text>
                  </View>
                )
              ) : null}
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                {summary
                  ? "History is still syncing — check back shortly."
                  : "Thread not found. Open Inbox to pick a live conversation."}
              </Text>
              {!summary ? (
                <Pressable onPress={() => router.replace("/(tabs)/inbox")}>
                  <Text style={{ color: accent, fontFamily: fonts.bodySemi }}>Go to Inbox</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            messages.map((m, i) => (
              <Animated.View
                key={m.id}
                entering={FadeInDown.delay(Math.min(i * 30, 240)).duration(280).springify()}
                style={[styles.bubble, bubbleStyle(m.role)]}
              >
                <Text style={[styles.msgMeta, { color: colors.mutedForeground }]}>
                  {roleLabel(m.role)}
                  {isUnifiedView && m.channel ? ` · ${inboxChannelLabel(m.channel)}` : ""}
                  {" · "}
                  {formatTimeInZone(m.createdAt, businessTz)}
                </Text>
                <Text style={[styles.msg, { color: colors.foreground }]}>{m.content}</Text>
              </Animated.View>
            ))
          )}
        </ScrollView>

        <View
          style={[
            styles.footerWrap,
            {
              paddingBottom: insets.bottom + 12,
              borderTopColor: chrome.constellation ? "rgba(217,195,154,0.18)" : colors.border,
              backgroundColor: chrome.constellation ? "rgba(28,30,40,0.94)" : colors.background + "f5",
            },
          ]}
        >
          <View style={styles.footerInner}>
            {convStatus === "OPEN" && aiHandled ? (
              <GlowPressable
                onPress={() => void handOff()}
                disabled={patchPending}
                glowColor={accent}
                haptic="impact"
                style={[
                  styles.inlineAction,
                  chrome.native ? chrome.primaryButton() : { backgroundColor: colors.primary },
                ]}
                contentStyle={styles.inlineActionInner}
              >
                <Feather
                  name="user"
                  size={14}
                  color={chrome.constellation ? gatewayTheme.platformInk : colors.primaryForeground}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    { color: chrome.constellation ? gatewayTheme.platformInk : colors.primaryForeground },
                  ]}
                >
                  Take over
                </Text>
              </GlowPressable>
            ) : null}

            {convStatus === "HANDED_OFF" && !replyDraft.trim() ? (
              <GlowPressable
                onPress={() => void returnToLiv()}
                glowColor={aurora.cyan}
                haptic="tap"
                style={[styles.inlineAction, { borderWidth: 1, borderColor: aurora.cyan + "66" }]}
                contentStyle={styles.inlineActionInner}
              >
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>Release to Liv</Text>
              </GlowPressable>
            ) : null}

            {(convStatus === "OPEN" || convStatus === "HANDED_OFF") && canAskLiv && livSuggestionChips.length > 0 ? (
              <View style={styles.chipRow}>
                {livSuggestionChips.map((s) => (
                  <GlowPressable
                    key={s}
                    disabled={livAssisting}
                    glowColor={aurora.cyan}
                    haptic="selection"
                    onPress={async () => {
                      haptics.tap();
                      setLivAssisting(true);
                      try {
                        const token = await getToken();
                        const res = await fetch(
                          `${getApiBaseUrl()}/api/businesses/${businessId}/conversations/${conversationId}/liv-assist`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ message: s }),
                          },
                        );
                        const json = (await res.json()) as { reply?: string };
                        if (json.reply) setReplyDraft(json.reply);
                        await invalidate();
                      } finally {
                        setLivAssisting(false);
                      }
                    }}
                    style={[
                      styles.chip,
                      { borderColor: aurora.cyan + "44", backgroundColor: aurora.cyan + "10" },
                    ]}
                    contentStyle={styles.chipInner}
                  >
                    <Text style={[styles.chipText, { color: colors.foreground }]} numberOfLines={2}>
                      {s}
                    </Text>
                  </GlowPressable>
                ))}
              </View>
            ) : null}

            {composing ? (
              <View style={styles.composer}>
                <Text style={[styles.crossChannelNote, { color: colors.mutedForeground }]}>
                  {inboxCrossChannelOperatorNote()}
                </Text>
                {convStatus === "HANDED_OFF" ? (
                  <Text style={[styles.handoffHint, { color: colors.mutedForeground }]}>
                    Send when ready — Liv resumes after your message.
                  </Text>
                ) : null}
                <View style={styles.composerRow}>
                  <TextInput
                    style={[
                      styles.replyInput,
                      {
                        flex: 1,
                        color: colors.foreground,
                        borderColor: chrome.constellation ? "rgba(217,195,154,0.22)" : colors.border,
                        backgroundColor: chrome.constellation ? "rgba(255,255,255,0.06)" : colors.input + "88",
                      },
                    ]}
                    placeholder={inboxReplyPlaceholder(summary?.channel)}
                    placeholderTextColor={colors.mutedForeground}
                    value={replyDraft}
                    onChangeText={setReplyDraft}
                    multiline
                  />
                  <GlowPressable
                    onPress={() => void sendReply()}
                    disabled={sending || !replyDraft.trim()}
                    glowColor={accent}
                    haptic="impact"
                    style={[
                      styles.sendBtn,
                      chrome.native ? chrome.primaryButton() : { backgroundColor: colors.primary },
                      (sending || !replyDraft.trim()) && { opacity: 0.45 },
                    ]}
                    contentStyle={styles.sendBtnInner}
                    accessibilityLabel={
                      convStatus === "HANDED_OFF"
                        ? "Send reply and return thread to Liv"
                        : "Send reply"
                    }
                  >
                    {sending ? (
                      <ActivityIndicator
                        size="small"
                        color={chrome.constellation ? gatewayTheme.platformInk : colors.primaryForeground}
                      />
                    ) : (
                      <Feather
                        name="arrow-up"
                        size={18}
                        color={chrome.constellation ? gatewayTheme.platformInk : colors.primaryForeground}
                      />
                    )}
                  </GlowPressable>
                </View>
                {convStatus === "HANDED_OFF" && replyDraft.trim() ? (
                  <Pressable onPress={() => void returnToLiv()} disabled={patchPending}>
                    <Text style={[styles.releaseLink, { color: colors.mutedForeground }]}>
                      Release to Liv without sending
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </OperatorSurfaceShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  headerWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  headerCard: { gap: 0 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  headerBody: { flex: 1, minWidth: 0, gap: 4 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.serifMedium, fontSize: 20, flex: 1, minWidth: 0 },
  sub: { ...type.caption },
  relHeadline: { ...type.caption, fontSize: 11, lineHeight: 15 },
  channelHint: { ...type.caption, fontSize: 10, lineHeight: 14 },
  crossChannelNote: { ...type.caption, fontSize: 10, lineHeight: 14 },
  siblingBanner: { gap: 8, marginBottom: 4 },
  siblingRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  siblingChip: { borderRadius: 999, borderWidth: 1 },
  siblingChipInner: { paddingHorizontal: 12, paddingVertical: 6 },
  siblingChipText: { fontFamily: fonts.bodyMed, fontSize: 12 },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: { fontFamily: fonts.bodyMed, fontSize: 10 },
  messages: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  emptyWrap: { gap: 12, marginTop: 8 },
  emptyPreview: { gap: 6 },
  bubble: { maxWidth: "88%", borderRadius: 16, borderWidth: 1, padding: 12 },
  msgMeta: { ...type.caption, fontSize: 10, marginBottom: 4 },
  msg: { ...type.body, fontSize: 15, lineHeight: 21 },
  footerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  footerInner: { gap: 10 },
  inlineAction: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  inlineActionInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionLabel: { fontFamily: fonts.bodySemi, fontSize: 13 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 12, maxWidth: "48%" },
  chipInner: { padding: 10 },
  chipText: { fontSize: 11, lineHeight: 15 },
  composer: { gap: 8 },
  composerRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  handoffHint: { ...type.caption, fontSize: 11, lineHeight: 15 },
  replyInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, minHeight: 44, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22 },
  sendBtnInner: { width: "100%", height: "100%" },
  releaseLink: { ...type.caption, fontSize: 11, textDecorationLine: "underline" },
});

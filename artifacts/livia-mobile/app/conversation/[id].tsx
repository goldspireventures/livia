import {
  getGetConversationQueryKey,
  getListConversationsQueryKey,
  useGetConversation,
  useListConversations,
  useUpdateConversation,
  UpdateConversationBodyStatus,
  type ConversationMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { aurora } from "@/constants/colors";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { formatTimeInZone, resolveBusinessTimeZone } from "@/lib/datetime";
import { getApiBaseUrl } from "@/lib/api-base";
import { useMembership } from "@/hooks/useMembership";
import {
  STAFF_LIV_HANDOFF_SUGGESTIONS,
  STAFF_LIV_INBOX_SUGGESTIONS,
} from "@/lib/liv-inbox-suggestions";

function roleLabel(role: ConversationMessage["role"]): string {
  switch (role) {
    case "USER":
      return "Client";
    case "ASSISTANT":
      return "Liv";
    case "SYSTEM":
      return "System";
    default:
      return role;
  }
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
  const businessTz = resolveBusinessTimeZone(currentBusiness);
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

  const { mutateAsync: patchConversation, isPending: patchPending } = useUpdateConversation();

  const convStatus = detail?.conversation?.status ?? summary?.status;
  const aiHandled = detail?.conversation?.aiHandled ?? summary?.aiHandled ?? true;
  const messages: ConversationMessage[] = detail?.messages ?? [];

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
    if (!businessId || !conversationId || !replyDraft.trim()) return;
    setSending(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${getApiBaseUrl()}/api/businesses/${businessId}/conversations/${conversationId}/messages`,
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
      await invalidate();
    } finally {
      setSending(false);
    }
  };

  const title = summary?.customerName ?? "Conversation";

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {summary?.channel ?? "message"} · {aiHandled ? "Liv on" : "You're replying"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.messages, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        {detailLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : messages.length === 0 ? (
          <View style={{ gap: 8, marginTop: 8 }}>
            {summary?.lastMessage ? (
              <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.msgMeta, { color: colors.mutedForeground }]}>Latest in inbox</Text>
                <Text style={[styles.msg, { color: colors.foreground }]}>{summary.lastMessage}</Text>
              </View>
            ) : null}
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {detailLoading
                ? "Loading thread…"
                : summary
                  ? "History is still syncing — pull to refresh or check the Inbox tab."
                  : "Thread not found. Open Inbox to pick a live conversation."}
            </Text>
            {!summary ? (
              <Pressable onPress={() => router.replace("/(tabs)/inbox")}>
                <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi }}>Go to Inbox</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                {
                  backgroundColor:
                    m.role === "USER" ? colors.card : m.role === "ASSISTANT" ? aurora.cyan + "18" : colors.muted,
                  borderColor: colors.border,
                  alignSelf: m.role === "USER" ? "flex-start" : "flex-end",
                },
              ]}
            >
              <Text style={[styles.msgMeta, { color: colors.mutedForeground }]}>
                {roleLabel(m.role)} · {formatTimeInZone(m.createdAt, businessTz)}
              </Text>
              <Text style={[styles.msg, { color: colors.foreground }]}>{m.content}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.actionBar}>
          {convStatus === "OPEN" && aiHandled ? (
            <Pressable onPress={handOff} disabled={patchPending} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Feather name="user" size={14} color={colors.primaryForeground} />
              <Text style={[styles.actionLabel, { color: colors.primaryForeground }]}>Take over</Text>
            </Pressable>
          ) : null}
          {(convStatus === "HANDED_OFF" || (convStatus === "OPEN" && !aiHandled)) && (
            <Pressable onPress={returnToLiv} style={[styles.actionBtn, { borderWidth: 1, borderColor: aurora.cyan + "66" }]}>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Return to Liv</Text>
            </Pressable>
          )}
        </View>
        {(convStatus === "OPEN" || convStatus === "HANDED_OFF") && canAskLiv ? (
          <View style={styles.chipRow}>
            {(convStatus === "HANDED_OFF" ? STAFF_LIV_HANDOFF_SUGGESTIONS : STAFF_LIV_INBOX_SUGGESTIONS)
              .slice(0, 2)
              .map((s) => (
                <Pressable
                  key={s}
                  disabled={livAssisting}
                  onPress={async () => {
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
                  style={[styles.chip, { borderColor: colors.border }]}
                >
                  <Text style={[styles.chipText, { color: colors.foreground }]} numberOfLines={2}>
                    {s}
                  </Text>
                </Pressable>
              ))}
          </View>
        ) : null}
        {convStatus === "HANDED_OFF" || !aiHandled ? (
          <View style={styles.composer}>
            <TextInput
              style={[styles.replyInput, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="Reply to customer…"
              placeholderTextColor={colors.mutedForeground}
              value={replyDraft}
              onChangeText={setReplyDraft}
              multiline
            />
            <Pressable
              onPress={() => void sendReply()}
              disabled={sending || !replyDraft.trim()}
              style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: sending ? 0.6 : 1 }]}
            >
              <Text style={[styles.actionLabel, { color: colors.primaryForeground }]}>
                {sending ? "Sending…" : "Send"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: fonts.bodyMed, fontSize: 17 },
  sub: { ...type.caption, marginTop: 2 },
  messages: { padding: 16, gap: 10 },
  bubble: { maxWidth: "88%", borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 4 },
  msgMeta: { ...type.caption, fontSize: 10, marginBottom: 4 },
  msg: { ...type.body, fontSize: 15, lineHeight: 21 },
  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  actionBar: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  actionLabel: { fontFamily: fonts.bodySemi, fontSize: 13 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 12, padding: 10, maxWidth: "48%" },
  chipText: { fontSize: 11, lineHeight: 15 },
  composer: { gap: 8 },
  replyInput: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 44, fontSize: 15 },
});

import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
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
import { fonts, type } from "@/constants/typography";
import { useMobileSurface } from "@/hooks/useMobileSurface";
import { MIN_TOUCH } from "@/lib/mobile-layout";
import { getApiBaseUrl } from "@/lib/api-base";
import { GUEST_HUB_COPY } from "@workspace/policy";
import { openGuestBookUrl } from "@/lib/guest-hub";

type ChatAction = { label: string; href: string };
type ChatTurn = { role: "user" | "assistant"; text: string; actions?: ChatAction[] };

export function GuestHubLivChat({ hubToken }: { hubToken: string }) {
  const { tokens: colors } = useMobileSurface("guest-hub");
  const api = getApiBaseUrl();
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([
    { role: "assistant", text: GUEST_HUB_COPY.livChatWelcome },
  ]);

  async function send() {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setErr(null);
    setMessage("");
    setTurns((t) => [...t, { role: "user", text }]);
    try {
      const r = await fetch(`${api}/api/public/guest-hub/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Hub-Token": hubToken,
        },
        body: JSON.stringify({ message: text }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        reply?: string;
        actions?: ChatAction[];
        error?: string;
      };
      if (!r.ok) throw new Error(j.error ?? "Could not reach Liv");
      setTurns((t) => [
        ...t,
        { role: "assistant", text: j.reply ?? "Done.", actions: j.actions },
      ]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View
      style={[styles.card, { borderColor: colors.primary + "40", backgroundColor: colors.primary + "10" }]}
      testID="guest-hub-liv-chat"
    >
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.header} hitSlop={4}>
        <View style={[styles.livIcon, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
          <Feather name="zap" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.body, { fontFamily: fonts.bodyMed, color: colors.foreground }]}>
            {GUEST_HUB_COPY.livStripTitle}
          </Text>
          {!open ? (
            <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
              {GUEST_HUB_COPY.livStripBody}
            </Text>
          ) : null}
        </View>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
      </Pressable>
      {open ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={8}
        >
          <View style={[styles.body, { borderTopColor: colors.border }]}>
            <ScrollView style={styles.messages} nestedScrollEnabled testID="guest-hub-liv-messages">
              <View style={styles.messageStack}>
                {turns.map((turn, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bubble,
                      turn.role === "user"
                        ? { alignSelf: "flex-end", backgroundColor: colors.primary + "20" }
                        : { alignSelf: "flex-start", backgroundColor: colors.muted + "40" },
                    ]}
                  >
                    <Text style={[type.caption, { color: colors.foreground, lineHeight: 18 }]}>{turn.text}</Text>
                    {turn.actions?.map((a) => (
                      <Pressable key={a.href} onPress={() => openGuestBookUrl(a.href)} style={styles.action}>
                        <Text style={[type.caption, { color: colors.primary, fontFamily: fonts.bodyMed }]}>
                          {a.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
            {err ? <Text style={[type.caption, { color: colors.destructive }]}>{err}</Text> : null}
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card + "88" }]}
                placeholder={GUEST_HUB_COPY.livChatPlaceholder}
                placeholderTextColor={colors.mutedForeground}
                value={message}
                onChangeText={setMessage}
                testID="guest-hub-liv-input"
                returnKeyType="send"
                onSubmitEditing={() => void send()}
              />
              <Pressable
                style={[styles.send, { backgroundColor: colors.primary }]}
                onPress={() => void send()}
                disabled={busy || !message.trim()}
                testID="guest-hub-liv-send"
              >
                {busy ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Feather name="send" size={16} color={colors.primaryForeground} />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, overflow: "hidden", marginTop: 8 },
  header: { flexDirection: "row", gap: 10, padding: 14, alignItems: "center", minHeight: MIN_TOUCH },
  livIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  messages: { maxHeight: 200 },
  messageStack: { gap: 8, paddingVertical: 8 },
  bubble: { borderRadius: 12, padding: 10, maxWidth: "92%" },
  action: { marginTop: 6 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: fonts.body,
    fontSize: 15,
    minHeight: MIN_TOUCH,
  },
  send: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

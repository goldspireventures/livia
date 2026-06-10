import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { customFetch } from "@workspace/api-client-react";

type AssistMessage = { role: "user" | "assistant"; content: string };

export function OwnerLivOpsCard({
  businessId,
  starters = [],
  soloMode = false,
}: {
  businessId: string;
  starters?: string[];
  soloMode?: boolean;
}) {
  const colors = useColors();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AssistMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const lastReply = [...history].reverse().find((m) => m.role === "assistant")?.content;
  const visibleStarters =
    suggestions.length > 0 ? suggestions : history.length === 0 ? starters : [];

  async function send(prompt?: string) {
    const text = (prompt ?? message).trim();
    if (!text || loading) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await customFetch<{ reply: string; suggestions: string[] }>(
        `/api/businesses/${businessId}/liv-owner/assist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
        },
      );
      setHistory((h) => [
        ...h,
        { role: "user", content: text },
        { role: "assistant", content: res.reply },
      ]);
      setSuggestions(res.suggestions ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.head}>
        <Feather name="message-circle" size={14} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {soloMode ? "Ask Liv" : "Ask Liv"}
        </Text>
      </View>
      {soloMode && !lastReply ? (
        <Text style={[styles.reply, { color: colors.mutedForeground }]} numberOfLines={2}>
          Bookings, inbox, or what to do next — plain language.
        </Text>
      ) : null}
      {lastReply ? (
        <Text style={[styles.reply, { color: colors.mutedForeground }]} numberOfLines={4}>
          {lastReply}
        </Text>
      ) : null}
      {visibleStarters.slice(0, 3).map((s) => (
        <Pressable key={s} onPress={() => void send(s)} style={styles.chip}>
          <Text style={[styles.chipText, { color: colors.primary }]} numberOfLines={1}>
            {s}
          </Text>
        </Pressable>
      ))}
      <View style={styles.row}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Commerce, setup, or today's priority…"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background },
          ]}
          editable={!loading}
        />
        <Pressable
          onPress={() => void send()}
          disabled={loading || !message.trim()}
          style={[styles.send, { backgroundColor: colors.primary, opacity: loading || !message.trim() ? 0.5 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Feather name="send" size={14} color={colors.primaryForeground} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.bodySemi, fontSize: 13 },
  reply: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  chip: { paddingVertical: 4 },
  chipText: { fontFamily: fonts.body, fontSize: 11 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

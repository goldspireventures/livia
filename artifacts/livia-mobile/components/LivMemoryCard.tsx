import { useQuery, useQueryClient } from "@tanstack/react-query";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { customFetch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { aurora } from "@/constants/colors";

type MemoryRow = {
  id: string;
  kind: string;
  content: string;
  createdAt: string;
};

export function LivMemoryCard({
  businessId,
  customerId,
  canEdit,
}: {
  businessId: string;
  customerId: string;
  canEdit: boolean;
}) {
  const colors = useColors();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["liv-memory", businessId, customerId],
    queryFn: () =>
      customFetch<{ data: MemoryRow[] }>(
        `/api/businesses/${businessId}/customers/${customerId}/liv-memory`,
      ),
    enabled: !!businessId && !!customerId,
  });

  const rows = data?.data ?? [];

  async function save() {
    const content = draft.trim();
    if (!content) return;
    setSaving(true);
    try {
      await customFetch(`/api/businesses/${businessId}/customers/${customerId}/liv-memory`, {
        method: "POST",
        body: JSON.stringify({ content, kind: "note" }),
      });
      setDraft("");
      await qc.invalidateQueries({ queryKey: ["liv-memory", businessId, customerId] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.head}>
        <Feather name="cpu" size={16} color={aurora.cyan} />
        <Text style={[styles.title, { color: colors.foreground }]}>Liv memory</Text>
      </View>
      <Text style={[styles.lede, { color: colors.mutedForeground }]}>
        Liv builds memory in the background from bookings, messages, and your confirmations — you
        can add a note anytime to teach her faster.
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
      ) : rows.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>No notes yet.</Text>
      ) : (
        rows.map((r) => (
          <View key={r.id} style={[styles.note, { borderLeftColor: colors.primary }]}>
            <Text style={[styles.kind, { color: colors.mutedForeground }]}>{r.kind}</Text>
            <Text style={[styles.noteText, { color: colors.foreground }]}>{r.content}</Text>
          </View>
        ))
      )}

      {canEdit ? (
        <>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="e.g. Prefers Lara · patch test every 6 months"
            placeholderTextColor={colors.mutedForeground}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable
            onPress={() => void save()}
            disabled={saving || !draft.trim()}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: colors.primary,
                opacity: saving || !draft.trim() ? 0.5 : pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
              {saving ? "Saving…" : "Add memory"}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  title: { fontFamily: fonts.bodyMed, fontSize: 15 },
  lede: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  empty: { fontSize: 12, marginBottom: 8 },
  note: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 8,
  },
  kind: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 },
  noteText: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
    marginTop: 8,
  },
  btn: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnText: { fontFamily: fonts.bodyMed, fontSize: 14 },
});

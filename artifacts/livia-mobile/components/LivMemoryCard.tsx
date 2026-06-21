import { useQuery, useQueryClient } from "@tanstack/react-query";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { customFetch } from "@workspace/api-client-react";
import { livMemoryKindOptions, livMemoryPlaceholder } from "@workspace/policy";
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
  vertical,
  category,
}: {
  businessId: string;
  customerId: string;
  canEdit: boolean;
  vertical?: string | null;
  category?: string | null;
}) {
  const colors = useColors();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState("note");
  const [saving, setSaving] = useState(false);
  const kindOptions = livMemoryKindOptions(vertical, category);

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
        body: JSON.stringify({ content, kind }),
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
        Liv learns from completed visits and your notes — teach her faster anytime.
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
          {kindOptions.length > 1 ? (
            <View style={styles.kindRow}>
              {kindOptions.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setKind(opt.value)}
                  style={[
                    styles.kindChip,
                    {
                      borderColor: kind === opt.value ? colors.primary : colors.border,
                      backgroundColor: kind === opt.value ? `${colors.primary}22` : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: kind === opt.value ? colors.primary : colors.mutedForeground,
                      fontSize: 11,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            placeholder={livMemoryPlaceholder(vertical, category)}
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
  kindRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  kindChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
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

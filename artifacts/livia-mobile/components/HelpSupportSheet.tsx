import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@/lib/api-base";

type Category = "bug" | "billing" | "liv_error" | "feature" | "other";

export function HelpSupportSheet({
  defaultCategory = "other",
  context = {},
}: {
  defaultCategory?: Category;
  context?: Record<string, unknown>;
}) {
  const colors = useColors();
  const { currentBusiness } = useBusiness();
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const bid = currentBusiness?.id;
    if (!bid || description.trim().length < 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setSending(true);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiBaseUrl()}/api/businesses/${bid}/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          category,
          severity: "annoying",
          description: description.trim(),
          consentLogsAccess: true,
          context: { surface: "mobile", ...context },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => {
          setOpen(true);
          setDone(false);
          setDescription("");
        }}
        style={styles.linkRow}
      >
        <Feather name="life-buoy" size={16} color={colors.primary} />
        <Text style={[styles.linkText, { color: colors.primary }]}>Get help / report issue</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>Help & support</Text>
            {done ? (
              <Text style={{ color: colors.mutedForeground, marginBottom: 16 }}>
                Thanks — we received your ticket. Check email for updates.
              </Text>
            ) : (
              <>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
                  Category: {category.replace("_", " ")}
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What happened? (10+ characters)"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  style={[
                    styles.input,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => void submit()}
                  disabled={sending}
                  style={[styles.submit, { backgroundColor: colors.primary }]}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Submit ticket</Text>
                  )}
                </Pressable>
              </>
            )}
            <Pressable onPress={() => setOpen(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.primary, textAlign: "center" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  linkText: { fontSize: 14, fontWeight: "600" },
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 100,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  submit: { borderRadius: 10, padding: 14, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "600" },
});

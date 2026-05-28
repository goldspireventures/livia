import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useMembership } from "@/hooks/useMembership";
import { verticalAccentHex } from "@/lib/vertical-theme";
import {
  KINDS,
  listTimeOffRequests,
  submitTimeOffRequest,
  type TimeOffRequestRow,
} from "@/lib/time-off";
import { fonts, type } from "@/constants/typography";

export default function TimeOffScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useBusiness();
  const { staffId, role, isLoading: membershipLoading } = useMembership();
  const bid = currentBusiness?.id ?? "";
  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const accent = verticalAccentHex(vertical, currentBusiness?.category);

  const [requests, setRequests] = useState<TimeOffRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("annual_leave");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    if (!bid || !staffId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRequests(await listTimeOffRequests(bid, staffId));
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [bid, staffId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pending = requests.filter((r) =>
    ["PENDING_APPROVAL", "PROPOSED", "ESCALATED"].includes(r.status),
  );

  const canRequest =
    !!staffId && (role === "STAFF" || role === "ADMIN" || role === "OWNER");

  async function onSubmit() {
    if (!bid || !staffId || !startAt.trim() || !endAt.trim()) return;
    setSubmitting(true);
    try {
      await submitTimeOffRequest(bid, {
        staffId,
        kind,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        reason: reason.trim() || undefined,
      });
      setStartAt("");
      setEndAt("");
      setReason("");
      void reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Try again";
      const { Alert } = await import("react-native");
      Alert.alert("Could not submit", msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (membershipLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  if (!staffId) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, padding: 24 }]}>
        <Text style={[type.body, { color: colors.mutedForeground, textAlign: "center" }]}>
          Link your account to a staff profile on web (Team), then request leave here. Managers
          approve on Rota in the dashboard.
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: accent, fontFamily: fonts.bodyMed }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
    >
      <Text style={[type.caption, { color: accent, marginBottom: 4 }]}>Your leave</Text>
      <Text style={[type.title, { color: colors.foreground, marginBottom: 8 }]}>
        Request time off
      </Text>
      <Text style={[type.body, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Submit for yourself — managers approve on Rota. Liv blocks the calendar when approved.
      </Text>

      {canRequest ? (
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Text style={[type.label, { color: colors.foreground, marginBottom: 8 }]}>Type</Text>
          <View style={styles.kindRow}>
            {KINDS.map((k) => (
              <Pressable
                key={k.value}
                onPress={() => setKind(k.value)}
                style={[
                  styles.chip,
                  {
                    borderColor: kind === k.value ? accent : colors.border,
                    backgroundColor: kind === k.value ? `${accent}22` : "transparent",
                  },
                ]}
              >
                <Text
                  style={{
                    color: kind === k.value ? accent : colors.mutedForeground,
                    fontSize: 12,
                    fontFamily: fonts.bodyMed,
                  }}
                >
                  {k.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[type.label, { color: colors.foreground, marginTop: 12 }]}>From (ISO)</Text>
          <TextInput
            value={startAt}
            onChangeText={setStartAt}
            placeholder="2026-06-01T09:00"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            autoCapitalize="none"
          />
          <Text style={[type.label, { color: colors.foreground, marginTop: 8 }]}>To (ISO)</Text>
          <TextInput
            value={endAt}
            onChangeText={setEndAt}
            placeholder="2026-06-05T17:00"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            autoCapitalize="none"
          />
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Note for your manager (optional)"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, marginTop: 8 }]}
          />
          <Pressable
            onPress={() => void onSubmit()}
            disabled={submitting || !startAt || !endAt}
            style={[styles.submit, { backgroundColor: accent, opacity: submitting ? 0.6 : 1 }]}
          >
            <Text style={{ color: "#0f172a", fontFamily: fonts.bodySemi }}>Submit for approval</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={[type.label, { color: colors.foreground, marginTop: 24, marginBottom: 8 }]}>
        Pending
      </Text>
      {loading ? (
        <ActivityIndicator color={accent} />
      ) : pending.length === 0 ? (
        <Text style={{ color: colors.mutedForeground }}>No pending requests.</Text>
      ) : (
        pending.map((r) => (
          <View key={r.id} style={[styles.card, { borderColor: colors.border, marginBottom: 8 }]}>
            <Text style={{ color: colors.foreground, fontFamily: fonts.bodyMed }}>
              {new Date(r.startAt).toLocaleString()} → {new Date(r.endAt).toLocaleString()}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
              {r.kind.replace(/_/g, " ")}
              {r.reason ? ` · ${r.reason}` : ""}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
  kindRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
  submit: {
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
});

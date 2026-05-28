import type { LivMandateAction } from "@workspace/policy";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenTopBar } from "@/components/ScreenTopBar";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useLivMandate } from "@/hooks/useLivMandate";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { aurora } from "@/constants/colors";
import { fonts, type } from "@/constants/typography";

const RUNGS = [
  { id: "R0", label: "Observe", desc: "Suggest only" },
  { id: "R1", label: "Propose-first", desc: "You approve everything" },
  { id: "R2", label: "Bounded", desc: "Auto small tasks" },
  { id: "R3", label: "Routine", desc: "Common flows auto" },
  { id: "R4", label: "Mandated", desc: "Full allowlist" },
] as const;

const DENY_TOGGLES: Array<{ action: LivMandateAction; label: string }> = [
  { action: "process_refund", label: "Block auto refunds" },
  { action: "approve_design_proof", label: "Block design proof approval" },
  { action: "waive_deposit", label: "Block deposit waivers" },
  { action: "apply_no_show_fee", label: "Block no-show fees" },
  { action: "cancel_booking", label: "Block auto cancellations" },
];

export default function LivMandateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const qc = useQueryClient();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const { data, isLoading, refetch } = useLivMandate(bid);

  const [capEuros, setCapEuros] = useState("");
  const [savingLimits, setSavingLimits] = useState(false);

  const deniedSet = useMemo(
    () => new Set(data?.mandate.deniedActions ?? []),
    [data?.mandate.deniedActions],
  );

  React.useEffect(() => {
    if (data?.mandate.maxAutoValueMinor != null) {
      setCapEuros(String((data.mandate.maxAutoValueMinor / 100).toFixed(0)));
    }
  }, [data?.mandate.maxAutoValueMinor]);

  const patchMandate = async (partial: Record<string, unknown>) => {
    if (!bid) return;
    await customFetch(`/api/businesses/${bid}/liv-mandate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mandate: { ...partial, acknowledgedAt: new Date().toISOString() },
      }),
    });
    void qc.invalidateQueries({ queryKey: ["liv-mandate", bid] });
    void refetch();
    haptics.success();
  };

  const setRung = async (rung: string) => {
    haptics.selection();
    await patchMandate({ rung });
  };

  const toggleDenied = async (action: LivMandateAction) => {
    const next = new Set(deniedSet);
    if (next.has(action)) next.delete(action);
    else next.add(action);
    haptics.selection();
    await patchMandate({ deniedActions: [...next] });
  };

  const saveCap = async () => {
    const euros = Number.parseInt(capEuros.replace(/\D/g, ""), 10);
    if (Number.isNaN(euros) || euros < 0) {
      haptics.warning();
      return;
    }
    setSavingLimits(true);
    try {
      await patchMandate({ maxAutoValueMinor: euros * 100 });
    } finally {
      setSavingLimits(false);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40, paddingHorizontal: 16 }}
    >
      <ScreenTopBar />
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
        <Text style={{ color: colors.foreground, fontFamily: fonts.bodySemi }}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.foreground }]}>Liv Mandate</Text>
      <Text style={[styles.lede, { color: colors.mutedForeground }]}>
        Autonomy rung, refund cap, and hard blocks — simulation updates as you change limits.
      </Text>

      {isLoading || !data ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={aurora.violet} />
      ) : (
        <>
          <Text style={[styles.trust, { color: aurora.violet }]}>
            Trust {data.mandate.trustScore}% · default for {data.vertical} is {data.defaults.rung}
          </Text>
          {RUNGS.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => void setRung(r.id)}
              style={[
                styles.rung,
                {
                  backgroundColor: colors.card,
                  borderColor: data.mandate.rung === r.id ? aurora.violet : colors.border,
                },
              ]}
            >
              <Text style={{ fontFamily: fonts.bodySemi, color: colors.foreground }}>
                {r.id} — {r.label}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{r.desc}</Text>
            </Pressable>
          ))}

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Refund auto-cap</Text>
          <Text style={[styles.lede, { color: colors.mutedForeground, marginBottom: 8 }]}>
            Liv can auto-process refunds up to this amount (€). Above the cap, you approve in the queue.
            Set 0 to require approval for any refund.
          </Text>
          <View style={styles.capRow}>
            <Text style={{ color: colors.mutedForeground, fontFamily: fonts.bodySemi }}>€</Text>
            <TextInput
              value={capEuros}
              onChangeText={setCapEuros}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.capInput, { color: colors.foreground, borderColor: colors.border }]}
            />
            <Pressable
              onPress={() => void saveCap()}
              disabled={savingLimits}
              style={[styles.capSave, { backgroundColor: aurora.violet, opacity: savingLimits ? 0.6 : 1 }]}
            >
              <Text style={styles.capSaveText}>{savingLimits ? "…" : "Save"}</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hard blocks</Text>
          <Text style={[styles.lede, { color: colors.mutedForeground, marginBottom: 8 }]}>
            Even at a high rung, blocked actions always need you — Liv will refuse or propose only.
          </Text>
          {DENY_TOGGLES.map((row) => (
            <View
              key={row.action}
              style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Text style={{ color: colors.foreground, flex: 1 }}>{row.label}</Text>
              <Switch
                value={deniedSet.has(row.action)}
                onValueChange={() => void toggleDenied(row.action)}
                trackColor={{ false: colors.border, true: aurora.violet }}
              />
            </View>
          ))}

          <Text style={[styles.simHeading, { color: colors.mutedForeground }]}>
            Simulator — what would happen today
          </Text>
          {data.simulation.map((s) => (
            <View key={s.label} style={[styles.simRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.foreground }}>{s.label}</Text>
                {"reason" in s && s.reason ? (
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{s.reason}</Text>
                ) : null}
              </View>
              <Text style={{ color: aurora.cyan, fontFamily: fonts.bodySemi }}>{s.outcome}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  title: { fontFamily: fonts.serifMedium, fontSize: 32, marginBottom: 8 },
  lede: { ...type.body, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  trust: { ...type.caption, marginBottom: 12 },
  rung: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8, gap: 4 },
  sectionTitle: { fontFamily: fonts.bodySemi, fontSize: 16, marginTop: 20, marginBottom: 4 },
  capRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  capInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  capSave: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  capSaveText: { color: "#fff", fontFamily: fonts.bodySemi },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  simHeading: { ...type.eyebrow, marginTop: 16, marginBottom: 8 },
  simRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
});

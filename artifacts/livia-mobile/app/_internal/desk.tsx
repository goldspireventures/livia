import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { OperationalScreen } from "@/components/OperationalScreen";
import { BiometricGate } from "@/components/BiometricGate";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { fonts, type } from "@/constants/typography";
import {
  clearFounderOpsSecret,
  fetchExecSnapshot,
  getFounderOperatorEmail,
  getFounderOpsSecret,
  runExecAutomation,
  setFounderOperatorEmail,
  setFounderOpsSecret,
  type FounderCockpitSnapshot,
} from "@/lib/internal-ops";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ExecDeskScreen() {
  const colors = useColors();
  const haptics = useHaptics();

  const [secret, setSecret] = useState<string>("");
  const [operator, setOperator] = useState<string>("");
  const [data, setData] = useState<FounderCockpitSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const configured = useMemo(() => Boolean(secret.trim()), [secret]);

  const hydrate = useCallback(async () => {
    const [s, op] = await Promise.all([getFounderOpsSecret(), getFounderOperatorEmail()]);
    if (s) setSecret(s);
    if (op) setOperator(op);
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      setData(await fetchExecSnapshot());
    } catch (e) {
      setData(null);
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (configured) void refresh();
  }, [configured, refresh]);

  return (
    <BiometricGate title="Internal" subtitle="Exec surface · device unlock + ops secret" allowSkip={false}>
      <OperationalScreen title="Overview" subtitle="Livia Inc · audited">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.h2, { color: colors.foreground }]}>Access</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Uses INTERNAL_OPS_SECRET headers. Not visible to salon users.
          </Text>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>INTERNAL_OPS_SECRET</Text>
          <TextInput
            value={secret}
            onChangeText={setSecret}
            placeholder="Paste secret"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Operator email</Text>
          <TextInput
            value={operator}
            onChangeText={setOperator}
            placeholder="you@livia.io"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <Pressable
              onPress={() => {
                haptics.selection();
                void (async () => {
                  await setFounderOpsSecret(secret);
                  if (operator.trim()) await setFounderOperatorEmail(operator);
                  await refresh();
                })();
              }}
              style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary }, pressed && { opacity: 0.92 }]}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Save & refresh</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          {busy ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center" }]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : err ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.h2, { color: colors.destructive }]}>Error</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>{err}</Text>
            </View>
          ) : data ? (
            <Snapshot data={data} onRefresh={refresh} />
          ) : (
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>Save secret to load overview.</Text>
          )}
        </View>
      </OperationalScreen>
    </BiometricGate>
  );
}

function Snapshot({
  data,
  onRefresh,
}: {
  data: FounderCockpitSnapshot;
  onRefresh: () => Promise<void>;
}) {
  const colors = useColors();
  const haptics = useHaptics();
  const obs = data.observability;
  const ph = data.platformHealth;
  const support = data.support ?? {
    openTotal: 0,
    urgentOpen: 0,
    oldestOpenHours: null as number | null,
    urgent: [],
  };
  const prod = data.production;
  const prodOk = prod?.allRequiredOk ?? false;

  const runAuto = (id: string, destructive?: boolean) => {
    if (destructive) {
      Alert.alert("Send emails?", "Nudges stuck onboarding owners.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                const r = await runExecAutomation(id, { confirm: true });
                Alert.alert(r.ok ? "Done" : "Failed", r.summary);
                if (id === "refresh-production-checks") await onRefresh();
              } catch (e) {
                Alert.alert("Error", e instanceof Error ? e.message : "Failed");
              }
            })();
          },
        },
      ]);
      return;
    }
    void (async () => {
      haptics.selection();
      try {
        const r = await runExecAutomation(id);
        Alert.alert(r.ok ? "Done" : "Note", r.summary);
        if (id === "refresh-production-checks") await onRefresh();
      } catch (e) {
        Alert.alert("Error", e instanceof Error ? e.message : "Failed");
      }
    })();
  };

  return (
    <View style={{ gap: 12 }}>
      {prod ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: prodOk ? colors.primary + "55" : colors.destructive + "55" }]}>
          <Text style={[styles.h2, { color: colors.foreground }]}>Production</Text>
          {prod.checks
            .filter((c) => c.required)
            .map((c) => (
              <Metric key={c.name} label={c.name} value={c.ok ? "OK" : "FAIL"} />
            ))}
        </View>
      ) : null}

      {data.hats?.length ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.h2, { color: colors.foreground }]}>Hats</Text>
          {data.hats.map((hat) => (
            <View key={hat.id} style={{ marginTop: 10 }}>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>
                {hat.role} · {hat.status}
              </Text>
              <Text style={[styles.mini, { color: colors.mutedForeground }]}>{hat.focus}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {data.automations?.length ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.h2, { color: colors.foreground }]}>Automations</Text>
          {data.automations.map((a) => (
            <Pressable key={a.id} onPress={() => runAuto(a.id, a.destructive)} style={{ marginTop: 10 }}>
              <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi, fontSize: 13 }}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {data.commandCenter?.links?.length ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.h2, { color: colors.foreground }]}>Links</Text>
          {data.commandCenter.links.slice(0, 6).map((link) => (
            <Pressable key={link.id} onPress={() => void Linking.openURL(link.href)} style={{ marginTop: 10 }}>
              <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi, fontSize: 13 }}>{link.label}</Text>
            </Pressable>
          ))}
          <Text style={[styles.mini, { color: colors.mutedForeground, marginTop: 10 }]}>
            Full depth: livia-internal on laptop (secret URL in .env)
          </Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.h2, { color: colors.foreground }]}>Today · {formatTime(obs.timestamp)}</Text>
        <Metric label="Bookings" value={String(obs.traffic.bookingsToday)} />
        <Metric label="Support open" value={String(support.openTotal)} />
        <Metric label="Tenants" value={String(ph.tenantCount)} />
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 10 }}>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 14 },
  h2: { fontFamily: fonts.serifMedium, fontSize: 16 },
  sub: { ...type.body, fontSize: 13, lineHeight: 18 },
  mini: { ...type.caption, fontSize: 11 },
  label: { ...type.caption, fontSize: 11, marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  btn: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  metricLabel: { ...type.caption, fontSize: 12, flex: 1 },
  metricValue: { fontFamily: fonts.bodySemi, fontSize: 13 },
});

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { OperationalScreen } from "@/components/OperationalScreen";
import { BiometricGate } from "@/components/BiometricGate";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { fonts, type } from "@/constants/typography";
import {
  clearFounderOpsSecret,
  fetchFounderCockpit,
  getFounderOperatorEmail,
  getFounderOpsSecret,
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

export default function FounderCockpitScreen() {
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
      const snap = await fetchFounderCockpit();
      setData(snap);
    } catch (e) {
      setData(null);
      setErr(e instanceof Error ? e.message : "Failed to load cockpit");
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
    <BiometricGate title="Founder cockpit" subtitle="Exec-only surface. Requires device unlock + internal ops secret." allowSkip={false}>
      <OperationalScreen title="Founder cockpit" subtitle="Exec-only · audited endpoints">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.h2, { color: colors.foreground }]}>Access</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            This uses internal operator auth headers. Keep this secret off shared devices.
          </Text>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>INTERNAL_OPS_SECRET</Text>
          <TextInput
            value={secret}
            onChangeText={setSecret}
            placeholder="Paste X-Internal-Ops-Secret"
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
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.92 },
              ]}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Save & refresh</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.warning();
                void (async () => {
                  await clearFounderOpsSecret();
                  setSecret("");
                  setData(null);
                })();
              }}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: colors.destructive + "22", borderWidth: 1, borderColor: colors.destructive + "55" },
                pressed && { opacity: 0.92 },
              ]}
            >
              <Text style={[styles.btnText, { color: colors.destructive }]}>Clear secret</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          {busy ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center" }]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.sub, { color: colors.mutedForeground, marginTop: 8 }]}>Loading snapshot…</Text>
            </View>
          ) : err ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.h2, { color: colors.destructive }]}>Error</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>{err}</Text>
            </View>
          ) : data ? (
            <Snapshot data={data} />
          ) : (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.h2, { color: colors.foreground }]}>Ready</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                Save your secret to load the cockpit snapshot.
              </Text>
            </View>
          )}
        </View>
      </OperationalScreen>
    </BiometricGate>
  );
}

function Snapshot({ data }: { data: FounderCockpitSnapshot }) {
  const colors = useColors();
  const obs = data.observability;
  const ph = data.platformHealth;
  const support: NonNullable<FounderCockpitSnapshot["support"]> = data.support ?? {
    openTotal: 0,
    urgentOpen: 0,
    oldestOpenHours: null as number | null,
    urgent: [] as NonNullable<FounderCockpitSnapshot["support"]>["urgent"],
  };
  const rollouts: NonNullable<FounderCockpitSnapshot["rollouts"]> = data.rollouts ?? {
    globalEnabled: [] as NonNullable<FounderCockpitSnapshot["rollouts"]>["globalEnabled"],
    totalFlags: 0,
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[styles.h2, { color: colors.foreground }]}>Today</Text>
          <Text style={[styles.mini, { color: colors.mutedForeground }]}>{formatTime(obs.timestamp)}</Text>
        </View>
        <Metric label="Bookings today" value={String(obs.traffic.bookingsToday)} />
        <Metric label="Pending bookings" value={String(obs.traffic.bookingsPending)} />
        <Metric label="Open conversations" value={String(obs.traffic.conversationsOpen)} />
        <Metric
          label="Support (open / urgent / oldest)"
          value={`${support.openTotal} / ${support.urgentOpen} / ${
            support.oldestOpenHours === null ? "—" : `${support.oldestOpenHours}h`
          }`}
        />
      </View>

      {support.urgent.length > 0 ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.h2, { color: colors.foreground }]}>Urgent tickets</Text>
          {support.urgent.slice(0, 6).map((t: (typeof support.urgent)[number]) => (
            <View key={t.id} style={{ marginTop: 10 }}>
              <Text style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>
                {t.businessName} · {t.category}
              </Text>
              <Text style={[styles.mini, { color: colors.mutedForeground }]} numberOfLines={1}>
                {t.id} · {t.assignedTo ?? "unassigned"}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.h2, { color: colors.foreground }]}>Rollouts</Text>
        <Metric label="Global flags (total)" value={String(rollouts.totalFlags)} />
        <Metric label="Enabled globally" value={String(rollouts.globalEnabled.length)} />
        {rollouts.globalEnabled.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            {rollouts.globalEnabled.slice(0, 6).map((f: (typeof rollouts.globalEnabled)[number]) => (
              <Text key={f.key} style={[styles.sub, { color: colors.mutedForeground, marginTop: 6 }]}>
                {f.key}
                {f.description ? ` — ${f.description}` : ""}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.h2, { color: colors.foreground }]}>Automation</Text>
        <Metric label="Inngest enabled" value={ph.inngestEnabled ? "yes" : "no"} />
        <Metric label="Notifications (sent / failed)" value={`${obs.traffic.messagesLast24h} / ${obs.traffic.messagesFailed24h}`} />
        <Metric label="DB ping" value={obs.database.ok ? `OK (${obs.database.latencyMs}ms)` : "FAILED"} />
      </View>

      {obs.alerts?.length ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.h2, { color: colors.foreground }]}>Alerts</Text>
          {obs.alerts.slice(0, 6).map((a, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 8 }}>
              <Feather
                name={a.level === "critical" ? "alert-triangle" : "info"}
                size={16}
                color={a.level === "critical" ? colors.destructive : colors.primary}
              />
              <Text style={[styles.sub, { color: colors.mutedForeground, flex: 1 }]}>{a.message}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.h2, { color: colors.foreground }]}>Platform</Text>
        <Metric label="Env" value={ph.nodeEnv} />
        <Metric label="API version" value={ph.version} />
        <Metric label="Tenants" value={String(ph.tenantCount)} />
        <Metric label="Stripe configured" value={ph.stripeConfigured ? "yes" : "no"} />
        <Metric label="Clerk configured" value={ph.clerkConfigured ? "yes" : "no"} />
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


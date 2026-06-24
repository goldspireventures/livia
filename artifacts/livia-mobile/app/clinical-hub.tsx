import { useListCustomers } from "@workspace/api-client-react";
import { resolveVerticalKey } from "@workspace/policy";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { OperationalScreen } from "@/components/OperationalScreen";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useMembership } from "@/hooks/useMembership";
import {
  fetchClinicalHub,
  markIntakeReviewed,
  signMedspaConsent,
  submitMedspaIntake,
  type MedspaConsentRow,
  type MedspaIntakeRow,
} from "@/lib/medspa-api";
import { verticalAccentHex } from "@/lib/vertical-theme";
import { fonts, type } from "@/constants/typography";

type Tab = "consents" | "intakes";

export default function ClinicalHubScreen() {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();
  const { currentBusiness } = useBusiness();
  const { role } = useMembership();
  const bid = currentBusiness?.id ?? "";
  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const key = resolveVerticalKey(vertical, currentBusiness?.category);
  const accent = verticalAccentHex(vertical, currentBusiness?.category);
  const canSign = role === "OWNER" || role === "ADMIN";

  const [tab, setTab] = useState<Tab>("consents");
  const [loading, setLoading] = useState(true);
  const [consents, setConsents] = useState<MedspaConsentRow[]>([]);
  const [intakes, setIntakes] = useState<MedspaIntakeRow[]>([]);
  const [signTarget, setSignTarget] = useState<MedspaConsentRow | null>(null);
  const [signature, setSignature] = useState("");
  const [signing, setSigning] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeCustomerId, setIntakeCustomerId] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState("");
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);

  const { data: customersData } = useListCustomers(bid, undefined, {
    query: { enabled: !!bid && intakeOpen } as never,
  });
  const customers = Array.isArray(customersData) ? customersData : [];

  const load = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    try {
      const data = await fetchClinicalHub(bid);
      setConsents(data.consents);
      setIntakes(data.intakes);
    } catch {
      setConsents([]);
      setIntakes([]);
    } finally {
      setLoading(false);
    }
  }, [bid]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (key !== "medspa") {
    return (
      <OperationalScreen title="Clinical hub" subtitle="Medspa locations only">
        <EmptyState
          icon="activity"
          title="Wrong vertical"
          subtitle="Switch to a medspa business (e.g. Clarity Medspa) or update vertical in settings on web."
        />
      </OperationalScreen>
    );
  }

  async function onSignConsent() {
    if (!bid || !signTarget || !signature.trim()) return;
    setSigning(true);
    try {
      await signMedspaConsent(
        bid,
        signTarget.id,
        signature.trim(),
        signTarget.bookingId ?? undefined,
      );
      haptics.success();
      setSignTarget(null);
      setSignature("");
      await load();
    } catch {
      haptics.warning();
    } finally {
      setSigning(false);
    }
  }

  async function onReviewIntake(intakeId: string) {
    if (!bid || !canSign) return;
    await markIntakeReviewed(bid, intakeId);
    haptics.success();
    await load();
  }

  async function onSubmitIntake() {
    if (!bid || !intakeCustomerId) return;
    setIntakeSubmitting(true);
    try {
      await submitMedspaIntake(bid, {
        customerId: intakeCustomerId,
        allergies: allergies.trim() || undefined,
        medications: medications.trim() || undefined,
        conditions: conditions.trim() || undefined,
        submit: true,
      });
      haptics.success();
      setIntakeOpen(false);
      setAllergies("");
      setMedications("");
      setConditions("");
      setTab("intakes");
      await load();
    } catch {
      haptics.warning();
    } finally {
      setIntakeSubmitting(false);
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "consents", label: "Consents", count: consents.length },
    { id: "intakes", label: "Intakes", count: intakes.length },
  ];

  return (
    <OperationalScreen
      eyebrow="Medspa"
      title="Clinical hub"
      subtitle="Consent queue and medical intake review — separate from booking approvals. Slot waitlist is on Today via Liv."
      refreshing={loading}
      onRefresh={() => void load()}
      actions={
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
      }
    >
      <View style={styles.tabRow}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[
                styles.tab,
                {
                  borderColor: active ? accent : colors.border,
                  backgroundColor: active ? accent + "18" : colors.card,
                },
              ]}
            >
              <Text style={[styles.tabLabel, { color: colors.foreground }]}>{t.label}</Text>
              {(t.count ?? 0) > 0 ? (
                <View style={[styles.tabBadge, { backgroundColor: accent }]}>
                  <Text style={styles.tabBadgeText}>{t.count}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={accent} style={{ marginTop: 24 }} />
      ) : tab === "consents" ? (
        consents.length === 0 ? (
          <EmptyState
            icon="file-text"
            title="No pending consents"
            subtitle="Public bookings sign at checkout. In-clinic consents appear here until signed."
          />
        ) : (
          consents.map((row) => (
            <View
              key={row.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {row.procedureLabel}
              </Text>
              <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                Pending · {new Date(row.createdAt).toLocaleString()}
              </Text>
              <View style={styles.cardActions}>
                <Pressable onPress={() => router.push(`/customer/${row.customerId}` as never)}>
                  <Text style={{ color: accent, fontFamily: fonts.bodySemi }}>Client</Text>
                </Pressable>
                {row.bookingId ? (
                  <Pressable onPress={() => router.push(`/booking/${row.bookingId}` as never)}>
                    <Text style={{ color: accent, fontFamily: fonts.bodySemi }}>Booking</Text>
                  </Pressable>
                ) : null}
                {canSign ? (
                  <Pressable
                    onPress={() => {
                      setSignTarget(row);
                      setSignature("");
                    }}
                    style={[styles.primaryBtn, { backgroundColor: accent }]}
                  >
                    <Text style={styles.primaryBtnText}>Sign in clinic</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        )
      ) : tab === "intakes" ? (
        <>
          {canSign ? (
            <Pressable
              onPress={() => setIntakeOpen(true)}
              style={[styles.primaryBtn, { backgroundColor: accent, alignSelf: "flex-start", marginBottom: 12 }]}
            >
              <Text style={styles.primaryBtnText}>Log intake</Text>
            </Pressable>
          ) : null}
          {intakes.length === 0 ? (
          <EmptyState
            icon="heart"
            title="No intakes awaiting review"
            subtitle="Submitted medical forms land here for practitioner sign-off."
          />
        ) : (
          intakes.map((row) => (
            <View
              key={row.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Medical intake</Text>
              {row.allergies ? (
                <Text style={[styles.line, { color: colors.foreground }]}>
                  Allergies: {row.allergies}
                </Text>
              ) : null}
              {row.medications ? (
                <Text style={[styles.line, { color: colors.foreground }]}>
                  Medications: {row.medications}
                </Text>
              ) : null}
              {row.conditions ? (
                <Text style={[styles.line, { color: colors.foreground }]}>
                  Conditions: {row.conditions}
                </Text>
              ) : null}
              {row.priorProcedures ? (
                <Text style={[styles.line, { color: colors.mutedForeground }]}>
                  Prior: {row.priorProcedures}
                </Text>
              ) : null}
              {row.notes ? (
                <Text style={[styles.line, { color: colors.mutedForeground }]}>{row.notes}</Text>
              ) : null}
              <View style={styles.cardActions}>
                <Pressable onPress={() => router.push(`/customer/${row.customerId}` as never)}>
                  <Text style={{ color: accent, fontFamily: fonts.bodySemi }}>Client</Text>
                </Pressable>
                {canSign ? (
                  <Pressable
                    onPress={() => void onReviewIntake(row.id)}
                    style={[styles.primaryBtn, { backgroundColor: accent }]}
                  >
                    <Text style={styles.primaryBtnText}>Mark reviewed</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        )}
        </>
      ) : null}

      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
        Booking confirmations that need a yes still live under Approvals. This hub is clinical compliance only.
      </Text>

      <Modal visible={intakeOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Medical intake</Text>
            <Text style={[styles.cardMeta, { color: colors.mutedForeground, marginBottom: 8 }]}>
              Select client and enter clinical notes — submits to review queue.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {customers.map((c) => {
                const label =
                  c.displayName ??
                  [c.firstName, c.lastName].filter(Boolean).join(" ") ??
                  "Client";
                const active = intakeCustomerId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setIntakeCustomerId(c.id)}
                    style={[
                      styles.intakeChip,
                      {
                        borderColor: active ? accent : colors.border,
                        backgroundColor: active ? accent + "18" : "transparent",
                      },
                    ]}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 12 }}>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <TextInput
              value={allergies}
              onChangeText={setAllergies}
              placeholder="Allergies"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            />
            <TextInput
              value={medications}
              onChangeText={setMedications}
              placeholder="Medications"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            />
            <TextInput
              value={conditions}
              onChangeText={setConditions}
              placeholder="Conditions / notes"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setIntakeOpen(false)}>
                <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void onSubmitIntake()}
                disabled={intakeSubmitting || !intakeCustomerId}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: accent,
                    opacity: intakeCustomerId && !intakeSubmitting ? 1 : 0.5,
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {intakeSubmitting ? "Saving…" : "Submit for review"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!signTarget} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Sign consent — {signTarget?.procedureLabel}
            </Text>
            <Text style={[styles.cardMeta, { color: colors.mutedForeground, marginBottom: 12 }]}>
              Client must sign with their legal name. This records in-clinic consent when checkout was skipped.
            </Text>
            <TextInput
              value={signature}
              onChangeText={setSignature}
              placeholder="Full legal name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSignTarget(null)}>
                <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void onSignConsent()}
                disabled={signing || !signature.trim()}
                style={[styles.primaryBtn, { backgroundColor: accent, opacity: signature.trim() ? 1 : 0.5 }]}
              >
                <Text style={styles.primaryBtnText}>{signing ? "Saving…" : "Record signature"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: { fontFamily: fonts.bodySemi, fontSize: 13 },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tabBadgeText: { color: "#0f172a", fontSize: 11, fontFamily: fonts.bodySemi },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 6 },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 16 },
  cardMeta: { fontSize: 12 },
  line: { fontSize: 13, lineHeight: 18 },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 8 },
  primaryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  primaryBtnText: { color: "#0f172a", fontFamily: fonts.bodySemi, fontSize: 13 },
  footnote: { ...type.caption, marginTop: 16, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: { padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  intakeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
});

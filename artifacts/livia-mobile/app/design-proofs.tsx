import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { ScreenTopBar } from "@/components/ScreenTopBar";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { useMembership } from "@/hooks/useMembership";
import {
  createDesignProof,
  listDesignProofs,
  updateDesignProofStatus,
  type DesignProofRow,
  type DesignProofStatus,
} from "@/lib/design-proofs-api";
import { pickImageAndUpload } from "@/lib/upload-media";
import { verticalAccentHex } from "@/lib/vertical-theme";
import { parseDesignProofGuestFeedback, stripDesignProofGuestFeedback } from "@workspace/policy";
import { DesignProofVersionBar } from "@/components/design-proofs/DesignProofVersionBar";
import { fonts, type } from "@/constants/typography";

const FILTERS: Array<{ id: DesignProofStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending_review", label: "Pending" },
  { id: "draft", label: "Draft" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Changes" },
];

export default function DesignProofsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ proof?: string }>();
  const haptics = useHaptics();
  const { markReadByResource } = useInAppNotifications();
  const { currentBusiness } = useBusiness();
  const { role } = useMembership();
  const bid = currentBusiness?.id ?? "";
  const accent = verticalAccentHex(
    (currentBusiness as { vertical?: string } | undefined)?.vertical,
    currentBusiness?.category,
  );
  const canEdit = role === "OWNER" || role === "ADMIN";

  const [rows, setRows] = useState<DesignProofRow[]>([]);
  const [filter, setFilter] = useState<DesignProofStatus | "all">("pending_review");
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const scrolledProof = useRef(false);

  const load = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    try {
      const status = filter === "all" ? undefined : filter;
      const list = await listDesignProofs(bid, status);
      setRows(list);
      const proofId = params.proof?.trim();
      if (proofId) {
        const match = list.find((p) => p.id === proofId);
        if (!match) {
          const all = await listDesignProofs(bid);
          const found = all.find((p) => p.id === proofId);
          if (found) {
            setFilter("all");
            setRows(all);
            setHighlightId(proofId);
          }
        } else {
          setHighlightId(proofId);
        }
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [bid, filter, params.proof]);

  React.useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const proofId = params.proof?.trim();
    if (!proofId || !bid) return;
    void markReadByResource({
      resourceKind: "design_proof",
      resourceId: proofId,
      businessId: bid,
    }).catch(() => undefined);
  }, [params.proof, bid, markReadByResource]);

  useEffect(() => {
    if (!highlightId || scrolledProof.current || rows.length === 0) return;
    scrolledProof.current = true;
  }, [highlightId, rows.length]);

  async function onCreate() {
    if (!bid || !canEdit) return;
    setSaving(true);
    try {
      const created = await createDesignProof(bid, {
        imageUrl: imageUrl.trim() || undefined,
        note: note.trim() || undefined,
      });
      await updateDesignProofStatus(bid, created.id, "pending_review");
      haptics.success();
      setImageUrl("");
      setNote("");
      setShowForm(false);
      setFilter("pending_review");
      await load();
    } catch {
      haptics.warning();
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: DesignProofStatus) {
    if (!bid || !canEdit) return;
    haptics.tap();
    await updateDesignProofStatus(bid, id, status);
    haptics.success();
    await load();
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: 40,
        paddingHorizontal: 16,
      }}
    >
      <ScreenTopBar />
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.foreground }]}>Design proofs</Text>
      <Text style={[styles.lede, { color: colors.mutedForeground }]}>
        Tattoo art queue — submit, send for review, approve or reject before the session is locked in.
      </Text>

      {canEdit ? (
        <Pressable
          onPress={() => setShowForm((v) => !v)}
          style={[styles.addToggle, { borderColor: accent }]}
        >
          <Feather name={showForm ? "minus" : "plus"} size={18} color={accent} />
          <Text style={{ color: accent, fontFamily: fonts.bodySemi }}>
            {showForm ? "Hide new proof" : "New proof"}
          </Text>
        </Pressable>
      ) : (
        <Text style={[styles.lede, { color: colors.mutedForeground }]}>
          Only owners and admins can submit or approve proofs.
        </Text>
      )}

      {showForm && canEdit ? (
        <View style={[styles.form, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Image URL</Text>
          <TextInput
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://…"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          />
          <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Notes</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Placement, size, client refs…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.input, styles.inputMulti, { color: colors.foreground, borderColor: colors.border }]}
          />
          <Pressable
            onPress={() => void onCreate()}
            disabled={saving}
            style={[styles.primaryBtn, { backgroundColor: accent, opacity: saving ? 0.6 : 1 }]}
          >
            <Text style={styles.primaryBtnText}>
              {saving ? "Submitting…" : "Submit for review"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.chip,
                {
                  borderColor: active ? accent : colors.border,
                  backgroundColor: active ? accent + "18" : colors.card,
                },
              ]}
            >
              <Text style={{ color: colors.foreground, fontSize: 12 }}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={accent} style={{ marginTop: 24 }} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="image"
          title="No proofs in this filter"
          subtitle={
            filter === "pending_review"
              ? "When art is waiting for your yes, it shows here."
              : "Try another filter or add a new proof above."
          }
        />
      ) : (
        rows.map((p) => {
          const guestRemarks =
            p.guestFeedback ?? parseDesignProofGuestFeedback(p.note);
          const studioLabel = stripDesignProofGuestFeedback(p.note) ?? p.note ?? "—";
          return (
          <View
            key={p.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: p.id === highlightId ? accent : accent + "44",
                borderWidth: p.id === highlightId ? 2 : 1,
              },
            ]}
          >
            <View style={styles.cardRow}>
              {p.imageUrl ? (
                <Image source={{ uri: p.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, { backgroundColor: accent + "18" }]}>
                  <Feather name="image" size={24} color={accent} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {p.status.replace(/_/g, " ")}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }} numberOfLines={2}>
                  {studioLabel}
                </Text>
                {guestRemarks ? (
                  <View
                    style={[
                      styles.remarksBox,
                      { backgroundColor: accent + "12", borderColor: accent + "44" },
                    ]}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 12, fontFamily: fonts.bodySemi }}>
                      Client remarks
                    </Text>
                    <Text style={{ color: colors.foreground, fontSize: 12, marginTop: 4 }}>
                      {guestRemarks}
                    </Text>
                  </View>
                ) : p.status === "rejected" ? (
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 6 }}>
                    Changes requested — no written notes from client.
                  </Text>
                ) : null}
                <View style={styles.links}>
                  {p.bookingId ? (
                    <Pressable onPress={() => router.push(`/booking/${p.bookingId}` as never)}>
                      <Text style={{ color: accent, fontSize: 12, fontFamily: fonts.bodySemi }}>
                        Booking
                      </Text>
                    </Pressable>
                  ) : null}
                  {p.customerId ? (
                    <Pressable onPress={() => router.push(`/customer/${p.customerId}` as never)}>
                      <Text style={{ color: accent, fontSize: 12, fontFamily: fonts.bodySemi }}>
                        Client
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
            {p.id === highlightId || p.status === "pending_review" || p.status === "rejected" ? (
              <DesignProofVersionBar
                businessId={bid}
                proofId={p.id}
                version={p.version}
                imageUrl={p.imageUrl}
                accent={accent}
                onReverted={() => void load()}
              />
            ) : null}
            {canEdit && (p.status === "draft" || p.status === "rejected") ? (
              <View style={styles.actions}>
                <Pressable
                  onPress={() => void setStatus(p.id, "approved")}
                  style={[styles.actionBtn, { backgroundColor: accent }]}
                >
                  <Text style={styles.primaryBtnText}>Signed off in studio</Text>
                </Pressable>
                <Pressable
                  onPress={() => void setStatus(p.id, "rejected")}
                  style={[styles.actionBtn, { borderColor: colors.border, borderWidth: 1 }]}
                >
                  <Text style={{ color: colors.foreground, fontFamily: fonts.bodySemi }}>Request changes</Text>
                </Pressable>
                {p.status === "draft" ? (
                  <Pressable onPress={() => void setStatus(p.id, "pending_review")}>
                    <Text style={{ color: accent, fontSize: 12 }}>Send for review</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : p.status === "pending_review" ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8 }}>
                Awaiting client on their guest link.
              </Text>
            ) : null}
          </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backText: { fontFamily: fonts.bodySemi },
  title: { fontFamily: fonts.serifMedium, fontSize: 28, marginBottom: 8 },
  lede: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  addToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  form: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16, gap: 8 },
  uploadRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  uploadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  preview: { width: "100%", height: 140, borderRadius: 10, marginBottom: 8 },
  formLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  inputMulti: { minHeight: 72, textAlignVertical: "top" },
  primaryBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  primaryBtnText: { color: "#0f172a", fontFamily: fonts.bodySemi, fontSize: 14 },
  filterScroll: { marginBottom: 12, maxHeight: 40 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  cardRow: { flexDirection: "row", gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 15, textTransform: "capitalize" },
  remarksBox: { marginTop: 8, padding: 8, borderRadius: 8, borderWidth: 1 },
  links: { flexDirection: "row", gap: 12, marginTop: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
});

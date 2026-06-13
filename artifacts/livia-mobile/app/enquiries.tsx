import { customFetch } from "@workspace/api-client-react";
import {
  consultEnquiryStatusLabel,
  consultQuotesHref,
  ENQUIRY_DECLINE_REASONS,
  resolveConsultLeadDecision,
  unifiedConsultInboxSubtitle,
  type EnquiryDeclineReasonId,
} from "@workspace/policy";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OperationalScreen } from "@/components/OperationalScreen";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { asHref } from "@/lib/navigation";
import {
  copyEnquiryWhatsApp,
  copyQuoteWhatsApp,
  fetchEnquiries,
  generateQuote,
  type EnquiryRow,
} from "@/lib/event-vendor-consult";
import { FeatureUnlockGate } from "@/components/FeatureUnlockCard";

export default function EnquiriesScreen() {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";

  const [rows, setRows] = useState<EnquiryRow[]>([]);
  const [selected, setSelected] = useState<EnquiryRow | null>(null);
  const [linkedQuoteId, setLinkedQuoteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState<EnquiryDeclineReasonId>("other");
  const [declinePreview, setDeclinePreview] = useState<string | null>(null);
  const [declineBusy, setDeclineBusy] = useState(false);

  const load = useCallback(async () => {
    if (!bid) return;
    try {
      const enquiries = await fetchEnquiries(bid);
      setRows(enquiries);
      if (!selected && enquiries[0]) setSelected(enquiries[0]);
    } catch {
      setRows([]);
    }
  }, [bid, selected]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!bid || !selected?.id) {
      setLinkedQuoteId(null);
      return;
    }
    void customFetch<Array<{ id: string; enquiryId?: string | null }>>(`/api/businesses/${bid}/quotes`)
      .then((list) => setLinkedQuoteId(list.find((q) => q.enquiryId === selected.id)?.id ?? null))
      .catch(() => setLinkedQuoteId(null));
  }, [bid, selected?.id]);

  useEffect(() => {
    if (!declineOpen || !bid || !selected?.id) {
      setDeclinePreview(null);
      return;
    }
    void customFetch<{ body: string }>(
      `/api/businesses/${bid}/enquiries/${selected.id}/decline-draft?reason=${encodeURIComponent(declineReason)}`,
    )
      .then((draft) => setDeclinePreview(draft.body))
      .catch(() => setDeclinePreview(null));
  }, [declineOpen, bid, selected?.id, declineReason]);

  async function onGenerateQuote() {
    if (!bid || !selected) return;
    haptics.tap();
    try {
      const quote = await generateQuote(bid, selected.id);
      if (quote.reusedExisting) {
        /* existing draft — open it */
      }
      router.push(asHref(`/quotes?id=${quote.id}`));
    } catch {
      /* silent — operator can retry */
    }
  }

  async function onCopyWhatsApp() {
    if (!bid || !selected) return;
    try {
      const { whatsappText } = linkedQuoteId
        ? await copyQuoteWhatsApp(bid, linkedQuoteId)
        : await copyEnquiryWhatsApp(bid, selected.id);
      await Share.share({ message: whatsappText });
    } catch {
      /* optional assist */
    }
  }

  async function confirmDecline() {
    if (!bid || !selected) return;
    setDeclineBusy(true);
    try {
      const result = await customFetch<{
        ok: boolean;
        whatsappText?: string;
        emailStatus?: string;
      }>(`/api/businesses/${bid}/enquiries/${selected.id}/decline-with-liv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonId: declineReason }),
      });
      if (!result.ok) return;
      setDeclineOpen(false);
      setSelected(null);
      await load();
      if (result.emailStatus !== "sent" && result.whatsappText) {
        await Share.share({ message: result.whatsappText });
      }
    } catch {
      /* operator can retry */
    } finally {
      setDeclineBusy(false);
    }
  }

  const listPane = (
    <View style={[styles.listPane, isTablet && styles.listPaneTablet]}>
      {rows.map((row) => (
        <Pressable
          key={row.id}
          onPress={() => {
            haptics.tap();
            setSelected(row);
          }}
          style={[
            styles.row,
            { borderColor: colors.border, backgroundColor: colors.card },
            selected?.id === row.id && { borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>{row.contactName}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
            {row.eventType ?? "Event"} · {row.eventDate ?? "TBC"}
          </Text>
          <Text style={[styles.badge, { color: colors.primary }]}>{consultEnquiryStatusLabel(row.status)}</Text>
        </Pressable>
      ))}
    </View>
  );

  const leadDecision = selected
    ? resolveConsultLeadDecision(selected.status, { hasLinkedQuote: !!linkedQuoteId })
    : null;

  const detailPane = selected ? (
    <View style={[styles.detailPane, { borderColor: colors.border }]}>
      <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selected.contactName}</Text>
      {leadDecision ? (
        <View style={styles.actions}>
          {leadDecision.hint ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>{leadDecision.hint}</Text>
          ) : null}
          <ActionBtn
            label={leadDecision.primary.label}
            primary
            colors={colors}
            onPress={() => {
              if (leadDecision.primary.action === "decline") setDeclineOpen(true);
              else if (linkedQuoteId) router.push(asHref(consultQuotesHref(linkedQuoteId)));
              else void onGenerateQuote();
            }}
          />
          {leadDecision.secondary ? (
            <ActionBtn
              label={leadDecision.secondary.label}
              colors={colors}
              onPress={() => {
                if (leadDecision.secondary?.action === "decline") setDeclineOpen(true);
                else if (leadDecision.secondary?.action === "mark_booked") {
                  void customFetch(`/api/businesses/${bid}/enquiries/${selected.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "booked" }),
                  }).then(() => void load());
                }
              }}
            />
          ) : null}
          {selected.status !== "lost" && selected.status !== "booked" ? (
            <ActionBtn label="Share WhatsApp reply" colors={colors} onPress={() => void onCopyWhatsApp()} />
          ) : null}
        </View>
      ) : null}
      <DetailRow label="Event" value={`${selected.eventType ?? "—"} · ${selected.guestCount ?? "?"} guests`} colors={colors} />
      <DetailRow label="Date" value={selected.eventDate ?? "TBC"} colors={colors} />
      <DetailRow label="Theme" value={selected.theme ?? "—"} colors={colors} />
      <DetailRow label="Venue" value={selected.venue ?? "—"} colors={colors} />
      <DetailRow label="Budget" value={selected.budgetRange ?? "—"} colors={colors} />
    </View>
  ) : (
    <View style={styles.detailPane}>
      <Text style={{ color: colors.mutedForeground }}>Select an enquiry</Text>
    </View>
  );

  return (
    <OperationalScreen scroll={false} ritualPage title="Inbox" subtitle={unifiedConsultInboxSubtitle()}>
      <FeatureUnlockGate featureId="consult_first_inbox" businessId={bid}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        {isTablet ? (
          <View style={styles.tabletRow}>
            {listPane}
            {detailPane}
          </View>
        ) : (
          <>
            {listPane}
            {detailPane}
          </>
        )}
      </ScrollView>

      <Modal visible={declineOpen} animationType="slide" transparent onRequestClose={() => setDeclineOpen(false)}>
        <View style={[styles.modalBackdrop, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Decline enquiry</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>Reason</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ENQUIRY_DECLINE_REASONS.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => {
                      haptics.selection();
                      setDeclineReason(r.id);
                    }}
                    style={[
                      styles.reasonChip,
                      {
                        borderColor: declineReason === r.id ? colors.primary : colors.border,
                        backgroundColor: declineReason === r.id ? `${colors.primary}18` : colors.background,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 12 }}>{r.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 6 }}>Preview</Text>
            <ScrollView style={[styles.previewBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
              {declinePreview ? (
                <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 19 }}>{declinePreview}</Text>
              ) : (
                <ActivityIndicator color={colors.primary} />
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <ActionBtn label="Cancel" colors={colors} onPress={() => setDeclineOpen(false)} />
              <ActionBtn
                label={declineBusy ? "Sending…" : "Decline & send"}
                primary
                colors={colors}
                onPress={() => void confirmDecline()}
              />
            </View>
          </View>
        </View>
      </Modal>
      </FeatureUnlockGate>
    </OperationalScreen>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <Text style={{ color: colors.foreground }}>{value}</Text>
    </View>
  );
}

function ActionBtn({
  label,
  onPress,
  colors,
  primary,
}: {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionBtn,
        primary
          ? { backgroundColor: colors.primary }
          : { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <Text style={{ color: primary ? colors.primaryForeground : colors.foreground, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabletRow: { flexDirection: "row", gap: 12, minHeight: 400 },
  listPane: { gap: 8, paddingHorizontal: 16 },
  listPaneTablet: { flex: 1, maxWidth: 360 },
  row: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  rowTitle: { fontWeight: "600", fontSize: 16 },
  badge: { fontSize: 11, marginTop: 4, textTransform: "uppercase" },
  detailPane: { marginTop: 12, marginHorizontal: 16, borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 },
  detailTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  detailRow: { gap: 2 },
  detailLabel: { fontSize: 10, letterSpacing: 0.6, fontWeight: "600" },
  actions: { gap: 8, marginTop: 12 },
  actionBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 16,
    justifyContent: "flex-end",
  },
  modalCard: { borderWidth: 1, borderRadius: 16, padding: 16, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  reasonChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  previewBox: { borderWidth: 1, borderRadius: 10, padding: 12, maxHeight: 180, marginBottom: 12 },
  modalActions: { gap: 8 },
});

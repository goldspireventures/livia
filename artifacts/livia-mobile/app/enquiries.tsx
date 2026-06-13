import { customFetch } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
  copyStaleNudge,
  eur,
  fetchConsultDashboard,
  fetchEnquiries,
  generateQuote,
  type ConsultDashboard,
  type EnquiryRow,
} from "@/lib/event-vendor-consult";
import { resolveConsultLeadDecision } from "@workspace/policy";

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
  const [stats, setStats] = useState<ConsultDashboard | null>(null);
  const [selected, setSelected] = useState<EnquiryRow | null>(null);
  const [linkedQuoteId, setLinkedQuoteId] = useState<string | null>(null);
  const [prescreen, setPrescreen] = useState<{
    tier: string;
    headline: string;
    guidance: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!bid) return;
    try {
      const [enquiries, dash] = await Promise.all([fetchEnquiries(bid), fetchConsultDashboard(bid)]);
      setRows(enquiries);
      setStats(dash);
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
    if (!bid || !selected?.id || selected.status !== "new") {
      setPrescreen(null);
      return;
    }
    void customFetch<{ prescreen?: { tier: string; headline: string; guidance: string } }>(
      `/api/businesses/${bid}/enquiries/${selected.id}/quote-brief`,
    )
      .then((brief) => setPrescreen(brief.prescreen ?? null))
      .catch(() => setPrescreen(null));
  }, [bid, selected?.id, selected?.status]);

  async function onGenerateQuote() {
    if (!bid || !selected) return;
    haptics.tap();
    try {
      const quote = await generateQuote(bid, selected.id);
      if (quote.reusedExisting) {
        Alert.alert("Existing draft", "This enquiry already has a draft quote.");
      }
      router.push(asHref(`/quotes?id=${quote.id}`));
    } catch {
      Alert.alert("Could not generate quote");
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
      Alert.alert("Could not load WhatsApp message");
    }
  }

  async function onStaleNudge(quoteId: string) {
    if (!bid) return;
    try {
      const { whatsappText } = await copyStaleNudge(bid, quoteId);
      await Share.share({ message: whatsappText });
    } catch {
      Alert.alert("Could not load follow-up");
    }
  }

  const listPane = (
    <View style={[styles.listPane, isTablet && styles.listPaneTablet]}>
      {stats ? (
        <View style={styles.statsRow}>
          <StatChip label="New" value={stats.newEnquiries} colors={colors} />
          <StatChip label="Quoted" value={stats.quotedEnquiries} colors={colors} />
          <StatChip label="Stale" value={stats.staleQuotes} colors={colors} warn />
        </View>
      ) : null}
      {stats?.staleQuotesList?.slice(0, 3).map((s) => (
        <Pressable
          key={s.quoteId}
          onPress={() => onStaleNudge(s.quoteId)}
          style={[styles.staleRow, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={[styles.staleTitle, { color: colors.foreground }]}>{s.contactName}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {s.daysSinceSent}d · tap to copy Liv nudge
          </Text>
        </Pressable>
      ))}
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
          <Text style={[styles.badge, { color: colors.primary }]}>{row.status}</Text>
        </Pressable>
      ))}
    </View>
  );

  const leadDecision = selected
    ? resolveConsultLeadDecision(selected.status, { hasLinkedQuote: !!linkedQuoteId })
    : null;

  async function onDecline() {
    if (!bid || !selected) return;
    let preview = "Liv will send your polite decline before closing.";
    try {
      const draft = await customFetch<{ body: string }>(
        `/api/businesses/${bid}/enquiries/${selected.id}/decline-draft`,
      );
      preview = draft.body.slice(0, 280) + (draft.body.length > 280 ? "…" : "");
    } catch {
      /* use default preview */
    }
    Alert.alert("Not a fit — Liv replies first", preview, [
      { text: "Keep open", style: "cancel" },
      {
        text: "Liv sends & closes",
        style: "destructive",
        onPress: () => {
          void customFetch(`/api/businesses/${bid}/enquiries/${selected.id}/decline-with-liv`, {
            method: "POST",
          })
            .then(() => {
              setSelected(null);
              void load();
            })
            .catch(() => {
              Alert.alert(
                "Could not send",
                "Liv must reply before we close — check email on the enquiry and try again.",
              );
            });
        },
      },
    ]);
  }

  const detailPane = selected ? (
    <View style={[styles.detailPane, { borderColor: colors.border }]}>
      <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selected.contactName}</Text>
      {prescreen ? (
        <View
          style={[
            styles.prescreenBox,
            {
              borderColor: colors.primary + "44",
              backgroundColor: colors.primary + "11",
            },
          ]}
        >
          <Text style={[styles.prescreenHeadline, { color: colors.foreground }]}>{prescreen.headline}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 18 }}>{prescreen.guidance}</Text>
        </View>
      ) : null}
      {leadDecision ? (
        <View style={[styles.decisionBox, { borderColor: colors.primary + "44", backgroundColor: colors.primary + "11" }]}>
          <Text style={[styles.decisionHeadline, { color: colors.foreground }]}>{leadDecision.headline}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
            {leadDecision.guidance}
          </Text>
          <ActionBtn
            label={leadDecision.primary.label}
            primary
            colors={colors}
            onPress={() => {
              if (leadDecision.primary.action === "decline") void onDecline();
              else if (linkedQuoteId) router.push(asHref(`/quotes?id=${linkedQuoteId}`));
              else void onGenerateQuote();
            }}
          />
          {leadDecision.secondary ? (
            <ActionBtn
              label={leadDecision.secondary.label}
              colors={colors}
              onPress={() => {
                if (leadDecision.secondary?.action === "decline") void onDecline();
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
    <OperationalScreen
      scroll={false}
      ritualPage
      title="Enquiries"
      subtitle="Leads from your enquire form — generate quotes on the go."
    >
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
    </OperationalScreen>
  );
}

function StatChip({
  label,
  value,
  colors,
  warn,
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof useColors>;
  warn?: boolean;
}) {
  return (
    <View style={[styles.stat, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: warn ? "#b45309" : colors.foreground, fontSize: 20, fontWeight: "600" }}>{value}</Text>
    </View>
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
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10 },
  staleRow: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 4 },
  staleTitle: { fontWeight: "600", fontSize: 14 },
  row: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  rowTitle: { fontWeight: "600", fontSize: 16 },
  badge: { fontSize: 11, marginTop: 4, textTransform: "uppercase" },
  detailPane: { marginTop: 12, marginHorizontal: 16, borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 },
  detailTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  prescreenBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8, gap: 4 },
  prescreenHeadline: { fontSize: 14, fontWeight: "600" },
  decisionBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8, gap: 8 },
  decisionHeadline: { fontSize: 15, fontWeight: "600" },
  detailRow: { gap: 2 },
  detailLabel: { fontSize: 10, letterSpacing: 0.6, fontWeight: "600" },
  actions: { gap: 8, marginTop: 12 },
  actionBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
});

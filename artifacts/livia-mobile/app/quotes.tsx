import { customFetch } from "@workspace/api-client-react";
import {
  CLIENT_WITHDRAW_REASONS,
  eventPrepTimelineLoadingLine,
  quotePipelineCurrent,
  resolveQuoteExitActions,
  studioQuoteDetailTitle,
  studioQuoteListLabel,
  type ClientWithdrawReasonId,
} from "@workspace/policy";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { copyStaleNudge, eur, fetchQuotes, type QuoteRow } from "@/lib/event-vendor-consult";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import { getApiBaseUrl } from "@/lib/api-base";
import { FeatureUnlockGate } from "@/components/FeatureUnlockCard";

type QuoteDetail = QuoteRow & {
  personalMessage?: string | null;
  depositPercent: number;
  depositAmountMinor: number;
  depositPaidMinor?: number;
  lines: Array<{ name: string; quantity: string; lineTotalMinor: number }>;
  eventDaySheet?: {
    setupChecklist?: string[];
    eventDate?: string | null;
    eventType?: string | null;
    theme?: string | null;
    guestCount?: number | null;
    venue?: string | null;
  } | null;
  enquiry?: {
    contactName: string;
    status?: string | null;
    eventType?: string | null;
    eventDate?: string | null;
    venue?: string | null;
    theme?: string | null;
  } | null;
};

type PrepView = {
  eventDate?: string | null;
  prepInitializedAt?: string | null;
  lifecycle: {
    prepTasks: Array<{
      id: string;
      label: string;
      dueDate: string;
      completedAt?: string | null;
      phase?: string;
    }>;
  };
};

export default function QuotesScreen() {
  const colors = useColors();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const slug = currentBusiness?.slug ?? "";
  const params = useLocalSearchParams<{ id?: string }>();
  const { markReadByResource } = useInAppNotifications();

  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [selected, setSelected] = useState<QuoteDetail | null>(null);
  const [prepView, setPrepView] = useState<PrepView | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrewOpen, setWithdrewOpen] = useState(false);
  const [withdrewReason, setWithdrewReason] = useState<ClientWithdrawReasonId>("unknown");
  const [withdrewBusy, setWithdrewBusy] = useState(false);

  const loadDetail = useCallback(
    async (quoteId: string) => {
      if (!bid) return;
      try {
        const detail = await customFetch<QuoteDetail>(`/api/businesses/${bid}/quotes/${quoteId}`);
        setSelected(detail);
        const pipeline = quotePipelineCurrent({
          status: detail.status,
          depositPaidMinor: detail.depositPaidMinor ?? 0,
          depositAmountMinor: detail.depositAmountMinor,
        });
        if (pipeline !== "booked" && detail.status !== "accepted") {
          setPrepView(null);
          return;
        }
        setPrepLoading(true);
        try {
          setPrepView(await customFetch<PrepView>(`/api/businesses/${bid}/quotes/${quoteId}/event-prep`));
        } catch {
          setPrepView(null);
        } finally {
          setPrepLoading(false);
        }
      } catch {
        setSelected(null);
        setPrepView(null);
      }
    },
    [bid],
  );

  const loadList = useCallback(async () => {
    if (!bid) return;
    try {
      const list = await fetchQuotes(bid);
      setRows(list);
      const pick = params.id ? list.find((q) => q.id === params.id) : list[0];
      if (pick) await loadDetail(pick.id);
    } catch {
      setRows([]);
    }
  }, [bid, params.id, loadDetail]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    const quoteId = params.id?.trim();
    if (!quoteId || !bid) return;
    void markReadByResource({
      resourceKind: "quote",
      resourceId: quoteId,
      businessId: bid,
    }).catch(() => undefined);
  }, [params.id, bid, markReadByResource]);

  async function sendVia(via: "email" | "whatsapp_assisted") {
    if (!bid || !selected) return;
    haptics.tap();
    try {
      const result = await customFetch<{ whatsappText?: string; emailStatus?: string }>(
        `/api/businesses/${bid}/quotes/${selected.id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ via }),
        },
      );
      if (via === "whatsapp_assisted" && result.whatsappText) {
        await Share.share({ message: result.whatsappText });
      }
      await loadDetail(selected.id);
      void loadList();
    } catch {
      /* operator can retry */
    }
  }

  async function recordClientWithdrew() {
    if (!bid || !selected) return;
    setWithdrewBusy(true);
    try {
      await customFetch(`/api/businesses/${bid}/quotes/${selected.id}/client-withdrew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonId: withdrewReason }),
      });
      setWithdrewOpen(false);
      await loadDetail(selected.id);
      void loadList();
    } catch {
      /* operator can retry */
    } finally {
      setWithdrewBusy(false);
    }
  }

  async function openInvoicePdf() {
    if (!slug || !selected) return;
    const url = `${getApiBaseUrl()}/api/public/${slug}/q/${selected.publicToken}/html`;
    await Linking.openURL(url);
  }

  const exitActions = selected
    ? resolveQuoteExitActions({
        quoteStatus: quotePipelineCurrent({
          status: selected.status,
          depositPaidMinor: selected.depositPaidMinor ?? 0,
          depositAmountMinor: selected.depositAmountMinor,
        }),
        enquiryStatus: selected.enquiry?.status,
        depositPaidMinor: selected.depositPaidMinor ?? 0,
        depositAmountMinor: selected.depositAmountMinor,
      })
    : [];

  const sheet = selected?.eventDaySheet;
  const eventMeta = {
    eventDate: prepView?.eventDate ?? sheet?.eventDate ?? selected?.enquiry?.eventDate,
    eventType: sheet?.eventType ?? selected?.enquiry?.eventType,
    venue: sheet?.venue ?? selected?.enquiry?.venue,
    theme: sheet?.theme ?? selected?.enquiry?.theme,
    guestCount: sheet?.guestCount,
  };
  const showEventDay =
    prepView?.prepInitializedAt ||
    prepLoading ||
    eventMeta.eventDate ||
    eventMeta.venue ||
    eventMeta.theme;

  const listPane = (
    <View style={[styles.listPane, isTablet && styles.listPaneTablet]}>
      {rows.map((row) => {
        const listLabel = studioQuoteListLabel({
          publicToken: row.publicToken,
          eventType: row.enquiry?.eventType,
          eventDate: row.enquiry?.eventDate,
        });
        const pipeline = quotePipelineCurrent({
          status: row.status,
          depositPaidMinor: row.depositPaidMinor ?? 0,
          depositAmountMinor: row.depositAmountMinor ?? 0,
        });
        return (
          <Pressable
            key={row.id}
            onPress={() => {
              haptics.tap();
              void loadDetail(row.id);
            }}
            style={[
              styles.row,
              { borderColor: colors.border, backgroundColor: colors.card },
              selected?.id === row.id && { borderColor: colors.primary },
            ]}
          >
            <View style={styles.rowTop}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {listLabel.primary}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }} numberOfLines={1}>
                  {listLabel.secondary}
                </Text>
              </View>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>{eur(row.subtotalMinor)}</Text>
            </View>
            <Text style={[styles.badge, { color: colors.primary }]}>{pipeline}</Text>
          </Pressable>
        );
      })}
      {rows.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, padding: 16 }}>No quotes yet — issue from inbox.</Text>
      ) : null}
    </View>
  );

  const detailPane = selected ? (
    <View style={[styles.detailPane, { borderColor: colors.border }]}>
      <Text style={[styles.detailTitle, { color: colors.foreground }]}>
        {studioQuoteDetailTitle(selected.publicToken)}
      </Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
        {quotePipelineCurrent({
          status: selected.status,
          depositPaidMinor: selected.depositPaidMinor ?? 0,
          depositAmountMinor: selected.depositAmountMinor,
        }).toUpperCase()}{" "}
        · Deposit {selected.depositPercent}% ({eur(selected.depositAmountMinor)})
      </Text>
      {selected.enquiry?.contactName ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
          Bill to: {selected.enquiry.contactName}
        </Text>
      ) : null}
      {showEventDay ? (
        <View style={[styles.eventDayPanel, { borderColor: colors.primary, backgroundColor: `${colors.primary}12` }]}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>Event day</Text>
          {prepLoading ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 6 }}>
              {eventPrepTimelineLoadingLine()}
            </Text>
          ) : null}
          {!prepLoading && (eventMeta.eventDate || eventMeta.eventType) ? (
            <Text style={{ color: colors.foreground, fontSize: 13, marginTop: 6 }}>
              {eventMeta.eventDate ?? "Date TBC"}
              {eventMeta.eventType ? ` · ${eventMeta.eventType}` : ""}
              {eventMeta.guestCount ? ` · ${eventMeta.guestCount} guests` : ""}
            </Text>
          ) : null}
          {eventMeta.venue ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>{eventMeta.venue}</Text>
          ) : null}
          {eventMeta.theme ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>Theme: {eventMeta.theme}</Text>
          ) : null}
          {prepView?.prepInitializedAt
            ? prepView.lifecycle.prepTasks.map((task) => (
                <Text
                  key={task.id}
                  style={{
                    color: task.completedAt ? colors.mutedForeground : colors.foreground,
                    fontSize: 13,
                    marginTop: 6,
                    textDecorationLine: task.completedAt ? "line-through" : "none",
                  }}
                >
                  · {task.label} ({task.dueDate})
                </Text>
              ))
            : null}
        </View>
      ) : null}
      {selected.personalMessage ? (
        <Text style={{ color: colors.foreground, fontSize: 14, marginBottom: 8 }}>{selected.personalMessage}</Text>
      ) : null}
      {selected.lines.map((line) => (
        <View key={line.name} style={styles.lineRow}>
          <Text style={{ color: colors.foreground, flex: 1 }}>{line.name} × {line.quantity}</Text>
          <Text style={{ color: colors.foreground }}>{eur(line.lineTotalMinor)}</Text>
        </View>
      ))}
      <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
        <Text style={{ color: colors.foreground, fontWeight: "700" }}>Total</Text>
        <Text style={{ color: colors.foreground, fontWeight: "700" }}>{eur(selected.subtotalMinor)}</Text>
      </View>
      <View style={styles.actions}>
        {selected.status === "draft" ? (
          <ActionBtn label="Send email" primary colors={colors} onPress={() => void sendVia("email")} />
        ) : null}
        <ActionBtn label="WhatsApp" colors={colors} onPress={() => void sendVia("whatsapp_assisted")} />
        <ActionBtn label="Invoice PDF" colors={colors} onPress={() => void openInvoicePdf()} />
        {selected.status === "sent" ? (
          <ActionBtn
            label="Stale nudge"
            colors={colors}
            onPress={async () => {
              if (!bid) return;
              const { whatsappText } = await copyStaleNudge(bid, selected.id);
              await Share.share({ message: whatsappText });
            }}
          />
        ) : null}
        {selected.status === "sent" ? (
          <ActionBtn
            label="Revise quote (v+1)"
            colors={colors}
            onPress={async () => {
              if (!bid) return;
              try {
                const row = await customFetch<{ id: string }>(
                  `/api/businesses/${bid}/quotes/${selected.id}/revise`,
                  { method: "POST" },
                );
                await loadDetail(row.id);
                haptics.tap();
              } catch {
                /* operator can retry */
              }
            }}
          />
        ) : null}
        {exitActions.map((action) => (
          <ActionBtn
            key={action.id}
            label={action.label}
            colors={colors}
            onPress={() => {
              if (action.id === "client_withdrew") setWithdrewOpen(true);
              else if (action.id === "mark_lost" && bid) {
                void customFetch(`/api/businesses/${bid}/quotes/${selected.id}/client-withdrew`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reasonId: "unknown" }),
                }).then(() => {
                  void loadDetail(selected.id);
                  void loadList();
                });
              }
            }}
          />
        ))}
        <ActionBtn
          label="Edit on web"
          colors={colors}
          onPress={() => void Linking.openURL(`${getDashboardBaseUrl()}/quotes?id=${selected.id}`)}
        />
      </View>
    </View>
  ) : (
    <View style={styles.detailPane}>
      <Text style={{ color: colors.mutedForeground }}>Select a quote</Text>
    </View>
  );

  return (
    <OperationalScreen
      scroll={false}
      ritualPage
      title="Quotes & invoices"
      subtitle="Send itemised quotes — invoice PDF for clients."
    >
      <FeatureUnlockGate featureId="quote_generator" businessId={bid}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadList().finally(() => setRefreshing(false));
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

      <Modal visible={withdrewOpen} animationType="slide" transparent onRequestClose={() => setWithdrewOpen(false)}>
        <View style={[styles.modalBackdrop, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Client withdrew</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 12 }}>
              Close the quote and enquiry. Liv can send a polite acknowledgement.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {CLIENT_WITHDRAW_REASONS.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => {
                      haptics.selection();
                      setWithdrewReason(r.id);
                    }}
                    style={[
                      styles.reasonChip,
                      {
                        borderColor: withdrewReason === r.id ? colors.primary : colors.border,
                        backgroundColor: withdrewReason === r.id ? `${colors.primary}18` : colors.background,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 12 }}>{r.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <ActionBtn label="Cancel" colors={colors} onPress={() => setWithdrewOpen(false)} />
              <ActionBtn
                label={withdrewBusy ? "Saving…" : "Confirm withdrew"}
                primary
                colors={colors}
                onPress={() => void recordClientWithdrew()}
              />
            </View>
          </View>
        </View>
      </Modal>
      </FeatureUnlockGate>
    </OperationalScreen>
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
  tabletRow: { flexDirection: "row", gap: 12 },
  listPane: { gap: 8, paddingHorizontal: 16 },
  listPaneTablet: { flex: 1, maxWidth: 360 },
  row: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  rowTitle: { fontWeight: "600", fontSize: 16 },
  badge: { fontSize: 10, marginTop: 6, textTransform: "uppercase", fontWeight: "600" },
  detailPane: { marginTop: 12, marginHorizontal: 16, borderWidth: 1, borderRadius: 12, padding: 16 },
  detailTitle: { fontSize: 18, fontWeight: "600" },
  eventDayPanel: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  lineRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, marginTop: 8, paddingTop: 8 },
  sectionLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.6 },
  actions: { gap: 8, marginTop: 16 },
  actionBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 16,
    justifyContent: "flex-end",
  },
  modalCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  reasonChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  modalActions: { gap: 8 },
});

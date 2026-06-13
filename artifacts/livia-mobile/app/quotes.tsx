import { customFetch } from "@workspace/api-client-react";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
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
import { copyStaleNudge, eur, fetchQuotes, type QuoteRow } from "@/lib/event-vendor-consult";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import { getApiBaseUrl } from "@/lib/api-base";

type QuoteDetail = QuoteRow & {
  personalMessage?: string | null;
  depositPercent: number;
  depositAmountMinor: number;
  depositPaidMinor?: number;
  lines: Array<{ name: string; quantity: string; lineTotalMinor: number }>;
  eventDaySheet?: { setupChecklist?: string[] } | null;
};

type PrepView = {
  prepInitializedAt?: string | null;
  lifecycle: { prepTasks: Array<{ id: string; label: string; dueDate: string; completedAt?: string | null; checklist?: string[]; detail?: string[] }> };
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

  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [selected, setSelected] = useState<QuoteDetail | null>(null);
  const [prepView, setPrepView] = useState<PrepView | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
  }, [bid, params.id]);

  async function loadDetail(quoteId: string) {
    if (!bid) return;
    try {
      const detail = await customFetch<QuoteDetail>(`/api/businesses/${bid}/quotes/${quoteId}`);
      setSelected(detail);
      const secured =
        (detail.depositPaidMinor ?? 0) >= detail.depositAmountMinor && detail.depositAmountMinor > 0;
      if (detail.status === "accepted" || secured) {
        try {
          setPrepView(await customFetch<PrepView>(`/api/businesses/${bid}/quotes/${quoteId}/event-prep`));
        } catch {
          setPrepView(null);
        }
      } else {
        setPrepView(null);
      }
    } catch {
      setSelected(null);
      setPrepView(null);
    }
  }

  useEffect(() => {
    void loadList();
  }, [loadList]);

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
      } else {
        Alert.alert("Sent", result.emailStatus === "sent" ? "Quote emailed" : "Quote marked sent");
      }
      await loadDetail(selected.id);
      void loadList();
    } catch {
      Alert.alert("Send failed");
    }
  }

  async function openInvoicePdf() {
    if (!slug || !selected) return;
    const url = `${getApiBaseUrl()}/api/public/${slug}/q/${selected.publicToken}/html`;
    await Linking.openURL(url);
  }

  const listPane = (
    <View style={[styles.listPane, isTablet && styles.listPaneTablet]}>
      {rows.map((row) => (
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
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>
              {row.enquiry?.contactName ?? "Quote"}
            </Text>
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>{eur(row.subtotalMinor)}</Text>
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {row.enquiry?.eventType ?? "Event"} · {row.status}
          </Text>
        </Pressable>
      ))}
      {rows.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, padding: 16 }}>No quotes yet — generate from enquiries.</Text>
      ) : null}
    </View>
  );

  const detailPane = selected ? (
    <View style={[styles.detailPane, { borderColor: colors.border }]}>
      <Text style={[styles.detailTitle, { color: colors.foreground }]}>
        {selected.enquiry?.contactName ?? "Quote"}
      </Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
        {selected.status.toUpperCase()} · Deposit {selected.depositPercent}% ({eur(selected.depositAmountMinor)})
      </Text>
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
      {prepView?.prepInitializedAt ? (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LIV EVENT PREP</Text>
          {prepView.lifecycle.prepTasks.map((task) => (
            <Text
              key={task.id}
              style={{
                color: task.completedAt ? colors.mutedForeground : colors.foreground,
                fontSize: 13,
                marginTop: 4,
                textDecorationLine: task.completedAt ? "line-through" : "none",
              }}
            >
              · {task.label} ({task.dueDate})
            </Text>
          ))}
        </View>
      ) : selected.eventDaySheet?.setupChecklist?.length ? (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SETUP CHECKLIST</Text>
          {selected.eventDaySheet.setupChecklist.map((item) => (
            <Text key={item} style={{ color: colors.foreground, fontSize: 13, marginTop: 4 }}>
              · {item}
            </Text>
          ))}
        </View>
      ) : null}
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
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowTitle: { fontWeight: "600", fontSize: 16 },
  detailPane: { marginTop: 12, marginHorizontal: 16, borderWidth: 1, borderRadius: 12, padding: 16 },
  detailTitle: { fontSize: 18, fontWeight: "600" },
  lineRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, marginTop: 8, paddingTop: 8 },
  sectionLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.6 },
  actions: { gap: 8, marginTop: 16 },
  actionBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
});

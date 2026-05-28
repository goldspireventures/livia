import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import {
  resolveLivProposal,
  useLivMandate,
  useLivProposals,
} from "@/hooks/useLivMandate";
import { invalidateOperationalState } from "@/lib/operational-cache";

const RUNG_SHORT: Record<string, string> = {
  R0: "Observe",
  R1: "Propose-first",
  R2: "Bounded auto",
  R3: "Routine auto",
  R4: "Mandated",
};

export function LivProposalsCard({ businessId }: { businessId: string }) {
  const colors = useColors();
  const haptics = useHaptics();
  const qc = useQueryClient();
  const { data: mandate } = useLivMandate(businessId);
  const { data: proposals, isLoading, refetch } = useLivProposals(businessId);
  const rows = proposals?.data ?? [];
  if (!isLoading && rows.length === 0) return null;

  const onResolve = async (id: string, status: "approved" | "dismissed") => {
    haptics.impact();
    try {
      await resolveLivProposal(businessId, id, status);
      haptics.success();
      invalidateOperationalState(qc, businessId);
      void refetch();
    } catch {
      haptics.warning();
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: aurora.violet + "55",
          shadowColor: aurora.violet,
        },
        elevation.resting,
      ]}
    >
      <View style={[styles.glow, { backgroundColor: aurora.cyan + "12" }]} pointerEvents="none" />
      <View style={styles.head}>
        <Feather name="cpu" size={16} color={aurora.violet} />
        <Text style={[styles.title, { color: colors.foreground }]}>Liv Mandate</Text>
      </View>
      {mandate ? (
        <Text style={[styles.mandateLine, { color: colors.mutedForeground }]}>
          {RUNG_SHORT[mandate.mandate.rung] ?? mandate.mandate.rung} · trust{" "}
          {mandate.mandate.trustScore}%
        </Text>
      ) : null}
      <Text style={[styles.lede, { color: colors.mutedForeground }]}>
        Liv queues actions here when your mandate needs a human yes — not routine bookings.
      </Text>

      {isLoading ? (
        <ActivityIndicator color={aurora.violet} style={{ marginVertical: 8 }} />
      ) : (
        rows.map((p) => (
          <View
            key={p.id}
            style={[styles.row, { borderColor: colors.border }]}
          >
            <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={2}>
              {p.outcomePreview ?? p.action.replace(/_/g, " ")}
            </Text>
            {p.reason ? (
              <Text style={[styles.rowReason, { color: colors.mutedForeground }]} numberOfLines={2}>
                {p.reason}
              </Text>
            ) : null}
            {p.valueMinor && p.valueMinor > 0 ? (
              <Text style={[styles.rowReason, { color: colors.mutedForeground }]}>
                €{(p.valueMinor / 100).toFixed(0)}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <Pressable
                onPress={() => void onResolve(p.id, "dismissed")}
                style={[styles.btn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Dismiss</Text>
              </Pressable>
              <Pressable
                onPress={() => void onResolve(p.id, "approved")}
                style={[styles.btn, { backgroundColor: aurora.violet }]}
              >
                <Text style={{ color: "#0f172a", fontFamily: fonts.bodySemi, fontSize: 13 }}>
                  Approve
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.bodySemi, fontSize: 15 },
  mandateLine: { ...type.caption, fontSize: 12 },
  lede: { ...type.body, fontSize: 13, lineHeight: 18 },
  empty: { ...type.caption, fontSize: 12, fontStyle: "italic" },
  row: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, marginTop: 4, gap: 6 },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 14 },
  rowReason: { fontSize: 12, lineHeight: 16 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});

import { customFetch } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { dashboardSettingsUrl } from "@/lib/dashboard-url";

type OperationalPolicyPayload = {
  policy: {
    depositRequired: boolean;
    depositPercent: number;
    serviceBufferMinutes: number;
    cancelWindowHours?: number;
    noShowStrikeThreshold: number;
    requireDepositAfterStrikes: boolean;
    lateGraceMinutes: number;
    autoConfirmWhenNoDeposit: boolean;
  };
  depositPolicySummary?: string;
  bookingTermsBlock?: string;
};

export function OperationalPolicyBlock({
  businessId,
  canEditOnWeb,
}: {
  businessId: string;
  canEditOnWeb: boolean;
}) {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<OperationalPolicyPayload | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await customFetch<OperationalPolicyPayload>(
        `/api/businesses/${businessId}/operational-policy`,
      );
      setState(data);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  const p = state?.policy;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>Booking policy</Text>
      <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
        Deposits, buffers, no-shows — read-only here.
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
      ) : !p ? (
        <Text style={[styles.rowMeta, { color: colors.mutedForeground, marginTop: 8 }]}>
          Could not load policy.
        </Text>
      ) : (
        <>
          {state?.depositPolicySummary ? (
            <Text style={[styles.summary, { color: colors.foreground }]}>{state.depositPolicySummary}</Text>
          ) : null}
          <Text style={[styles.rowMeta, { color: colors.mutedForeground, marginTop: 8 }]}>
            Deposit required · {p.depositRequired ? `Yes (${p.depositPercent}%)` : "No"}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
            Buffer between appointments · {p.serviceBufferMinutes} min
          </Text>
          <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
            No-show strikes before deposit · {p.noShowStrikeThreshold}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
            Late grace · {p.lateGraceMinutes} min
          </Text>
          {state?.bookingTermsBlock ? (
            <Text style={[styles.terms, { color: colors.mutedForeground }]} numberOfLines={4}>
              {state.bookingTermsBlock}
            </Text>
          ) : null}
        </>
      )}
      {canEditOnWeb ? (
        <Pressable
          onPress={() => void Linking.openURL(dashboardSettingsUrl("policy", businessId))}
          style={[styles.btn, { borderColor: colors.primary }]}
          testID="policy-edit-on-web"
        >
          <Text style={[styles.btnText, { color: colors.primary }]}>Edit policy on web</Text>
          <Feather name="external-link" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 16, marginBottom: 4 },
  rowMeta: { ...type.caption, fontSize: 12 },
  summary: { ...type.body, fontSize: 14, marginTop: 6 },
  terms: { ...type.caption, fontSize: 12, marginTop: 8, fontStyle: "italic" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 14 },
});

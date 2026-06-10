import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { shouldShowActivationMilestoneOnHome } from "@workspace/policy";
import { useBusiness } from "@/contexts/BusinessContext";
import { useMembership } from "@/hooks/useMembership";
import { useColors } from "@/hooks/useColors";
import { Shimmer } from "@/components/brand/Shimmer";

/** Setup-only banner — hides after activation (no permanent "first booking" toast). */
export function ActivationMilestone() {
  const colors = useColors();
  const { currentBusiness, isDemoAccount } = useBusiness();
  const { role } = useMembership();
  const bid = currentBusiness?.id ?? "";

  const { data, isLoading } = useGetDashboardSummary(bid, {
    query: { enabled: !!bid } as never,
  });

  if (!currentBusiness || !["OWNER", "ADMIN"].includes(role ?? "")) return null;
  if (isDemoAccount) return null;

  if (isLoading) {
    return (
      <View style={styles.wrap} testID="activation-milestone-loading">
        <Shimmer width="100%" height={52} radius={12} />
      </View>
    );
  }

  const activation = data?.activation;
  if (!shouldShowActivationMilestoneOnHome(activation)) return null;

  const remaining =
    (activation?.activationStepsTotal ?? 0) - (activation?.activationStepsComplete ?? 0);

  return (
    <View
      style={[styles.card, styles.progress, { borderColor: "#d9770640" }]}
      testID="activation-milestone-in-progress"
    >
      <Feather name="zap" size={20} color="#d97706" />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.foreground }]}>Finish setup</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {remaining} step{remaining === 1 ? "" : "s"} left — then you are ready for live bookings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  progress: { backgroundColor: "rgba(217, 119, 6, 0.06)" },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "600" },
  sub: { fontSize: 13, lineHeight: 18 },
});

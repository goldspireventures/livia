import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  useGetLivSetupGuidedFlow,
} from "@workspace/api-client-react";
import {
  buildSetupGuidedFlow as buildSetupGuidedFlowPolicy,
  GO_LIVE_RIBBON_COPY,
  type OnboardingState,
  type SetupGuidedFlowPhase,
} from "@workspace/policy";
import { useColors } from "@/hooks/useColors";
import { fonts, type } from "@/constants/typography";
import { getPublicBookingUrl } from "@/lib/public-booking-url";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

type Props = {
  businessId: string;
  onboardingState?: OnboardingState | null;
  vertical?: string | null;
  slug?: string | null;
  sacredMetricMet?: boolean;
};

export function SetupGuidedFlowCard({
  businessId,
  onboardingState,
  vertical,
  slug,
  sacredMetricMet = false,
}: Props) {
  const colors = useColors();

  const { data: serverFlow } = useGetLivSetupGuidedFlow(businessId, {
    query: { enabled: !!businessId } as never,
  });

  const fallbackFlow = buildSetupGuidedFlowPolicy({
    onboardingState,
    vertical,
    slug,
    sacredMetricMet,
  });

  const flow = serverFlow
    ? {
        ...fallbackFlow,
        ...serverFlow,
        phases: (serverFlow.phases as SetupGuidedFlowPhase[]) ?? fallbackFlow.phases,
      }
    : fallbackFlow;
  const capabilityBlockers = (serverFlow?.capabilityBlockers ?? []) as Array<{
    capabilityId: string;
    capabilityName: string;
    blocker: string;
  }>;

  if (flow.complete) return null;

  const current = flow.phases.find((p) => p.current);
  const stepIndex = flow.phases.findIndex((p) => p.current) + 1;

  return (
    <View
      style={[styles.card, { borderColor: colors.primary + "44", backgroundColor: colors.primary + "10" }]}
      accessibilityLabel="Guided setup progress"
    >
      <View style={styles.head}>
        <Feather name="zap" size={14} color={colors.primary} />
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{GO_LIVE_RIBBON_COPY.eyebrow}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          Step {stepIndex}/{flow.phases.length}
          {serverFlow?.percentComplete != null ? ` · ${serverFlow.percentComplete}%` : ""}
        </Text>
      </View>
      {current ? (
        <>
          <Text style={[styles.title, { color: colors.foreground }]}>{current.label}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{current.headline}</Text>
        </>
      ) : null}
      {capabilityBlockers.length > 0 ? (
        <View style={styles.blockers}>
          <Text style={[styles.blockerLabel, { color: colors.foreground }]}>Capability blockers</Text>
          {capabilityBlockers.slice(0, 2).map((b) => (
            <Text key={`${b.capabilityId}-${b.blocker}`} style={[styles.blockerLine, { color: colors.mutedForeground }]}>
              {b.capabilityName}: {b.blocker}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.phases}>
        {flow.phases.map((phase) => (
          <View
            key={phase.id}
            style={[
              styles.phaseDot,
              {
                backgroundColor: phase.done
                  ? colors.primary
                  : phase.current
                    ? colors.primary + "66"
                    : colors.muted,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            if (flow.currentPhaseId === "publish" && slug) {
              void import("expo-linking").then((Linking) => Linking.openURL(getPublicBookingUrl(slug)));
              return;
            }
            if (flow.currentPhaseId === "first_booking" && slug) {
              void import("expo-linking").then((Linking) => Linking.openURL(getPublicBookingUrl(slug)));
              return;
            }
            if (flow.currentPhaseId === "billing") {
              void import("expo-linking").then((Linking) =>
                Linking.openURL(`${getDashboardBaseUrl()}/settings?tab=billing`),
              );
            }
          }}
          disabled={flow.currentPhaseId === "setup"}
          style={[
            styles.btn,
            {
              backgroundColor: colors.primary,
              opacity: flow.currentPhaseId === "setup" ? 0.45 : 1,
            },
          ]}
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
            {flow.currentPhaseId === "setup"
              ? "Continue below"
              : flow.currentPhaseId === "publish" || flow.currentPhaseId === "first_booking"
                ? "Open booking page"
                : "Open billing on web"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void import("expo-linking").then((Linking) =>
              Linking.openURL(`${getDashboardBaseUrl()}/settings?tab=liv`),
            );
          }}
        >
          <Text style={[styles.link, { color: colors.primary }]}>Ask Liv on web</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 16 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrow: { fontFamily: fonts.bodySemi, fontSize: 12, flex: 1 },
  meta: { ...type.caption, fontSize: 11 },
  title: { fontFamily: fonts.bodySemi, fontSize: 16 },
  body: { ...type.body, fontSize: 13, lineHeight: 18 },
  blockers: { gap: 2 },
  blockerLabel: { fontFamily: fonts.bodySemi, fontSize: 12 },
  blockerLine: { ...type.caption, fontSize: 11, lineHeight: 15 },
  phases: { flexDirection: "row", gap: 6, marginTop: 4 },
  phaseDot: { height: 6, flex: 1, borderRadius: 999 },
  actions: { gap: 10, marginTop: 4 },
  btn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  link: { fontFamily: fonts.bodySemi, fontSize: 13, textAlign: "center" },
});

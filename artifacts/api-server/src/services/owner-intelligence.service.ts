import {
  ownerHomeLivSuggestions,
  ownerOpsLivSuggestions,
  ownerBillingAddonLivPrompts,
  buildBillingAddonCatalogForOwner,
  topCommerceSignal,
  buildCommerceRemediationTasks,
  resolveCommerceCapabilityBlockers,
  capabilityBlockerHref,
  countLaunchEssentialBlockers,
  flattenLaunchEssentialCapabilityBlockers,
  type CapabilityHealthScore,
  type CommerceSignal,
  type CommerceRemediationTask,
  type CommerceCapabilityBlocker,
  type TwinRiskOrOpportunity,
  type BillingAddonOwnerRow,
} from "@workspace/policy";
import {
  buildTwinHealthFromContext,
  buildTwinRecommendationsFromContext,
  buildTwinSummaryFromContext,
  loadBusinessTwinContext,
  type BusinessTwinHealth,
} from "./business-twin.service";
import { listAtRiskGuestPreviews } from "./relationship.service";
import { listRecentVisitFeedback } from "./visit-feedback.service";
import { listActiveTwinObservations, type TwinObservation, twinRisksAndOpportunitiesFromObservations } from "./twin-observations.service";

export type OwnerIntelligenceBundle = {
  businessId: string;
  generatedAt: string;
  commerce: {
    signals: CommerceSignal[];
    topSignal: CommerceSignal | null;
    snapshot: Awaited<ReturnType<typeof loadBusinessTwinContext>>["commerce"];
  };
  capabilityHealth?: CapabilityHealthScore;
  capabilityBlockers: number;
  commerceCapabilityBlockers: CommerceCapabilityBlocker[];
  platformReadinessBlockers: CommerceCapabilityBlocker[];
  livSuggestions: ReturnType<typeof ownerHomeLivSuggestions>;
  livPrompts: string[];
  remediationTasks: CommerceRemediationTask[];
  twinTopRecommendation?: {
    title: string;
    reason: string;
    priority: string;
    href?: string;
  } | null;
  twinHeadline?: string | null;
  twinSubline?: string | null;
  ops: {
    pendingCount: number;
    handedOffCount: number;
    atRiskCount: number;
    lowFeedbackCount: number;
    fillsDueCount?: number;
    colourDayBlocks?: number;
    medspaConsentQueueCount?: number;
  };
  twinObservations: TwinObservation[];
  twinRisks: TwinRiskOrOpportunity[];
  twinOpportunities: TwinRiskOrOpportunity[];
  twinHealth?: BusinessTwinHealth | null;
  policyEvolutionProposals?: import("@workspace/policy").PolicyEvolutionProposal[];
  qualityRegistry?: import("@workspace/policy").QualityRegistryEntry[];
  learningHypotheses?: import("./liv-hypothesis.service").LivHypothesis[];
  billingAddons?: BillingAddonOwnerRow[];
};

/** Single Twin context load — commerce, capabilities, twin headline/recs. */
export async function getOwnerIntelligenceBundle(
  businessId: string,
): Promise<OwnerIntelligenceBundle | null> {
  const [ctx, atRisk, feedback, twinObservations, policyEvolutionProposals, qualityRegistry, learningHypotheses] =
    await Promise.all([
    loadBusinessTwinContext(businessId),
    listAtRiskGuestPreviews(businessId, { limit: 5 }),
    listRecentVisitFeedback(businessId, 14),
    listActiveTwinObservations(businessId, 6),
    import("./policy-evolution.service").then((m) => m.getPolicyEvolutionProposals(businessId)),
    import("./policy-evolution.service").then((m) => m.getQualityRegistryForBusiness(businessId)),
    import("./liv-hypothesis.service").then((m) => m.listPendingHypotheses(businessId, 4)),
  ]);

  const caps = ctx.capabilities;
  if (!caps) return null;

  const { getBusinessById } = await import("./businesses.service");
  const { resolveBillingState } = await import("./billing.service");
  const biz = await getBusinessById(businessId);
  const billingState = await resolveBillingState(businessId);

  const summary = ctx.summary;
  const commerceBundle = {
    signals: ctx.commerceSignals,
    snapshot: ctx.commerce,
  };

  const twinSummary = buildTwinSummaryFromContext(businessId, ctx);
  const twinRecs = buildTwinRecommendationsFromContext(businessId, ctx);

  const pendingCount = summary.pendingCount ?? 0;
  const confirmedCount = summary.confirmedCount ?? 0;
  const handedOffCount = summary.handedOffCount ?? 0;
  const lowFeedbackCount = feedback.filter((r) => r.score <= 3).length;
  const topSignal = topCommerceSignal(commerceBundle.signals);
  const capabilityBlockers = countLaunchEssentialBlockers(caps.platformCapabilities);

  const livSuggestions = ownerHomeLivSuggestions({
    pendingCount,
    handedOffCount,
    atRiskCount: atRisk.length,
    lowFeedbackCount,
    commerce: {
      capturedMinor30d: commerceBundle.snapshot.capturedMinor30d,
      captureRatePercent: commerceBundle.snapshot.captureRatePercent,
      paymentCount30d: commerceBundle.snapshot.paymentCount30d,
      refundMinor30d: commerceBundle.snapshot.refundMinor30d,
      demandBookings: pendingCount + confirmedCount,
      weekBookings: summary.weekBookings ?? 0,
      depositRequired: commerceBundle.snapshot.depositRequired,
    },
  });

  const livPrompts = [
    ...ownerOpsLivSuggestions({
      hasCommerceActSignal: commerceBundle.signals.some((s) => s.severity === "act"),
      capabilityBlockers,
      pendingCount,
    }),
    ...ownerBillingAddonLivPrompts(
      buildBillingAddonCatalogForOwner({
        vertical: biz?.vertical,
        activeEntitlements: [...billingState.entitlements],
      }),
    ),
  ].slice(0, 5);
  const remediationTasks = buildCommerceRemediationTasks(commerceBundle.signals);
  const commerceCapabilityBlockers = resolveCommerceCapabilityBlockers(
    caps.platformCapabilities,
  );
  const platformReadinessBlockers = flattenLaunchEssentialCapabilityBlockers(
    caps.platformCapabilities,
  ).map((blocker) => ({
    capabilityId: blocker.capabilityId,
    capabilityName: blocker.capabilityName,
    blocker: blocker.blocker,
    href: capabilityBlockerHref(blocker.capabilityId, blocker.blocker),
  }));

  const twinTop = twinRecs?.recommendations?.[0] ?? null;
  const { twinRisks, twinOpportunities } = twinRisksAndOpportunitiesFromObservations(twinObservations);
  const twinHealth = buildTwinHealthFromContext(businessId, ctx, {
    risks: twinRisks,
    opportunities: twinOpportunities,
  });

  let fillsDueCount = 0;
  let colourDayBlocks = 0;
  let medspaConsentQueueCount = 0;
  try {
    if (biz?.vertical === "beauty") {
      const { getBeautyFillCycleRadar } = await import("./beauty-ops.service");
      const radar = await getBeautyFillCycleRadar(businessId);
      fillsDueCount = radar.dueCount;
    }
    if (biz?.vertical === "hair") {
      const { getHairColourDayFlightPlan } = await import("./hair-ops.service");
      const plan = await getHairColourDayFlightPlan(businessId);
      colourDayBlocks = plan.blockCount;
    }
    if (biz?.vertical === "medspa") {
      const { listPendingConsents } = await import("./medspa.service");
      const pending = await listPendingConsents(businessId, 20);
      medspaConsentQueueCount = pending.length;
    }
  } catch {
    fillsDueCount = 0;
    colourDayBlocks = 0;
    medspaConsentQueueCount = 0;
  }

  return {
    businessId,
    generatedAt: new Date().toISOString(),
    commerce: {
      signals: commerceBundle.signals,
      topSignal,
      snapshot: commerceBundle.snapshot,
    },
    capabilityHealth: caps.capabilityHealth,
    capabilityBlockers,
    commerceCapabilityBlockers,
    platformReadinessBlockers,
    livSuggestions,
    livPrompts,
    remediationTasks,
    twinTopRecommendation: twinTop
      ? {
          title: twinTop.title,
          reason: twinTop.reason,
          priority: twinTop.priority,
          href: twinTop.href,
        }
      : null,
    twinHeadline: twinSummary?.headline ?? null,
    twinSubline: twinSummary?.subline ?? null,
    ops: {
      pendingCount,
      handedOffCount,
      atRiskCount: atRisk.length,
      lowFeedbackCount,
      fillsDueCount,
      colourDayBlocks,
      medspaConsentQueueCount,
    },
    twinObservations,
    twinRisks,
    twinOpportunities,
    twinHealth,
    policyEvolutionProposals,
    qualityRegistry,
    learningHypotheses,
    billingAddons: buildBillingAddonCatalogForOwner({
      vertical: biz?.vertical,
      activeEntitlements: [...billingState.entitlements],
    }),
  };
}

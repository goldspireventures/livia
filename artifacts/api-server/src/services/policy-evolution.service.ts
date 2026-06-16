import { db, bookingsTable, customersTable } from "@workspace/db";
import { and, eq, sql, gte, inArray } from "drizzle-orm";
import {
  resolvePolicyEvolutionProposals,
  applyPolicyEvolutionProposal,
  buildQualityRegistryEntries,
  type PolicyEvolutionProposal,
  type PolicyEvolutionProposalId,
} from "@workspace/policy";
import { getBusinessActivationSnapshot } from "./activation-metrics.service";
import { patchOperationalPolicy } from "./operational-policy.service";
import { getLivMandateForBusiness, patchLivMandateForBusiness } from "./liv-mandate.service";
import { policiesFromBusiness } from "./policies.service";
import { getBusinessById } from "./businesses.service";
import { getCommerceSnapshot } from "./commerce-intelligence.service";
import { listRecentVisitFeedback } from "./visit-feedback.service";

function monthsSince(iso: string): number {
  const ms = Date.now() - Date.parse(iso);
  return Math.max(0, Math.floor(ms / (30 * 24 * 60 * 60 * 1000)));
}

async function loadTrustMetrics(businessId: string) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [completedRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "COMPLETED"),
      ),
    );

  const [uniqueRow] = await db
    .select({ count: sql<number>`count(distinct ${bookingsTable.customerId})::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "COMPLETED"),
      ),
    );

  const [noShowRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "NO_SHOW"),
        gte(bookingsTable.startAt, ninetyDaysAgo),
      ),
    );

  const [recentTotalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, ninetyDaysAgo),
        inArray(bookingsTable.status, ["COMPLETED", "NO_SHOW", "CONFIRMED"]),
      ),
    );

  const [repeatRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customersTable)
    .where(
      and(
        eq(customersTable.businessId, businessId),
        eq(customersTable.trustedClient, true),
      ),
    );

  const completed = completedRow?.count ?? 0;
  const uniqueClients = uniqueRow?.count ?? 0;
  const noShows = noShowRow?.count ?? 0;
  const recentTotal = recentTotalRow?.count ?? 0;
  const repeatClients = repeatRow?.count ?? 0;

  return {
    completedBookings: completed,
    uniqueClients,
    noShowRatePercent: recentTotal > 0 ? Math.round((noShows / recentTotal) * 100) : null,
    repeatClientSharePercent:
      uniqueClients > 0 ? Math.round((repeatClients / uniqueClients) * 100) : null,
  };
}

export async function getPolicyEvolutionProposals(
  businessId: string,
): Promise<PolicyEvolutionProposal[]> {
  const biz = await getBusinessById(businessId);
  if (!biz) return [];

  const policies = policiesFromBusiness(biz);
  const mandatePayload = await getLivMandateForBusiness(businessId);
  const activation = await getBusinessActivationSnapshot(businessId);
  const commerce = await getCommerceSnapshot(businessId);
  const trustMetrics = await loadTrustMetrics(businessId);
  const feedback = await listRecentVisitFeedback(businessId, 90);
  const avgFeedback =
    feedback.length > 0
      ? feedback.reduce((s, r) => s + r.score, 0) / feedback.length
      : null;

  const monthsActive = monthsSince(biz.createdAt.toISOString());

  let proposals = resolvePolicyEvolutionProposals({
    operational: policies.operational,
    livMandate: mandatePayload?.mandate ?? null,
    emergentTrust: {
      monthsActive,
      completedBookings: trustMetrics.completedBookings,
      uniqueClients: trustMetrics.uniqueClients,
      depositCaptureRatePercent: commerce.captureRatePercent,
      repeatClientSharePercent: trustMetrics.repeatClientSharePercent,
      noShowRatePercent: trustMetrics.noShowRatePercent,
      trustProgramActive: Boolean(policies.operational.emergentTrustProgram?.enabled),
    },
    captureRatePercent: commerce.captureRatePercent,
    paymentCount30d: commerce.paymentCount30d,
    retailAttachRatePercent: null,
    livTrustScore: mandatePayload?.mandate.trustScore,
    completedBookings: trustMetrics.completedBookings,
  });

  return proposals.filter((p) => p.id !== "emergent_trust_tier");
}

export async function getQualityRegistryForBusiness(businessId: string) {
  const trustMetrics = await loadTrustMetrics(businessId);
  const feedback = await listRecentVisitFeedback(businessId, 90);
  const avgFeedback =
    feedback.length > 0
      ? feedback.reduce((s, r) => s + r.score, 0) / feedback.length
      : null;

  return buildQualityRegistryEntries({
    avgFeedback,
    noShowRatePercent: trustMetrics.noShowRatePercent,
    rebookRatePercent: trustMetrics.repeatClientSharePercent,
  });
}

export async function acceptPolicyEvolutionProposal(
  businessId: string,
  proposalId: PolicyEvolutionProposalId,
): Promise<{ ok: true; proposalId: PolicyEvolutionProposalId } | { ok: false; reason: string }> {
  const proposals = await getPolicyEvolutionProposals(businessId);
  const patch = applyPolicyEvolutionProposal(proposalId, proposals);
  if (!patch) return { ok: false, reason: "PROPOSAL_NOT_FOUND" };

  if (proposalId === "retail_attach_program") {
    return { ok: false, reason: "NAVIGATE_ONLY" };
  }

  if (patch.operationalPatch && Object.keys(patch.operationalPatch).length > 0) {
    await patchOperationalPolicy(businessId, patch.operationalPatch);
  }
  if (patch.mandatePatch && Object.keys(patch.mandatePatch).length > 0) {
    await patchLivMandateForBusiness(businessId, patch.mandatePatch);
  }

  const { invalidateOwnerIntelligenceCache } = await import("./owner-intelligence-cache");
  invalidateOwnerIntelligenceCache(businessId);

  return { ok: true, proposalId };
}

import {
  db,
  livActionProposalsTable,
  businessesTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import {
  parseLivMandate,
  mergeLivMandate,
  mandateDefaultsForVertical,
  resolveLivDecision,
  simulateMandateScenarios,
  livMandateSchema,
  dedupeLivProposalsForDisplay,
  type LivMandate,
  type LivMandateAction,
  type LivDecision,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { getBusinessById, updateBusiness } from "./businesses.service";

function readMandateFromPolicy(raw: unknown, vertical: string): LivMandate {
  const base = mandateDefaultsForVertical(
    vertical as Parameters<typeof mandateDefaultsForVertical>[0],
  );
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  const stored = obj.livMandate;
  if (!stored) return base;
  return mergeLivMandate(parseLivMandate(stored), base);
}

export async function getLivMandateForBusiness(businessId: string) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const mandate = readMandateFromPolicy(biz.operationalPolicy, biz.vertical);
  const defaults = mandateDefaultsForVertical(
    biz.vertical as import("@workspace/policy").BusinessVertical,
  );
  return {
    mandate,
    defaults,
    vertical: biz.vertical,
    simulation: simulateMandateScenarios(mandate),
  };
}

export async function patchLivMandateForBusiness(
  businessId: string,
  partial: Partial<LivMandate>,
) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const current = readMandateFromPolicy(biz.operationalPolicy, biz.vertical);
  const merged = mergeLivMandate(partial, current);
  const raw =
    biz.operationalPolicy && typeof biz.operationalPolicy === "object"
      ? { ...(biz.operationalPolicy as Record<string, unknown>) }
      : {};
  raw.livMandate = merged;
  await updateBusiness(businessId, {
    operationalPolicy: raw as Record<string, unknown>,
  });
  return getLivMandateForBusiness(businessId);
}

export function evaluateLivAction(args: {
  businessId: string;
  mandate: LivMandate;
  action: LivMandateAction;
  valueMinor?: number;
}): LivDecision {
  return resolveLivDecision({
    mandate: args.mandate,
    action: args.action,
    valueMinor: args.valueMinor,
  });
}

export async function createLivProposalIfNeeded(args: {
  businessId: string;
  action: LivMandateAction;
  valueMinor?: number;
  resourceKind?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = await getLivMandateForBusiness(args.businessId);
  if (!payload) return null;
  const decision = evaluateLivAction({
    businessId: args.businessId,
    mandate: payload.mandate,
    action: args.action,
    valueMinor: args.valueMinor,
  });
  if (decision.outcome === "auto") {
    return { decision, proposal: null, inserted: false };
  }
  if (decision.outcome === "refuse") {
    return { decision, proposal: null, inserted: false };
  }

  if (args.action === "collect_deposit") {
    const [existingDeposit] = await db
      .select()
      .from(livActionProposalsTable)
      .where(
        and(
          eq(livActionProposalsTable.businessId, args.businessId),
          eq(livActionProposalsTable.action, "collect_deposit"),
          eq(livActionProposalsTable.status, "pending"),
        ),
      )
      .limit(1);
    if (existingDeposit) {
      return { decision, proposal: existingDeposit, inserted: false };
    }
  }

  if (args.resourceKind === "commerce_signal") {
    const [existingCommerce] = await db
      .select()
      .from(livActionProposalsTable)
      .where(
        and(
          eq(livActionProposalsTable.businessId, args.businessId),
          eq(livActionProposalsTable.action, args.action),
          eq(livActionProposalsTable.status, "pending"),
          eq(livActionProposalsTable.resourceKind, "commerce_signal"),
        ),
      )
      .limit(1);
    if (existingCommerce) {
      return { decision, proposal: existingCommerce, inserted: false };
    }
  }

  if (args.resourceKind && args.resourceId) {
    const [existing] = await db
      .select()
      .from(livActionProposalsTable)
      .where(
        and(
          eq(livActionProposalsTable.businessId, args.businessId),
          eq(livActionProposalsTable.action, args.action),
          eq(livActionProposalsTable.status, "pending"),
          eq(livActionProposalsTable.resourceKind, args.resourceKind),
          eq(livActionProposalsTable.resourceId, args.resourceId),
        ),
      )
      .limit(1);
    if (existing) {
      return { decision, proposal: existing, inserted: false };
    }
  }

  const id = generateId();
  const [row] = await db
    .insert(livActionProposalsTable)
    .values({
      id,
      businessId: args.businessId,
      action: args.action,
      status: "pending",
      outcomePreview: decision.preview ?? decision.reason,
      reason: decision.reason,
      valueMinor: args.valueMinor ?? 0,
      resourceKind: args.resourceKind ?? null,
      resourceId: args.resourceId ?? null,
      metadata: args.metadata ?? null,
      proposedBy: "liv",
    })
    .returning();
  if (row && decision.outcome === "propose") {
    void import("./notification-orchestrator.service").then(({ notifyLivProposalPending }) =>
      notifyLivProposalPending({
        businessId: args.businessId,
        proposalId: row.id,
        action: args.action,
        preview: decision.preview ?? decision.reason,
        valueMinor: args.valueMinor,
      }).catch(() => undefined),
    );
  }
  return { decision, proposal: row, inserted: Boolean(row) };
}

export async function listPendingLivProposals(businessId: string, limit = 50) {
  const rows = await db
    .select()
    .from(livActionProposalsTable)
    .where(
      and(
        eq(livActionProposalsTable.businessId, businessId),
        eq(livActionProposalsTable.status, "pending"),
      ),
    )
    .orderBy(desc(livActionProposalsTable.createdAt))
    .limit(limit);
  return dedupeLivProposalsForDisplay(rows);
}

export async function resolveLivProposal(args: {
  proposalId: string;
  businessId: string;
  userId: string;
  status: "approved" | "dismissed";
}) {
  const [row] = await db
    .select()
    .from(livActionProposalsTable)
    .where(
      and(
        eq(livActionProposalsTable.id, args.proposalId),
        eq(livActionProposalsTable.businessId, args.businessId),
      ),
    )
    .limit(1);
  if (!row || row.status !== "pending") return null;
  const [updated] = await db
    .update(livActionProposalsTable)
    .set({
      status: args.status,
      resolvedBy: args.userId,
      resolvedAt: new Date(),
    })
    .where(eq(livActionProposalsTable.id, args.proposalId))
    .returning();

  if (updated && args.status === "approved" && updated.action === "collect_deposit") {
    await db
      .update(livActionProposalsTable)
      .set({
        status: "dismissed",
        resolvedBy: args.userId,
        resolvedAt: new Date(),
      })
      .where(
        and(
          eq(livActionProposalsTable.businessId, args.businessId),
          eq(livActionProposalsTable.action, "collect_deposit"),
          eq(livActionProposalsTable.status, "pending"),
        ),
      );
  }

  const commerceRelated =
    row.action === "collect_deposit" || row.resourceKind === "commerce_signal";

  if (args.status === "approved" && updated) {
    const { executeApprovedProposal } = await import("./conversation-case.service");
    const exec = await executeApprovedProposal({
      businessId: args.businessId,
      proposalId: args.proposalId,
      userId: args.userId,
    });
    if (commerceRelated) {
      const { syncCommerceIntelligenceLoop } = await import("./commerce-signals.service");
      void syncCommerceIntelligenceLoop(args.businessId);
    const { invalidateOwnerIntelligenceCache } = await import("./owner-intelligence-cache");
    invalidateOwnerIntelligenceCache(args.businessId);
    }
    return { ...updated, execution: exec };
  }

  if (updated && commerceRelated && args.status === "dismissed") {
    const { syncCommerceIntelligenceLoop } = await import("./commerce-signals.service");
    void syncCommerceIntelligenceLoop(args.businessId);
    const { invalidateOwnerIntelligenceCache } = await import("./owner-intelligence-cache");
    invalidateOwnerIntelligenceCache(args.businessId);
  }

  return updated;
}

/** Seed a demo proposal when showcase shops are empty. */
export async function ensureDemoLivProposal(businessId: string) {
  const existing = await listPendingLivProposals(businessId, 1);
  if (existing.length > 0) return existing[0];
  return (
    await createLivProposalIfNeeded({
      businessId,
      action: "reply_inbox",
      metadata: { demo: true },
    })
  )?.proposal;
}

export { livMandateSchema };

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
  const defaults = mandateDefaultsForVertical(biz.vertical);
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
    return { decision, proposal: null };
  }
  if (decision.outcome === "refuse") {
    return { decision, proposal: null };
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
  return { decision, proposal: row };
}

export async function listPendingLivProposals(businessId: string, limit = 50) {
  return db
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

  if (args.status === "approved" && updated) {
    const { executeApprovedProposal } = await import("./conversation-case.service");
    const exec = await executeApprovedProposal({
      businessId: args.businessId,
      proposalId: args.proposalId,
      userId: args.userId,
    });
    return { ...updated, execution: exec };
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

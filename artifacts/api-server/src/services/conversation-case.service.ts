import { db, conversationsTable, livActionProposalsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { getConversation } from "./conversations.service";
import { appendMessage } from "./conversations.service";
import { executeLivProposalAction } from "./proposal-executor.service";
import { createLivProposalIfNeeded } from "./liv-mandate.service";
import { publishDomainEvent } from "../lib/domain-events";

export type CaseOutcome =
  | "refund_and_cancel"
  | "cancel_no_refund"
  | "reschedule"
  | "close_no_action";

export async function resolveConversationCase(args: {
  businessId: string;
  conversationId: string;
  outcome: CaseOutcome;
  userId: string;
  bookingId?: string;
  refundMinor?: number;
  startAt?: string;
  endAt?: string;
  customerMessage?: string;
}): Promise<{ ok: boolean; effects: string[]; error?: string }> {
  const conv = await getConversation(args.conversationId);
  if (!conv || conv.businessId !== args.businessId) {
    return { ok: false, effects: [], error: "Conversation not found" };
  }

  const bookingId = args.bookingId ?? conv.linkedBookingId ?? undefined;
  const effects: string[] = [];

  if (
    (args.outcome === "refund_and_cancel" || args.outcome === "cancel_no_refund") &&
    !bookingId
  ) {
    return {
      ok: false,
      effects: [],
      error: "This thread has no linked booking — link the appointment before closing the refund case",
    };
  }

  const needsMessage =
    args.outcome === "refund_and_cancel" ||
    args.outcome === "cancel_no_refund" ||
    (args.outcome === "close_no_action" &&
      (conv.caseIntent === "refund_request" ||
        conv.summary?.toLowerCase().includes("refund")));
  if (needsMessage && !args.customerMessage?.trim()) {
    return {
      ok: false,
      effects: [],
      error: "A message to the customer is required before closing this case",
    };
  }

  if (args.customerMessage?.trim()) {
    await appendMessage({
      conversationId: args.conversationId,
      role: "ASSISTANT",
      content: args.customerMessage.trim(),
      authorUserId: args.userId,
    });
    effects.push("customer_notified");
  }

  let execResult: { ok: boolean; effects: string[]; error?: string } = { ok: true, effects: [] };

  switch (args.outcome) {
    case "refund_and_cancel": {
      const amount = args.refundMinor ?? 6000;
      execResult = await executeLivProposalAction({
        businessId: args.businessId,
        action: "process_refund",
        valueMinor: amount,
        conversationId: args.conversationId,
        metadata: {
          bookingId,
          refundMinor: amount,
          cancellationReason: "Late cancellation — refund approved",
        },
        userId: args.userId,
      });
      break;
    }
    case "cancel_no_refund":
      execResult = await executeLivProposalAction({
        businessId: args.businessId,
        action: "cancel_booking",
        conversationId: args.conversationId,
        metadata: {
          bookingId,
          cancellationReason: "Cancelled — no refund per policy",
        },
        userId: args.userId,
      });
      break;
    case "reschedule":
      if (!args.startAt || !args.endAt) {
        return { ok: false, effects, error: "startAt and endAt required for reschedule" };
      }
      execResult = await executeLivProposalAction({
        businessId: args.businessId,
        action: "reschedule",
        conversationId: args.conversationId,
        metadata: { bookingId, startAt: args.startAt, endAt: args.endAt },
        userId: args.userId,
      });
      break;
    case "close_no_action":
      break;
  }

  if (!execResult.ok) {
    return { ok: false, effects: [...effects, ...execResult.effects], error: execResult.error };
  }
  effects.push(...execResult.effects);

  await db
    .update(conversationsTable)
    .set({
      status: "CLOSED",
      aiHandled: false,
      resolution: {
        outcome: args.outcome,
        bookingId: bookingId ?? null,
        refundMinor: args.refundMinor ?? null,
        resolvedBy: args.userId,
        at: new Date().toISOString(),
        effects,
      },
      updatedAt: new Date(),
    })
    .where(eq(conversationsTable.id, args.conversationId));

  await publishDomainEvent(
    "conversation.updated",
    {
      businessId: args.businessId,
      conversationId: args.conversationId,
      status: "CLOSED",
      aiHandled: false,
    },
    `${args.businessId}:${args.conversationId}:resolved`,
  );

  return { ok: true, effects };
}

export async function proposeCaseAction(args: {
  businessId: string;
  conversationId: string;
  action: "process_refund" | "cancel_booking" | "reschedule";
  bookingId?: string;
  valueMinor?: number;
  metadata?: Record<string, unknown>;
}) {
  const conv = await getConversation(args.conversationId);
  if (!conv) return null;
  const bookingId = args.bookingId ?? conv.linkedBookingId ?? undefined;
  return createLivProposalIfNeeded({
    businessId: args.businessId,
    action: args.action,
    valueMinor: args.valueMinor,
    resourceKind: bookingId ? "booking" : "conversation",
    resourceId: bookingId ?? args.conversationId,
    metadata: {
      ...args.metadata,
      bookingId,
      conversationId: args.conversationId,
    },
  });
}

export async function executeApprovedProposal(args: {
  businessId: string;
  proposalId: string;
  userId: string;
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

  if (!row || row.status !== "approved") {
    return { ok: false, effects: [], error: "Proposal not approved" };
  }

  const meta = (row.metadata as Record<string, unknown> | null) ?? {};
  const conversationId =
    typeof meta.conversationId === "string" ? meta.conversationId : null;

  const result = await executeLivProposalAction({
    businessId: args.businessId,
    action: row.action,
    resourceKind: row.resourceKind,
    resourceId: row.resourceId,
    valueMinor: row.valueMinor,
    metadata: meta,
    proposalId: row.id,
    conversationId,
    userId: args.userId,
  });

  if (result.ok && conversationId) {
    await db
      .update(conversationsTable)
      .set({
        status: "CLOSED",
        resolution: {
          outcome: row.action,
          proposalId: row.id,
          resolvedBy: args.userId,
          at: new Date().toISOString(),
          effects: result.effects,
        },
        updatedAt: new Date(),
      })
      .where(eq(conversationsTable.id, conversationId));
  }

  return result;
}

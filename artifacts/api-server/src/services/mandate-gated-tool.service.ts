import type { LivMandateAction } from "@workspace/policy";
import { executeLivTool, type LivToolDeps, type LivToolResult } from "@workspace/liv-runtime";
import { appendAudit } from "../lib/audit";

const LIV_TOOL_CANCEL_BOOKING = "cancel_booking";
const LIV_TOOL_CONFIRM_BOOKING = "confirm_booking";
const LIV_TOOL_CREATE_BOOKING = "create_booking";
const LIV_TOOL_RESCHEDULE_BOOKING = "reschedule_booking";
const LIV_TOOL_SEND_MESSAGE = "send_message";
import { createLivProposalIfNeeded } from "./liv-mandate.service";

const TOOL_TO_MANDATE: Partial<Record<string, LivMandateAction>> = {
  [LIV_TOOL_CANCEL_BOOKING]: "cancel_booking",
  [LIV_TOOL_CREATE_BOOKING]: "book_slot",
  [LIV_TOOL_RESCHEDULE_BOOKING]: "reschedule",
  [LIV_TOOL_CONFIRM_BOOKING]: "book_slot",
  [LIV_TOOL_SEND_MESSAGE]: "reply_inbox",
};

function estimateValueMinor(toolName: string, toolInput: Record<string, unknown>): number {
  if (toolName === LIV_TOOL_CANCEL_BOOKING && typeof toolInput.refundMinor === "number") {
    return toolInput.refundMinor;
  }
  if (typeof toolInput.depositMinor === "number") return toolInput.depositMinor;
  if (typeof toolInput.priceMinor === "number") return toolInput.priceMinor;
  return 0;
}

/** Run Liv tools through mandate — auto, propose (queue), or refuse. */
export async function executeMandateGatedTool(args: {
  businessId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  deps: LivToolDeps;
  conversationId: string;
  channelType: "WEB" | "SMS" | "WHATSAPP" | "INSTAGRAM" | "MESSENGER" | "VOICE";
}): Promise<LivToolResult & { mandate?: string; proposalId?: string }> {
  const resourceKind: "booking" | "conversation" =
    typeof args.toolInput.bookingId === "string" ? "booking" : "conversation";

  const auditBase = {
    businessId: args.businessId,
    actorKind: "liv" as const,
    actorId: "liv",
    resourceKind,
    resourceId:
      (typeof args.toolInput.bookingId === "string" ? args.toolInput.bookingId : null) ??
      args.conversationId,
  };

  const mandateAction = TOOL_TO_MANDATE[args.toolName];
  if (!mandateAction) {
    const out = await executeLivTool(args);
    void appendAudit({
      ...auditBase,
      actionClass: "liv.tool.execute",
      payload: {
        toolName: args.toolName,
        channelType: args.channelType,
        mandate: "none",
        ok: !!(out.result as any)?.ok,
        result: out.result,
      },
    }).catch(() => {
      /* audit must not block execution */
    });
    return out;
  }

  const gate = await createLivProposalIfNeeded({
    businessId: args.businessId,
    action: mandateAction,
    valueMinor: estimateValueMinor(args.toolName, args.toolInput),
    resourceKind: args.toolInput.bookingId ? "booking" : "conversation",
    resourceId:
      (typeof args.toolInput.bookingId === "string" ? args.toolInput.bookingId : null) ??
      args.conversationId,
    metadata: {
      conversationId: args.conversationId,
      toolName: args.toolName,
      toolInput: args.toolInput,
      bookingId: args.toolInput.bookingId,
    },
  });

  if (!gate) {
    const out = await executeLivTool(args);
    void appendAudit({
      ...auditBase,
      actionClass: "liv.tool.execute",
      payload: {
        toolName: args.toolName,
        channelType: args.channelType,
        mandate: "none",
        ok: !!(out.result as any)?.ok,
        result: out.result,
      },
    }).catch(() => {
      /* audit must not block execution */
    });
    return out;
  }

  if (gate.decision.outcome === "refuse") {
    const out = {
      result: {
        ok: false,
        error: "MANDATE_REFUSED",
        message: gate.decision.reason,
      },
      mandate: "refused",
    } satisfies LivToolResult & { mandate: string };
    void appendAudit({
      ...auditBase,
      actionClass: "liv.tool.execute",
      payload: {
        toolName: args.toolName,
        channelType: args.channelType,
        mandate: "refused",
        proposalId: gate.proposal?.id ?? null,
        reason: gate.decision.reason,
      },
    }).catch(() => {
      /* audit must not block execution */
    });
    return out;
  }

  if (gate.decision.outcome === "propose") {
    const out = {
      result: {
        ok: false,
        error: "PENDING_APPROVAL",
        message: gate.decision.preview ?? gate.decision.reason,
        proposalId: gate.proposal?.id ?? null,
      },
      mandate: "propose",
      proposalId: gate.proposal?.id,
    } satisfies LivToolResult & { mandate: string; proposalId?: string };
    void appendAudit({
      ...auditBase,
      actionClass: "liv.tool.execute",
      payload: {
        toolName: args.toolName,
        channelType: args.channelType,
        mandate: "propose",
        proposalId: gate.proposal?.id ?? null,
        preview: gate.decision.preview ?? null,
        reason: gate.decision.reason,
      },
    }).catch(() => {
      /* audit must not block execution */
    });
    return out;
  }

  const executed = await executeLivTool(args);
  const out = { ...executed, mandate: "auto" } satisfies LivToolResult & { mandate: string };
  void appendAudit({
    ...auditBase,
    actionClass: "liv.tool.execute",
    payload: {
      toolName: args.toolName,
      channelType: args.channelType,
      mandate: "auto",
      proposalId: gate.proposal?.id ?? null,
      ok: !!(executed.result as any)?.ok,
      result: executed.result,
    },
  }).catch(() => {
    /* audit must not block execution */
  });
  return out;
}

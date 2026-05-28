import type { LivMandateAction } from "@workspace/policy";
import { executeLivTool } from "@workspace/liv-runtime";
import { updateBookingStatus, getBookingById } from "./bookings.service";
import { emitBookingStatusChange } from "../lib/booking-events";
import { processRefund } from "./refund.service";
import { appendMessage, getConversation } from "./conversations.service";
import { publishDomainEvent } from "../lib/domain-events";
import { buildLivToolDeps } from "../lib/liv-runtime-deps";
import { getBusinessById } from "./businesses.service";
import { db, bookingsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

export type ProposalExecutionResult = {
  ok: boolean;
  effects: string[];
  error?: string;
};

/** Execute an approved Liv proposal — side effects on bookings, refunds, etc. */
export async function executeLivProposalAction(args: {
  businessId: string;
  action: LivMandateAction | string;
  resourceKind?: string | null;
  resourceId?: string | null;
  valueMinor?: number;
  metadata?: Record<string, unknown> | null;
  proposalId?: string;
  conversationId?: string | null;
  userId?: string;
}): Promise<ProposalExecutionResult> {
  const effects: string[] = [];
  const meta = args.metadata ?? {};
  const bookingId =
    (typeof meta.bookingId === "string" ? meta.bookingId : null) ??
    (args.resourceKind === "booking" ? args.resourceId : null) ??
    null;

  try {
    switch (args.action) {
      case "cancel_booking": {
        if (!bookingId) return { ok: false, effects, error: "No booking linked" };
        const before = await getBookingById(args.businessId, bookingId);
        if (!before) return { ok: false, effects, error: "Booking not found" };
        const reason =
          typeof meta.cancellationReason === "string"
            ? meta.cancellationReason
            : "Cancelled via Liv approval";
        const updated = await updateBookingStatus(args.businessId, bookingId, {
          status: "CANCELLED",
          cancellationReason: reason,
        });
        if (!updated) return { ok: false, effects, error: "Could not cancel booking" };
        await emitBookingStatusChange(
          updated as Parameters<typeof emitBookingStatusChange>[0],
          "CANCELLED",
          reason,
        );
        effects.push(`booking:${bookingId}:cancelled`);
        break;
      }

      case "process_refund": {
        const amount = args.valueMinor ?? (typeof meta.refundMinor === "number" ? meta.refundMinor : 0);
        if (amount <= 0) return { ok: false, effects, error: "Refund amount required" };

        if (bookingId) {
          const before = await getBookingById(args.businessId, bookingId);
          if (before && before.status !== "CANCELLED") {
            const reason =
              typeof meta.cancellationReason === "string"
                ? meta.cancellationReason
                : "Late cancellation — refund approved";
            const updated = await updateBookingStatus(args.businessId, bookingId, {
              status: "CANCELLED",
              cancellationReason: reason,
            });
            if (updated) {
              await emitBookingStatusChange(
                updated as Parameters<typeof emitBookingStatusChange>[0],
                "CANCELLED",
                reason,
              );
              effects.push(`booking:${bookingId}:cancelled`);
            }
          }
        }

        const refund = await processRefund({
          businessId: args.businessId,
          bookingId,
          conversationId: args.conversationId ?? null,
          proposalId: args.proposalId ?? null,
          amountMinor: amount,
          reason: typeof meta.reason === "string" ? meta.reason : undefined,
        });
        effects.push(`refund:${refund.id}:${refund.status}`);

        await publishDomainEvent(
          "refund.approved",
          {
            businessId: args.businessId,
            refundId: refund.id,
          },
          `${args.businessId}:refund:${refund.id}`,
        );
        break;
      }

      case "reschedule": {
        if (!bookingId) return { ok: false, effects, error: "No booking linked" };
        const startAt = typeof meta.startAt === "string" ? meta.startAt : null;
        const endAt = typeof meta.endAt === "string" ? meta.endAt : null;
        if (!startAt || !endAt) return { ok: false, effects, error: "startAt and endAt required" };
        const [updated] = await db
          .update(bookingsTable)
          .set({
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            updatedAt: new Date(),
          })
          .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, args.businessId)))
          .returning();
        if (!updated) return { ok: false, effects, error: "Booking not found" };
        effects.push(`booking:${bookingId}:rescheduled`);
        break;
      }

      case "reply_inbox": {
        const toolName = typeof meta.toolName === "string" ? meta.toolName : null;
        const toolInput =
          meta.toolInput && typeof meta.toolInput === "object"
            ? (meta.toolInput as Record<string, unknown>)
            : null;
        const convId = args.conversationId ?? (typeof meta.conversationId === "string" ? meta.conversationId : null);
        if (toolName === "send_message" && toolInput && convId && args.userId) {
          const conv = await getConversation(convId);
          const biz = conv ? await getBusinessById(args.businessId) : null;
          if (conv && biz) {
            const channel = conv.channel as "WEB" | "SMS" | "WHATSAPP" | "INSTAGRAM" | "MESSENGER" | "VOICE";
            const deps = buildLivToolDeps({
              business: biz,
              conversationId: convId,
              channelType: channel,
              staffAuthorUserId: args.userId,
            });
            const out = await executeLivTool({
              toolName,
              toolInput,
              deps,
              conversationId: convId,
              channelType: channel,
            });
            if (out.result?.ok) {
              effects.push("inbox:message_sent");
            } else {
              return { ok: false, effects, error: "Could not send approved message" };
            }
          }
        } else {
          effects.push("inbox:reply_acknowledged");
        }
        break;
      }

      default:
        effects.push(`${args.action}:logged`);
        break;
    }

    if (args.conversationId && effects.length > 0) {
      const summary = effects.join(", ");
      await appendMessage({
        conversationId: args.conversationId,
        role: "SYSTEM",
        content: `Case resolved — ${summary.replace(/_/g, " ")}.`,
      });
    }

    return { ok: true, effects };
  } catch (err) {
    return {
      ok: false,
      effects,
      error: err instanceof Error ? err.message : "Execution failed",
    };
  }
}

/**
 * Engagement exit notifications — routes through platform resource transition hub.
 * Non-blocking: quote accept/deposit/withdraw responses are not delayed by alerts.
 */
import type { EngagementExitActor } from "@workspace/policy";
import { fanOutSideEffect } from "../lib/side-effect-emitter";

export function notifyQuoteAccepted(businessId: string, quoteId: string, publicToken: string) {
  fanOutSideEffect(
    "quote.accepted",
    async () => {
      const { emitResourceEngagementEvent } = await import("./resource-transition.service");
      await emitResourceEngagementEvent({
        event: "quote.accepted",
        context: { businessId, resourceId: quoteId, publicToken },
      });
    },
    { businessId, quoteId },
  );
}

export function notifyQuoteDepositPaid(args: {
  businessId: string;
  quoteId: string;
  publicToken: string;
  amountMinor: number;
  currency: string;
  dateSecured: boolean;
}) {
  fanOutSideEffect(
    "quote.deposit_paid",
    async () => {
      const { emitResourceEngagementEvent } = await import("./resource-transition.service");
      await emitResourceEngagementEvent({
        event: "quote.deposit_paid",
        context: {
          businessId: args.businessId,
          resourceId: args.quoteId,
          publicToken: args.publicToken,
          amountMinor: args.amountMinor,
          currency: args.currency,
          dateSecured: args.dateSecured,
        },
      });
    },
    { businessId: args.businessId, quoteId: args.quoteId },
  );
}

export function notifyClientWithdrew(args: {
  businessId: string;
  quoteId: string;
  publicToken: string;
  depositPaidMinor: number;
  depositAmountMinor: number;
  initiatedBy: EngagementExitActor;
}) {
  fanOutSideEffect(
    "quote.client_withdrew",
    async () => {
      const { emitResourceEngagementEvent } = await import("./resource-transition.service");
      await emitResourceEngagementEvent({
        event: "quote.client_withdrew",
        context: {
          businessId: args.businessId,
          resourceId: args.quoteId,
          publicToken: args.publicToken,
          depositPaidMinor: args.depositPaidMinor,
          depositAmountMinor: args.depositAmountMinor,
          initiatedBy: args.initiatedBy,
        },
      });
    },
    { businessId: args.businessId, quoteId: args.quoteId },
  );
}

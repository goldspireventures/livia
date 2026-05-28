import { inngest } from "../lib/inngest";
import { logger } from "../lib/logger";
import { createLivProposalIfNeeded } from "../services/liv-mandate.service";
import { tenantContextStore, type TenantContext } from "@workspace/tenant-context";

/**
 * Refund ladder — on refund.proposed, evaluate mandate and queue human approval
 * or auto-route per cap (always human approve for money in v1).
 */
export const refundLadderWorkflow = inngest.createFunction(
  { id: "refund-ladder", retries: 3 },
  { event: "refund.proposed" },
  async ({ event, step }) => {
    const data = event.data as {
      businessId: string;
      refundId: string;
      bookingId?: string;
      conversationId?: string;
      amountMinor?: number;
    };

    const tenantCtx: TenantContext = {
      businessId: data.businessId,
      membershipId: "workflow:refund-ladder",
      capabilityToken: "workflow:refund-ladder",
      region: "fra",
      locale: "en-IE",
    };

    return step.run("mandate-gate", async () =>
      tenantContextStore.run(tenantCtx, async () => {
        const result = await createLivProposalIfNeeded({
          businessId: data.businessId,
          action: "process_refund",
          valueMinor: data.amountMinor ?? 0,
          resourceKind: data.bookingId ? "booking" : "conversation",
          resourceId: data.bookingId ?? data.conversationId ?? data.refundId,
          metadata: {
            bookingId: data.bookingId,
            conversationId: data.conversationId,
            refundId: data.refundId,
          },
        });

        logger.info(
          {
            businessId: data.businessId,
            refundId: data.refundId,
            outcome: result?.decision.outcome,
            proposalId: result?.proposal?.id,
          },
          "refund-ladder: proposal queued",
        );

        return {
          decision: result?.decision.outcome ?? "propose",
          proposalId: result?.proposal?.id ?? null,
        };
      }),
    );
  },
);

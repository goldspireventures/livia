import { inngest } from "../lib/inngest";
import { approveTimeOffRequest } from "../services/time-off.service";
import { recordWorkflowPause } from "../lib/workflow-pause";
import { tenantContextStore, type TenantContext } from "@workspace/tenant-context";

/**
 * Time-off happy path: wait for human approval event, then apply decision.
 */
export const timeOffApproval = inngest.createFunction(
  {
    id: "time-off-approval",
    retries: 5,
    onFailure: async ({ event, error }) => {
      const data = event.data as { businessId?: string };
      if (data.businessId) {
        await recordWorkflowPause(data.businessId, "time-off-approval", error.message);
      }
    },
  },
  { event: "time-off.proposed" },
  async ({ event, step }) => {
    const data = event.data as {
      businessId: string;
      requestId: string;
      membershipId?: string;
    };

    const tenantCtx: TenantContext = {
      businessId: data.businessId,
      membershipId: data.membershipId ?? "workflow:time-off",
      capabilityToken: "workflow:time-off",
      region: "fra",
      locale: "en-IE",
    };

    const decision = await step.waitForEvent("wait-for-approval", {
      event: "time-off.approved",
      timeout: "7d",
      if: `async.data.requestId == '${data.requestId}'`,
    });

    if (!decision) {
      return { status: "timed_out" };
    }

    const approved = decision.data as { requestId: string; decidedByMembershipId?: string };

    await step.run("apply-approval", () =>
      tenantContextStore.run(tenantCtx, () =>
        approveTimeOffRequest(data.businessId, approved.requestId, {
          decidedByMembershipId: approved.decidedByMembershipId ?? data.membershipId ?? null,
        }),
      ),
    );

    return { status: "approved", requestId: data.requestId };
  },
);

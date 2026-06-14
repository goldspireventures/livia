/**
 * Executes platform notification plans — in-app, push, workflows.
 * Called synchronously (fallback) or from Inngest worker (async/retryable).
 */
import type { PlatformNotificationPlan } from "@workspace/policy";
import { isSubsystemEnabled, resolveSideEffectMode } from "@workspace/policy";
import { inngest, isInngestWorkflowsEnabled } from "../lib/inngest";
import { logger } from "../lib/logger";
import {
  isSubsystemCircuitOpen,
  recordSubsystemFailure,
  recordSubsystemSuccess,
} from "../lib/subsystem-circuit";
import { deliverInAppNotification } from "./in-app-notifications.service";
import { notifyBusinessMembersPushForRoles } from "./push.service";

async function deliverInApp(plan: PlatformNotificationPlan): Promise<number> {
  if (!isSubsystemEnabled("notifications", resolveSideEffectMode())) return 0;
  if (isSubsystemCircuitOpen("notifications")) {
    logger.warn(
      { kind: plan.kind, businessId: plan.businessId },
      "notifications circuit open — skipping in-app delivery",
    );
    return 0;
  }

  try {
    const written = await deliverInAppNotification({
      kind: plan.kind,
      businessId: plan.businessId,
      title: plan.title,
      body: plan.body,
      priority: plan.priority,
      resourceKind: plan.resourceKind,
      resourceId: plan.resourceId,
      dedupeKey: plan.dedupeKey,
      audience: plan.audience,
    });
    recordSubsystemSuccess("notifications");
    return written;
  } catch (err) {
    recordSubsystemFailure("notifications", err);
    logger.warn(
      { err, kind: plan.kind, resourceId: plan.resourceId, businessId: plan.businessId },
      "in-app notification delivery failed",
    );
    return 0;
  }
}

async function deliverPush(plan: PlatformNotificationPlan): Promise<void> {
  if (!plan.sendPush || plan.priority !== "act") return;
  if (!isSubsystemEnabled("push", resolveSideEffectMode())) return;
  if (isSubsystemCircuitOpen("push")) return;

  const resourceId = plan.resourceId;
  const data: Record<string, string> = {
    type: plan.kind,
    businessId: plan.businessId,
    resourceKind: plan.resourceKind,
    resourceId,
  };
  if (plan.resourceKind === "booking") data.bookingId = resourceId;
  if (plan.resourceKind === "conversation") data.conversationId = resourceId;
  if (plan.resourceKind === "quote") data.quoteId = resourceId;
  if (plan.resourceKind === "design_proof") data.proofId = resourceId;

  try {
    await notifyBusinessMembersPushForRoles({
      businessId: plan.businessId,
      roles: ["OWNER", "ADMIN"],
      title: plan.title,
      body: plan.body,
      data,
    });
    recordSubsystemSuccess("push");
  } catch (err) {
    recordSubsystemFailure("push", err);
    logger.warn({ err, kind: plan.kind, businessId: plan.businessId }, "push delivery failed");
  }
}

function deliverWorkflow(plan: PlatformNotificationPlan): void {
  if (!plan.workflowEvent || !isInngestWorkflowsEnabled()) return;
  if (!isSubsystemEnabled("workflows", resolveSideEffectMode())) return;
  if (isSubsystemCircuitOpen("workflows")) return;

  void inngest
    .send({
      name: plan.workflowEvent,
      data: {
        businessId: plan.businessId,
        proofId: plan.resourceKind === "design_proof" ? plan.resourceId : undefined,
        quoteId: plan.resourceKind === "quote" ? plan.resourceId : undefined,
        resourceKind: plan.resourceKind,
        resourceId: plan.resourceId,
      },
    })
    .then(() => recordSubsystemSuccess("workflows"))
    .catch((err) => {
      recordSubsystemFailure("workflows", err);
      logger.warn({ err, event: plan.workflowEvent }, "workflow emit failed");
    });
}

/** Never throws — safe in Inngest steps and request handlers. */
export async function executePlatformNotification(plan: PlatformNotificationPlan): Promise<number> {
  try {
    const written = await deliverInApp(plan);
    await deliverPush(plan);
    deliverWorkflow(plan);
    return written;
  } catch (err) {
    logger.warn({ err, kind: plan.kind }, "executePlatformNotification unexpected error");
    return 0;
  }
}

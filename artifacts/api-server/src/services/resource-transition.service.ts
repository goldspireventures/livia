/**
 * Platform notification emitter — enqueue via Inngest when available, else sync fallback.
 */
import type { PlatformNotificationPlan, TransitionActor } from "@workspace/policy";
import {
  isSubsystemEnabled,
  resolveResourceEngagementEvent,
  resolveResourceStatusTransition,
  resolveSideEffectMode,
  type PlatformResourceKind,
  type ResourceTransitionContext,
} from "@workspace/policy";
import { inngest, isInngestWorkflowsEnabled } from "../lib/inngest";
import { logger } from "../lib/logger";
import { isSubsystemCircuitOpen } from "../lib/subsystem-circuit";
import { executePlatformNotification } from "./platform-notification-executor.service";

export async function enqueuePlatformNotification(plan: PlatformNotificationPlan): Promise<void> {
  if (!isSubsystemEnabled("notifications", resolveSideEffectMode())) return;
  if (isSubsystemCircuitOpen("notifications") && isSubsystemCircuitOpen("push")) return;

  if (isInngestWorkflowsEnabled()) {
    try {
      await inngest.send({
        name: "livia/platform.notification.deliver",
        data: { plan },
      });
      return;
    } catch (err) {
      logger.warn({ err, kind: plan.kind }, "Inngest enqueue failed — sync fallback");
    }
  }

  await executePlatformNotification(plan);
}

/** Never throws — safe to call from critical paths (await optional). */
export async function emitPlatformNotification(plan: PlatformNotificationPlan): Promise<number> {
  try {
    await enqueuePlatformNotification(plan);
    return 1;
  } catch (err) {
    logger.warn({ err, kind: plan.kind }, "emitPlatformNotification failed");
    return 0;
  }
}

export async function emitResourceStatusTransition(args: {
  resourceKind: PlatformResourceKind;
  fromStatus: string;
  toStatus: string;
  actor: TransitionActor;
  context: ResourceTransitionContext;
}): Promise<number> {
  try {
    const plan = resolveResourceStatusTransition(args);
    if (!plan) return 0;
    await enqueuePlatformNotification(plan);
    return 1;
  } catch (err) {
    logger.warn(
      { err, resourceKind: args.resourceKind, resourceId: args.context.resourceId },
      "resource status transition resolve failed",
    );
    return 0;
  }
}

export async function emitResourceEngagementEvent(args: {
  event: "quote.accepted" | "quote.deposit_paid" | "quote.client_withdrew";
  context: ResourceTransitionContext;
}): Promise<number> {
  try {
    const plan = resolveResourceEngagementEvent(args);
    if (!plan) return 0;
    await enqueuePlatformNotification(plan);
    return 1;
  } catch (err) {
    logger.warn({ err, event: args.event, resourceId: args.context.resourceId }, "engagement event resolve failed");
    return 0;
  }
}

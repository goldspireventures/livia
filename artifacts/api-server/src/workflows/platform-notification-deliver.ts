import { inngest } from "../lib/inngest";
import type { PlatformNotificationPlan } from "@workspace/policy";
import { executePlatformNotification } from "../services/platform-notification-executor.service";

/** Async, retryable delivery for platform notifications — decoupled from request path. */
export const platformNotificationDeliver = inngest.createFunction(
  { id: "platform-notification-deliver", retries: 3 },
  { event: "livia/platform.notification.deliver" },
  async ({ event, step }) => {
    const plan = event.data.plan as PlatformNotificationPlan;
    const written = await step.run("deliver-in-app-and-push", async () =>
      executePlatformNotification(plan),
    );
    return { ok: true, written };
  },
);

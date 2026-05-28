import { onboardingStateSchema, type OnboardingState } from "@workspace/policy";
import { validateOnboardingGoLive } from "../lib/onboarding-go-live-gate";
import { logEvent } from "./events.service";

export { validateOnboardingGoLive } from "../lib/onboarding-go-live-gate";

export async function recordOnboardingStateChange(opts: {
  businessId: string;
  userId?: string;
  before: unknown;
  after: OnboardingState;
}): Promise<{ blocked: boolean; message?: string }> {
  const block = validateOnboardingGoLive(opts.after);
  if (block) {
    await logEvent({
      type: "ONBOARDING_GO_LIVE_BLOCKED",
      businessId: opts.businessId,
      userId: opts.userId,
      entityType: "business",
      entityId: opts.businessId,
      context: { checklist: opts.after.checklist },
      level: "WARN",
    });
    return {
      blocked: true,
      message:
        "Complete a test booking on your public page or via New booking before finishing setup.",
    };
  }

  const prev = onboardingStateSchema.safeParse(opts.before);
  const prevActs = new Set(prev.success ? prev.data.completedActs : []);
  for (const act of opts.after.completedActs) {
    if (prevActs.has(act)) continue;
    await logEvent({
      type: "ONBOARDING_ACT_COMPLETED",
      businessId: opts.businessId,
      userId: opts.userId,
      entityType: "onboarding_act",
      entityId: act,
      context: {
        act,
        percentComplete: opts.after.percentComplete,
        currentAct: opts.after.currentAct,
      },
    });
  }
  return { blocked: false };
}


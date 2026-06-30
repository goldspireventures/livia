import { db, businessesTable, EventType } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  computeTimeToFirstBookingMs,
  completeOnboardingAct,
  mergeOnboardingState,
  onboardingChecklistSchema,
  onboardingStateSchema,
  type ActivationSource,
  type OnboardingActId,
  type OnboardingChecklist,
  type OnboardingState,
} from "@workspace/policy";
import { validateOnboardingGoLive } from "../lib/onboarding-go-live-gate";
import { recordOnboardingStateChange } from "./onboarding-analytics.service";
import { updateBusiness } from "./businesses.service";
import { logger } from "../lib/logger";
import { logEvent } from "./events.service";

export type MarkFirstBookingOpts = {
  businessId: string;
  bookingId: string;
  source?: ActivationSource;
  userId?: string;
};

/** Map booking.source / channel to onboarding activation source. */
export function activationSourceFromBookingSource(source: string | null | undefined): ActivationSource {
  switch (source) {
    case "owner-manual":
      return "owner-manual";
    case "walk-in":
      return "walk-in";
    case "staff":
      return "staff";
    case "web":
    case "voice":
    case "sms":
    case "whatsapp":
    case "instagram":
    case "messenger":
    case "partner-api":
      return "public";
    default:
      return "unknown";
  }
}

/** First real booking — marks sacred V1 activation metric. */
export async function markOnboardingTestBooking(opts: MarkFirstBookingOpts): Promise<boolean> {
  const { businessId, bookingId, source = "unknown", userId } = opts;
  const now = new Date().toISOString();

  const [biz] = await db
    .select({
      onboardingState: businessesTable.onboardingState,
      createdAt: businessesTable.createdAt,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz?.onboardingState) return false;

  const parsed = onboardingStateSchema.safeParse(biz.onboardingState);
  if (!parsed.success) return false;
  if (parsed.data.checklist?.testBooking) return false;

  const checklist = onboardingChecklistSchema.parse({
    ...parsed.data.checklist,
    testBooking: true,
    firstBookingAt: now,
    firstBookingId: bookingId,
    activationSource: source,
  });
  const next = mergeOnboardingState(parsed.data, { checklist });

  await db
    .update(businessesTable)
    .set({ onboardingState: next as unknown as Record<string, unknown> })
    .where(eq(businessesTable.id, businessId));

  const timeToFirstBookingMs = computeTimeToFirstBookingMs(
    biz.createdAt.toISOString(),
    now,
  );

  await logEvent({
    type: EventType.BUSINESS_ACTIVATED,
    businessId,
    userId,
    entityType: "business",
    entityId: businessId,
    context: {
      bookingId,
      activationSource: source,
      firstBookingAt: now,
      timeToFirstBookingMs,
      sacredMetric: "first_successful_booking",
    },
  });

  logger.info(
    { businessId, bookingId, source, timeToFirstBookingMs, event: "business.activated" },
    "Business activated — first booking received",
  );

  return true;
}

/** Complete an onboarding act from Liv setup or automation (with optional checklist flags). */
export async function applyOnboardingActCompletion(opts: {
  businessId: string;
  userId?: string;
  act: OnboardingActId;
  checklist?: Partial<OnboardingChecklist>;
}): Promise<
  | { ok: true; state: OnboardingState }
  | { ok: false; error: "NOT_FOUND" | "GO_LIVE_BLOCKED"; message?: string }
> {
  const [biz] = await db
    .select({ onboardingState: businessesTable.onboardingState })
    .from(businessesTable)
    .where(eq(businessesTable.id, opts.businessId))
    .limit(1);
  if (!biz) return { ok: false, error: "NOT_FOUND" };

  const parsed = onboardingStateSchema.safeParse(biz.onboardingState);
  const base = parsed.success ? parsed.data : mergeOnboardingState(null, {});
  let next = completeOnboardingAct(base, opts.act);
  if (opts.checklist && Object.keys(opts.checklist).length > 0) {
    next = mergeOnboardingState(next, {
      checklist: onboardingChecklistSchema.parse({
        ...next.checklist,
        ...opts.checklist,
      }),
    });
  }

  const block = validateOnboardingGoLive(next);
  if (block) {
    return {
      ok: false,
      error: "GO_LIVE_BLOCKED",
      message:
        "Complete a test booking on your public page or via New booking before finishing setup.",
    };
  }

  const before = biz.onboardingState;
  await updateBusiness(opts.businessId, {
    onboardingState: next as unknown as Record<string, unknown>,
  });
  await recordOnboardingStateChange({
    businessId: opts.businessId,
    userId: opts.userId,
    before,
    after: next,
  });

  return { ok: true, state: next };
}

import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  mergeOnboardingState,
  onboardingChecklistSchema,
  onboardingStateSchema,
} from "@workspace/policy";
import { logger } from "../lib/logger";

/** First real or test booking — auto-check onboarding checklist. */
export async function markOnboardingTestBooking(businessId: string): Promise<void> {
  const [biz] = await db
    .select({ onboardingState: businessesTable.onboardingState })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz?.onboardingState) return;

  const parsed = onboardingStateSchema.safeParse(biz.onboardingState);
  if (!parsed.success) return;
  if (parsed.data.checklist?.testBooking) return;

  const checklist = onboardingChecklistSchema.parse({
    ...parsed.data.checklist,
    testBooking: true,
  });
  const next = mergeOnboardingState(parsed.data, { checklist });

  await db
    .update(businessesTable)
    .set({ onboardingState: next as unknown as Record<string, unknown> })
    .where(eq(businessesTable.id, businessId));

  logger.info({ businessId, event: "onboarding.test_booking" }, "Onboarding checklist: test booking");
}

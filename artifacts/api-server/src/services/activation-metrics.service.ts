import { db, businessesTable, bookingsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import {
  buildBusinessActivationSnapshot,
  formatActivationDuration,
  onboardingStateSchema,
  type BusinessActivationSnapshot,
} from "@workspace/policy";
import { markOnboardingTestBooking } from "./onboarding-progress.service";

export async function getBusinessActivationSnapshot(
  businessId: string,
): Promise<BusinessActivationSnapshot | null> {
  const [biz] = await db
    .select({
      createdAt: businessesTable.createdAt,
      vertical: businessesTable.vertical,
      onboardingState: businessesTable.onboardingState,
      stripeCustomerId: businessesTable.stripeCustomerId,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  if (!biz) return null;

  const parsed = onboardingStateSchema.safeParse(biz.onboardingState);
  let state = parsed.success ? parsed.data : null;

  let fallbackFirstBookingAt: string | null = null;
  let fallbackFirstBookingId: string | null = null;

  if (!state?.checklist?.firstBookingAt) {
    const [first] = await db
      .select({ id: bookingsTable.id, createdAt: bookingsTable.createdAt })
      .from(bookingsTable)
      .where(eq(bookingsTable.businessId, businessId))
      .orderBy(asc(bookingsTable.createdAt))
      .limit(1);
    if (first?.createdAt) {
      fallbackFirstBookingAt = first.createdAt.toISOString();
      fallbackFirstBookingId = first.id;
    }
  }

  if (!state?.checklist?.testBooking && fallbackFirstBookingId) {
    const marked = await markOnboardingTestBooking({
      businessId,
      bookingId: fallbackFirstBookingId,
      source: "unknown",
    });
    if (marked) {
      const [fresh] = await db
        .select({ onboardingState: businessesTable.onboardingState })
        .from(businessesTable)
        .where(eq(businessesTable.id, businessId))
        .limit(1);
      const reparsed = onboardingStateSchema.safeParse(fresh?.onboardingState);
      if (reparsed.success) state = reparsed.data;
    }
  }

  return buildBusinessActivationSnapshot({
    businessCreatedAt: biz.createdAt.toISOString(),
    onboardingState: state,
    vertical: biz.vertical,
    firstBookingAt: fallbackFirstBookingAt,
    firstBookingId: fallbackFirstBookingId,
    paymentsConnected: Boolean(biz.stripeCustomerId) || state?.checklist?.billingStarted === true,
  });
}

export type PlatformActivationRollup = {
  refreshedAt: string;
  totalBusinesses: number;
  activatedCount: number;
  activationRate: number;
  medianTimeToFirstBookingMs: number | null;
  medianTimeToFirstBookingLabel: string | null;
};

export async function getPlatformActivationRollup(): Promise<PlatformActivationRollup> {
  const rows = await db
    .select({
      id: businessesTable.id,
      createdAt: businessesTable.createdAt,
      onboardingState: businessesTable.onboardingState,
      vertical: businessesTable.vertical,
      stripeCustomerId: businessesTable.stripeCustomerId,
    })
    .from(businessesTable);

  const durations: number[] = [];
  let activatedCount = 0;

  for (const row of rows) {
    const parsed = onboardingStateSchema.safeParse(row.onboardingState);
    const state = parsed.success ? parsed.data : null;
    const snapshot = buildBusinessActivationSnapshot({
      businessCreatedAt: row.createdAt.toISOString(),
      onboardingState: state,
      vertical: row.vertical,
      paymentsConnected:
        Boolean(row.stripeCustomerId) || state?.checklist?.billingStarted === true,
    });
    if (snapshot.sacredMetricMet) {
      activatedCount += 1;
      if (snapshot.timeToFirstBookingMs != null) {
        durations.push(snapshot.timeToFirstBookingMs);
      }
    }
  }

  durations.sort((a, b) => a - b);
  const medianMs =
    durations.length === 0
      ? null
      : durations.length % 2 === 1
        ? durations[(durations.length - 1) / 2]!
        : Math.round((durations[durations.length / 2 - 1]! + durations[durations.length / 2]!) / 2);

  return {
    refreshedAt: new Date().toISOString(),
    totalBusinesses: rows.length,
    activatedCount,
    activationRate: rows.length === 0 ? 0 : Math.round((activatedCount / rows.length) * 100),
    medianTimeToFirstBookingMs: medianMs,
    medianTimeToFirstBookingLabel: medianMs != null ? formatActivationDuration(medianMs) : null,
  };
}

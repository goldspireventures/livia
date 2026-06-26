import {
  db,
  businessesTable,
  staffTable,
  usageEventsTable,
  servicesTable,
} from "@workspace/db";
import { and, eq, gte, sql } from "drizzle-orm";
import { recordMeter } from "../lib/metering-recorder";
import {
  lookupPlan,
  tenantHasEntitlement,
  CHECKOUT_PLAN_IDS,
  SELF_SERVE_PLAN_IDS,
  entitlementKeySchema,
  lookupAddon,
  hasEffectiveEntitlement,
  EVENT_OPERATOR_PACK_GRANTS,
  RETAIL_PACK_GRANTS,
  type EntitlementKey,
  type ProductPlan,
} from "@workspace/entitlements";
import type { MeterKey } from "@workspace/metering";
import {
  completeOnboardingAct,
  mergeOnboardingState,
  mergePercentWithBlocking,
  onboardingChecklistSchema,
  onboardingStateSchema,
  verticalSupportsRetail,
} from "@workspace/policy";
import { getBusinessById, updateBusiness } from "./businesses.service";

export type BillingState = {
  businessId: string;
  planId: string;
  planName: string;
  tier: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  billingPeriodStart: string | null;
  entitlements: EntitlementKey[];
  baseEurCentsPerMonth: number;
  seatEurCentsPerMonth: number | null;
  activeStaffSeats: number;
  designPartnerActive: boolean;
  usage: Partial<Record<MeterKey, number>>;
  voiceOutcomeShareEurCents: number;
  voiceOutcomeCapEurCents: number | null;
  voiceOutcomeShareRate: number;
};

function effectivePlanId(biz: {
  planId: string | null;
  tier: string;
}): string {
  return biz.planId ?? biz.tier ?? "solo";
}

function parseDenylist(raw: unknown): Set<string> {
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((k) => typeof k === "string"));
}

function parseGrants(raw: unknown): Set<string> {
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((k) => typeof k === "string"));
}

function effectiveEntitlements(
  plan: ProductPlan,
  denylist: Set<string>,
  grants: Set<string>,
  opts?: { designPartnerActive?: boolean; vertical?: string | null },
): EntitlementKey[] {
  const keys = new Set<EntitlementKey>([...plan.entitlements]);
  for (const g of grants) {
    if (entitlementKeySchema.safeParse(g).success) {
      keys.add(g as EntitlementKey);
    }
  }
  if (
    opts?.designPartnerActive &&
    (opts.vertical ?? "").toLowerCase() === "event-vendors"
  ) {
    for (const k of EVENT_OPERATOR_PACK_GRANTS) {
      keys.add(k);
    }
  }
  if (opts?.designPartnerActive && verticalSupportsRetail(opts.vertical)) {
    for (const k of RETAIL_PACK_GRANTS) {
      keys.add(k);
    }
  }
  return [...keys].filter((k) => !denylist.has(k));
}

export async function resolveBillingState(businessId: string): Promise<BillingState> {
  const biz = await getBusinessById(businessId);
  if (!biz) {
    throw new Error("BUSINESS_NOT_FOUND");
  }

  const planId = effectivePlanId(biz);
  const plan =
    lookupPlan(planId) ?? lookupPlan("solo") ?? ({
      id: "solo",
      name: "Solo",
      baseEurCentsPerMonth: 7900,
      seatEurCentsPerMonth: null,
      voiceOutcomeShare: 0.04,
      voiceOutcomeCapEurCents: 5000,
      entitlements: new Set<EntitlementKey>(),
    } as ProductPlan);

  const denylist = parseDenylist(biz.entitlementDenylist);
  const grants = parseGrants(biz.entitlementGrants);
  const designPartnerActive =
    !!biz.designPartnerEndsAt && new Date(biz.designPartnerEndsAt) > new Date();
  const entitlements = effectiveEntitlements(plan, denylist, grants, {
    designPartnerActive,
    vertical: biz.vertical,
  });

  const periodStart = biz.billingPeriodStart ?? startOfMonth(new Date());
  const usageRows = await db
    .select({
      meterKey: usageEventsTable.meterKey,
      total: sql<number>`coalesce(sum(${usageEventsTable.quantity}), 0)::int`,
    })
    .from(usageEventsTable)
    .where(
      and(
        eq(usageEventsTable.businessId, businessId),
        gte(usageEventsTable.occurredAt, periodStart),
      ),
    )
    .groupBy(usageEventsTable.meterKey);

  const usage: Partial<Record<MeterKey, number>> = {};
  for (const row of usageRows) {
    usage[row.meterKey as MeterKey] = row.total;
  }

  const [seatRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));

  const activeStaffSeats = seatRow?.count ?? 0;

  const voiceShare = await computeVoiceOutcomeShareCents(businessId, plan, periodStart);

  return {
    businessId,
    planId: plan.id,
    planName: plan.name,
    tier: biz.tier,
    stripeCustomerId: biz.stripeCustomerId,
    stripeSubscriptionId: biz.stripeSubscriptionId,
    stripeSubscriptionStatus: biz.stripeSubscriptionStatus,
    billingPeriodStart: periodStart.toISOString(),
    entitlements,
    baseEurCentsPerMonth: plan.baseEurCentsPerMonth,
    seatEurCentsPerMonth: plan.seatEurCentsPerMonth,
    activeStaffSeats,
    designPartnerActive,
    usage,
    voiceOutcomeShareEurCents: voiceShare,
    voiceOutcomeCapEurCents: plan.voiceOutcomeCapEurCents,
    voiceOutcomeShareRate: plan.voiceOutcomeShare,
  };
}

export async function tenantHasEntitlementForBusiness(
  businessId: string,
  key: EntitlementKey,
): Promise<boolean> {
  const state = await resolveBillingState(businessId);
  return hasEffectiveEntitlement(state.entitlements, key);
}

export async function grantEntitlementAddon(
  businessId: string,
  key: EntitlementKey,
): Promise<void> {
  const biz = await getBusinessById(businessId);
  if (!biz) throw new Error("BUSINESS_NOT_FOUND");
  const grants = parseGrants(biz.entitlementGrants);
  if (grants.has(key)) return;
  grants.add(key);
  await db
    .update(businessesTable)
    .set({ entitlementGrants: [...grants], updatedAt: new Date() })
    .where(eq(businessesTable.id, businessId));
}

/** Grant all entitlements for a purchasable add-on bundle. */
export async function grantAddonBundle(businessId: string, addonId: string): Promise<void> {
  const addon = lookupAddon(addonId);
  if (!addon) throw new Error("UNKNOWN_ADDON");
  const biz = await getBusinessById(businessId);
  if (!biz) throw new Error("BUSINESS_NOT_FOUND");
  const grants = parseGrants(biz.entitlementGrants);
  let changed = false;
  for (const key of addon.grants) {
    if (!grants.has(key)) {
      grants.add(key);
      changed = true;
    }
  }
  if (!changed) return;
  await db
    .update(businessesTable)
    .set({ entitlementGrants: [...grants], updatedAt: new Date() })
    .where(eq(businessesTable.id, businessId));
}

async function computeVoiceOutcomeShareCents(
  businessId: string,
  plan: ProductPlan,
  periodStart: Date,
): Promise<number> {
  if (plan.voiceOutcomeShare <= 0) return 0;

  const rows = await db
    .select({
      quantity: usageEventsTable.quantity,
      metadata: usageEventsTable.metadata,
    })
    .from(usageEventsTable)
    .where(
      and(
        eq(usageEventsTable.businessId, businessId),
        eq(usageEventsTable.meterKey, "voice_booking_outcome"),
        gte(usageEventsTable.occurredAt, periodStart),
      ),
    );

  let shareCents = 0;
  for (const row of rows) {
    const meta = row.metadata as Record<string, unknown>;
    const bookingValue =
      typeof meta.bookingValueEurCents === "number"
        ? meta.bookingValueEurCents
        : typeof meta.booking_value_eur_cents === "number"
          ? meta.booking_value_eur_cents
          : 0;
    shareCents += Math.round(bookingValue * plan.voiceOutcomeShare);
  }

  if (plan.voiceOutcomeCapEurCents != null) {
    shareCents = Math.min(shareCents, plan.voiceOutcomeCapEurCents);
  }
  return shareCents;
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function syncBusinessPlanFromStripe(input: {
  businessId: string;
  planId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  billingPeriodStart: Date;
}): Promise<void> {
  if (
    !CHECKOUT_PLAN_IDS.includes(input.planId as (typeof CHECKOUT_PLAN_IDS)[number]) &&
    !SELF_SERVE_PLAN_IDS.includes(input.planId as (typeof SELF_SERVE_PLAN_IDS)[number])
  ) {
    return;
  }
  const tier =
    input.planId === "studio"
      ? "studio"
      : input.planId === "chain"
        ? "chain"
        : input.planId === "chair-host"
          ? "chair-host"
          : "solo";
  await db
    .update(businessesTable)
    .set({
      planId: input.planId,
      tier,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeSubscriptionStatus: input.status,
      billingPeriodStart: input.billingPeriodStart,
      entitlementDenylist: [],
      updatedAt: new Date(),
    })
    .where(eq(businessesTable.id, input.businessId));
}

export async function setBusinessPlanForDev(
  businessId: string,
  planId: string,
  denylist: string[] = [],
): Promise<void> {
  const plan = lookupPlan(planId);
  if (!plan) throw new Error("UNKNOWN_PLAN");
  await db
    .update(businessesTable)
    .set({
      planId,
      tier:
        planId === "studio"
          ? "studio"
          : planId === "chain"
            ? "chain"
            : planId === "chair-host"
              ? "chair-host"
              : "solo",
      entitlementDenylist: denylist,
      updatedAt: new Date(),
    })
    .where(eq(businessesTable.id, businessId));
}

/** Partner / complimentary promo — no Stripe subscription; full plan entitlements for window. */
export async function grantComplimentaryPlan(args: {
  businessId: string;
  planId: string;
  endsAt: Date;
  promoCode: string;
}): Promise<void> {
  if (
    !CHECKOUT_PLAN_IDS.includes(args.planId as (typeof CHECKOUT_PLAN_IDS)[number]) &&
    !SELF_SERVE_PLAN_IDS.includes(args.planId as (typeof SELF_SERVE_PLAN_IDS)[number])
  ) {
    throw new Error("UNKNOWN_PLAN");
  }
  const tier =
    args.planId === "studio"
      ? "studio"
      : args.planId === "chain"
        ? "chain"
        : args.planId === "chair-host"
          ? "chair-host"
          : "solo";
  await db
    .update(businessesTable)
    .set({
      planId: args.planId,
      tier,
      stripeSubscriptionStatus: "complimentary",
      designPartnerEndsAt: args.endsAt,
      entitlementDenylist: [],
      billingPeriodStart: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(businessesTable.id, args.businessId));

  const biz = await getBusinessById(args.businessId);
  const parsed = onboardingStateSchema.safeParse(biz?.onboardingState);
  const base = parsed.success ? parsed.data : mergeOnboardingState(null, {});
  const next = completeOnboardingAct(
    mergeOnboardingState(base, {
      checklist: onboardingChecklistSchema.parse({
        ...base.checklist,
        billingStarted: true,
        promoCodeRedeemed: args.promoCode,
      }),
    }),
    "a9_billing",
  );
  await updateBusiness(args.businessId, {
    onboardingState: mergePercentWithBlocking(next) as unknown as Record<string, unknown>,
  });
}

export async function markBillingOnboardingComplete(businessId: string): Promise<void> {
  const biz = await getBusinessById(businessId);
  if (!biz) return;
  const parsed = onboardingStateSchema.safeParse(biz.onboardingState);
  const base = parsed.success ? parsed.data : mergeOnboardingState(null, {});
  if (base.completedActs.includes("a9_billing")) return;
  const next = completeOnboardingAct(
    mergeOnboardingState(base, {
      checklist: onboardingChecklistSchema.parse({
        ...base.checklist,
        billingStarted: true,
      }),
    }),
    "a9_billing",
  );
  await updateBusiness(businessId, {
    onboardingState: mergePercentWithBlocking(next) as unknown as Record<string, unknown>,
  });
}

/** Estimate booking value in EUR cents for outcome metering. */
export async function estimateBookingValueEurCents(
  businessId: string,
  serviceId: string,
): Promise<number> {
  const [svc] = await db
    .select({ priceMinor: servicesTable.priceMinor })
    .from(servicesTable)
    .where(and(eq(servicesTable.id, serviceId), eq(servicesTable.businessId, businessId)));
  return svc?.priceMinor ?? 4000;
}

export async function recordBookingOutcomeMeters(
  businessId: string,
  bookingId: string,
  serviceId: string,
  source: string,
  status: string,
): Promise<void> {
  if (status === "COMPLETED") {
    await recordMeter(businessId, "booking_completed", 1, { bookingId });
  }

  // voice_booking_outcome is recorded when Liv creates the booking on the voice channel
  // (see liv-booking.service) to avoid double-counting on COMPLETED.
}

export async function snapshotActiveStaffSeats(businessId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));
  const count = row?.count ?? 0;
  await recordMeter(businessId, "active_staff_seat", count, { snapshot: true });
  return count;
}

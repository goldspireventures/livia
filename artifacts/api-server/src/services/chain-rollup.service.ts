import {
  db,
  businessesTable,
  bookingsTable,
  conversationsTable,
  timeOffRequestsTable,
  staffTable,
  businessMembershipsTable,
  servicesTable,
} from "@workspace/db";
import { synthesizeOrgAdminPortfolioLine } from "./liv-morning-narrative";
import {
  buildChainAlerts,
  type ChainAlert,
  type ChainPulseStatus,
  type ChainShopRollup,
} from "./chain-alerts";
import {
  buildChainCommerceAlerts,
  chainShopCommerceSignals,
  chainShopTopSignal,
  summarizeChainCommerce,
  type ChainCommerceAlert,
  type ChainShopCommerceSlice,
} from "@workspace/policy";
import { formatCommerceMinor, getCommerceSnapshot } from "./commerce-intelligence.service";

export type { ChainAlert, ChainPulseStatus, ChainShopRollup };
export { buildChainAlerts };
import { and, eq, gte, lte, sql, inArray, or } from "drizzle-orm";

export type ChainRollup = {
  shopCount: number;
  bookingsThisWeek: number;
  completedThisWeek: number;
  shopsNeedingAttention: number;
  orgAdminBriefingLine: string;
  alerts: ChainAlert[];
  commerceAlerts?: ChainCommerceAlert[];
  commerceSummary?: {
    totalCapturedMinor30d: number;
    shopsWithActSignal: number;
    shopsWithWatchSignal: number;
  };
  commerceByShop?: ChainShopCommerceSlice[];
  shops: ChainShopRollup[];
};

function derivePulse(input: {
  handedOff: number;
  openThreads: number;
  pendingBookings: number;
  pendingTimeOff: number;
}): { status: ChainPulseStatus; reason: string | null } {
  if (input.handedOff > 0 || input.pendingTimeOff > 2) {
    return {
      status: "act",
      reason:
        input.handedOff > 0
          ? `${input.handedOff} conversation(s) need owner attention`
          : `${input.pendingTimeOff} time-off request(s) awaiting approval`,
    };
  }
  if (input.openThreads > 3 || input.pendingBookings > 5) {
    return {
      status: "watch",
      reason:
        input.openThreads > 3
          ? `${input.openThreads} open inbox thread(s)`
          : `${input.pendingBookings} booking(s) awaiting confirmation`,
    };
  }
  return { status: "ok", reason: null };
}

export function chainRollupToCsv(rollup: ChainRollup): string {
  const commerceById = new Map(
    (rollup.commerceByShop ?? []).map((c) => [c.businessId, c]),
  );
  const header =
    "name,slug,city,bookings_this_week,completed_today,pending_bookings,open_inbox,handed_off,pending_time_off,pulse,captured_30d,capture_rate,commerce_signal";
  const lines = rollup.shops.map((s) => {
    const commerce = commerceById.get(s.businessId);
    return [
      JSON.stringify(s.name),
      s.slug,
      s.city ?? "",
      s.bookingsThisWeek,
      s.completedThisWeek,
      s.pendingBookings,
      s.openConversations,
      s.handedOffConversations,
      s.pendingTimeOff,
      s.pulseStatus,
      commerce?.capturedLabel ?? "",
      commerce?.captureRatePercent ?? "",
      commerce?.topSignal?.id ?? "",
    ].join(",");
  });
  return [header, ...lines].join("\n");
}

export async function getChainRollupForOwner(ownerId: string): Promise<ChainRollup> {
  const shops = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      slug: businessesTable.slug,
      planId: businessesTable.planId,
      tier: businessesTable.tier,
      city: businessesTable.city,
    })
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, ownerId));

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const shopRollups: ChainShopRollup[] = [];
  let bookingsThisWeek = 0;
  let completedThisWeek = 0;
  let shopsNeedingAttention = 0;
  const attentionNames: string[] = [];

  for (const shop of shops) {
    const [weekRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, shop.id),
          gte(bookingsTable.startAt, now),
          lte(bookingsTable.startAt, weekEnd),
          inArray(bookingsTable.status, ["PENDING", "CONFIRMED", "COMPLETED"]),
        ),
      );

    const [completedRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, shop.id),
          eq(bookingsTable.status, "COMPLETED"),
          gte(bookingsTable.updatedAt, todayStart),
          lte(bookingsTable.updatedAt, todayEnd),
        ),
      );

    const [todayRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, shop.id),
          gte(bookingsTable.startAt, todayStart),
          lte(bookingsTable.startAt, todayEnd),
          inArray(bookingsTable.status, ["PENDING", "CONFIRMED", "COMPLETED"]),
        ),
      );

    const [pendingRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(and(eq(bookingsTable.businessId, shop.id), eq(bookingsTable.status, "PENDING")));

    const [openConv] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversationsTable)
      .where(and(eq(conversationsTable.businessId, shop.id), eq(conversationsTable.status, "OPEN")));

    const [handedOff] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversationsTable)
      .where(
        and(eq(conversationsTable.businessId, shop.id), eq(conversationsTable.status, "HANDED_OFF")),
      );

    const [pendingTimeOff] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(timeOffRequestsTable)
      .where(
        and(
          eq(timeOffRequestsTable.businessId, shop.id),
          eq(timeOffRequestsTable.status, "PENDING_APPROVAL"),
        ),
      );

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60_000);
    const [revenueRow] = await db
      .select({
        total: sql<number>`coalesce(sum(${servicesTable.priceMinor}), 0)::int`,
      })
      .from(bookingsTable)
      .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
      .where(
        and(
          eq(bookingsTable.businessId, shop.id),
          eq(bookingsTable.status, "COMPLETED"),
          gte(bookingsTable.startAt, thirtyDaysAgo),
        ),
      );

    const [statusCounts] = await db
      .select({
        completed: sql<number>`count(*) filter (where ${bookingsTable.status} = 'COMPLETED')::int`,
        noShow: sql<number>`count(*) filter (where ${bookingsTable.status} = 'NO_SHOW')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(bookingsTable)
      .where(
        and(eq(bookingsTable.businessId, shop.id), gte(bookingsTable.startAt, thirtyDaysAgo)),
      );

    const w = weekRow?.count ?? 0;
    const c = completedRow?.count ?? 0;
    const today = todayRow?.count ?? 0;
    const pending = pendingRow?.count ?? 0;
    const open = openConv?.count ?? 0;
    const handed = handedOff?.count ?? 0;
    const timeOff = pendingTimeOff?.count ?? 0;

    const noShow30 = statusCounts?.noShow ?? 0;
    const total30 = statusCounts?.total ?? 0;
    const noShowRate =
      total30 > 0 ? Math.round((noShow30 / total30) * 100) : null;
    const fillRate =
      w > 0 ? Math.min(100, Math.round((c / Math.max(w, 1)) * 100)) : null;
    const revenue30dMinor = revenueRow?.total ?? 0;

    bookingsThisWeek += w;
    completedThisWeek += c;

    const pulse = derivePulse({
      handedOff: handed,
      openThreads: open,
      pendingBookings: pending,
      pendingTimeOff: timeOff,
    });

    if (pulse.status !== "ok") {
      shopsNeedingAttention += 1;
      attentionNames.push(shop.name);
    }

    shopRollups.push({
      businessId: shop.id,
      name: shop.name,
      slug: shop.slug,
      planId: shop.planId,
      tier: shop.tier,
      city: shop.city,
      bookingsThisWeek: w,
      completedThisWeek: c,
      todayBookings: today,
      pendingBookings: pending,
      openConversations: open,
      handedOffConversations: handed,
      pendingTimeOff: timeOff,
      pulseStatus: pulse.status,
      pulseReason: pulse.reason,
      revenue30dMinor,
      fillRatePercent: fillRate,
      noShowRate30dPercent: noShowRate,
    });
  }

  shopRollups.sort((a, b) => {
    const rank = (s: ChainPulseStatus) => (s === "act" ? 0 : s === "watch" ? 1 : 2);
    return rank(a.pulseStatus) - rank(b.pulseStatus);
  });

  const commerceByShop: ChainShopCommerceSlice[] = await Promise.all(
    shopRollups.map(async (shop) => {
      const snapshot = await getCommerceSnapshot(shop.businessId);
      const capturedLabel = formatCommerceMinor(snapshot.capturedMinor30d, snapshot.currency);
      const signals = chainShopCommerceSignals({
        capturedMinor30d: snapshot.capturedMinor30d,
        captureRatePercent: snapshot.captureRatePercent,
        paymentCount30d: snapshot.paymentCount30d,
        refundMinor30d: snapshot.refundMinor30d,
        demandBookings: shop.pendingBookings + shop.todayBookings,
        weekBookings: shop.bookingsThisWeek,
        capturedLabel,
      });
      return {
        businessId: shop.businessId,
        shopName: shop.name,
        capturedMinor30d: snapshot.capturedMinor30d,
        capturedLabel,
        captureRatePercent: snapshot.captureRatePercent,
        paymentCount30d: snapshot.paymentCount30d,
        demandBookings: shop.pendingBookings + shop.todayBookings,
        topSignal: chainShopTopSignal(signals),
      };
    }),
  );
  const commerceAlerts = buildChainCommerceAlerts(commerceByShop);
  const commerceSummary = summarizeChainCommerce(commerceByShop);

  let orgAdminBriefingLine: string;
  if (shops.length === 0) {
    orgAdminBriefingLine = "No shops on your account yet.";
  } else {
    const fallback =
      shopsNeedingAttention === 0
        ? `All ${shops.length} locations look calm — ${bookingsThisWeek} bookings across the next 7 days.`
        : shopsNeedingAttention === 1
          ? `${attentionNames[0]} needs a look; the others are steady.`
          : `${shopsNeedingAttention} of ${shops.length} locations need attention today.`;

    const livLine = await synthesizeOrgAdminPortfolioLine({
      shopCount: shops.length,
      shopsNeedingAttention,
      attentionNames,
      bookingsThisWeek,
      shops: shopRollups.map((s) => ({
        name: s.name,
        pulseStatus: s.pulseStatus,
        todayBookings: s.todayBookings,
        pendingBookings: s.pendingBookings,
      })),
    });
    orgAdminBriefingLine = livLine ?? fallback;
  }

  if (commerceSummary.shopsWithActSignal > 0) {
    orgAdminBriefingLine = `${commerceSummary.shopsWithActSignal} location${commerceSummary.shopsWithActSignal === 1 ? "" : "s"} need commerce attention · ${orgAdminBriefingLine}`;
  }

  return {
    shopCount: shops.length,
    bookingsThisWeek,
    completedThisWeek,
    shopsNeedingAttention,
    orgAdminBriefingLine,
    alerts: buildChainAlerts(shopRollups),
    commerceAlerts,
    commerceSummary,
    commerceByShop,
    shops: shopRollups,
  };
}

/** Org-shape signals for policy/runtime (org-admin home routing). */
export async function getOrgShapeSignalsForOwner(ownerId: string) {
  const shops = await db
    .select({ id: businessesTable.id, tier: businessesTable.tier, structureKind: businessesTable.structureKind })
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, ownerId));

  const shopIds = shops.map((s) => s.id);
  let activeStaffCount = 0;
  let hasAdminManager = false;

  if (shopIds.length > 0) {
    const [staffCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(staffTable)
      .where(and(inArray(staffTable.businessId, shopIds), eq(staffTable.isActive, true)));
    activeStaffCount = staffCount?.count ?? 0;

    const admins = await db
      .select({ id: businessMembershipsTable.id })
      .from(businessMembershipsTable)
      .where(
        and(
          inArray(businessMembershipsTable.businessId, shopIds),
          or(
            eq(businessMembershipsTable.role, "ADMIN"),
            eq(businessMembershipsTable.roleV2, "ADM"),
          ),
        ),
      );
    hasAdminManager = admins.length > 0;
  }

  const brandEntityCount = shops.filter((s) => s.structureKind === "brand_entity").length;
  const primary = shops[0];
  const { countActiveHostRentersForOwner } = await import("./chair-rental.service");
  const hostRenterCount = await countActiveHostRentersForOwner(ownerId);

  return {
    shopCount: shops.length,
    activeStaffCount,
    hasAdminManager,
    hasSeniorWithAdmin: false,
    tier: primary?.tier ?? "solo",
    structureKind: primary?.structureKind ?? "standalone",
    hostRenterCount,
    brandEntityCount,
  };
}

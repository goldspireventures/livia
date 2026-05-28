import { db, businessesTable, bookingsTable, type Business } from "@workspace/db";
import { and, eq, gte, sql, ne } from "drizzle-orm";
import { recordMeter } from "../lib/metering-recorder";
import { getBusinessById } from "./businesses.service";
import { tenantHasEntitlementForBusiness } from "./billing.service";

/** Minimum peer shops in bucket before aggregates are shown (ADR 0014). */
export const PEER_K_MIN = 10;

const LOOKBACK_DAYS = 90;

export type PeerInsightsResponse =
  | {
      available: true;
      peerCount: number;
      vertical: string;
      country: string;
      benchmarks: {
        avgBookingsPerWeek: number;
        noShowRatePct: number;
        voiceBookingSharePct: number;
      };
      disclaimer: string;
    }
  | {
      available: false;
      peerCount: number;
      required: number;
      vertical: string;
      country: string;
      message: string;
    };

async function countPeersInBucket(
  vertical: Business["vertical"],
  country: string,
  excludeBusinessId: string,
) {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);

  const [row] = await db
    .select({ count: sql<number>`count(distinct ${businessesTable.id})::int` })
    .from(businessesTable)
    .innerJoin(
      bookingsTable,
      and(
        eq(bookingsTable.businessId, businessesTable.id),
        gte(bookingsTable.startAt, since),
      ),
    )
    .where(
      and(
        eq(businessesTable.vertical, vertical),
        eq(businessesTable.country, country),
        ne(businessesTable.id, excludeBusinessId),
      ),
    );

  return row?.count ?? 0;
}

async function aggregateBucket(vertical: Business["vertical"], country: string) {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);
  const weekMs = 7 * 86_400_000;

  const [bookingStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      noShows: sql<number>`count(*) filter (where ${bookingsTable.status} = 'NO_SHOW')::int`,
      voice: sql<number>`count(*) filter (where ${bookingsTable.source} = 'voice')::int`,
      shops: sql<number>`count(distinct ${bookingsTable.businessId})::int`,
    })
    .from(bookingsTable)
    .innerJoin(businessesTable, eq(bookingsTable.businessId, businessesTable.id))
    .where(
      and(
        eq(businessesTable.vertical, vertical),
        eq(businessesTable.country, country),
        gte(bookingsTable.startAt, since),
      ),
    );

  const shops = Math.max(1, bookingStats?.shops ?? 1);
  const total = bookingStats?.total ?? 0;
  const weeks = LOOKBACK_DAYS / 7;
  const avgBookingsPerWeek = Math.round((total / shops / weeks) * 10) / 10;
  const noShowRatePct =
    total > 0 ? Math.round(((bookingStats?.noShows ?? 0) / total) * 1000) / 10 : 0;
  const voiceBookingSharePct =
    total > 0 ? Math.round(((bookingStats?.voice ?? 0) / total) * 1000) / 10 : 0;

  return { avgBookingsPerWeek, noShowRatePct, voiceBookingSharePct };
}

export async function getPeerInsightsForBusiness(
  businessId: string,
): Promise<PeerInsightsResponse> {
  const biz = await getBusinessById(businessId);
  if (!biz) throw new Error("BUSINESS_NOT_FOUND");

  const hasAddon = await tenantHasEntitlementForBusiness(businessId, "peer_set_insights");
  const hasOptIn = await tenantHasEntitlementForBusiness(
    businessId,
    "cross_tenant_intelligence_opt_in",
  );

  if (!hasAddon || !hasOptIn) {
    return {
      available: false,
      peerCount: 0,
      required: PEER_K_MIN,
      vertical: biz.vertical,
      country: biz.country,
      message: hasAddon
        ? "Enable cross-tenant peer insights in Settings to view benchmarks."
        : "Subscribe to the Peer Insights add-on (€49/mo) to unlock anonymized benchmarks.",
    };
  }

  const peerCount = await countPeersInBucket(biz.vertical, biz.country, businessId);

  if (peerCount < PEER_K_MIN) {
    return {
      available: false,
      peerCount,
      required: PEER_K_MIN,
      vertical: biz.vertical,
      country: biz.country,
      message: `Not enough anonymized peers in your segment yet (${peerCount}/${PEER_K_MIN}).`,
    };
  }

  const benchmarks = await aggregateBucket(biz.vertical, biz.country);
  await recordMeter(businessId, "peer_set_insight_view", 1);

  return {
    available: true,
    peerCount,
    vertical: biz.vertical,
    country: biz.country,
    benchmarks,
    disclaimer:
      "Aggregates only. No shop or customer identifiers. k-anonymity threshold applied.",
  };
}

import {
  db,
  businessesTable,
  businessMembershipsTable,
  bookingsTable,
  servicesTable,
  usersTable,
} from "@workspace/db";
import { and, eq, gte, inArray } from "drizzle-orm";
import { sendOperationalEmail } from "./transactional-email.service";
import { logger } from "../lib/logger";
import { isLivAttributedBooking } from "./weekly-digest-attribution";

export { isLivAttributedBooking } from "./weekly-digest-attribution";

export type WeeklyDigestStats = {
  businessId: string;
  businessName: string;
  weekBookingsTotal: number;
  livAttributedBookings: number;
  livAttributedValueMinor: number;
  currency: string;
};

export async function gatherWeeklyDigestStats(businessId: string): Promise<WeeklyDigestStats | null> {
  const [biz] = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      currency: businessesTable.currency,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  if (!biz) return null;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60_000);

  const rows = await db
    .select({
      source: bookingsTable.source,
      sourceConversationId: bookingsTable.sourceConversationId,
      priceMinor: servicesTable.priceMinor,
      status: bookingsTable.status,
    })
    .from(bookingsTable)
    .innerJoin(servicesTable, eq(servicesTable.id, bookingsTable.serviceId))
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.createdAt, since),
        inArray(bookingsTable.status, ["CONFIRMED", "COMPLETED", "PENDING"]),
      ),
    );

  let livAttributedBookings = 0;
  let livAttributedValueMinor = 0;

  for (const r of rows) {
    if (isLivAttributedBooking(r)) {
      livAttributedBookings += 1;
      livAttributedValueMinor += r.priceMinor ?? 0;
    }
  }

  return {
    businessId: biz.id,
    businessName: biz.name,
    weekBookingsTotal: rows.length,
    livAttributedBookings,
    livAttributedValueMinor,
    currency: biz.currency ?? "EUR",
  };
}

async function resolveOwnerEmail(businessId: string): Promise<string | null> {
  const [row] = await db
    .select({ email: usersTable.email })
    .from(businessMembershipsTable)
    .innerJoin(usersTable, eq(usersTable.id, businessMembershipsTable.userId))
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.role, "OWNER"),
      ),
    )
    .limit(1);
  return row?.email?.trim() ?? null;
}

function formatMoney(minor: number, currency: string): string {
  const major = (minor / 100).toFixed(2);
  return currency === "EUR" ? `€${major}` : `${currency} ${major}`;
}

export async function sendWeeklyDigestEmail(
  businessId: string,
): Promise<"sent" | "skipped" | "failed"> {
  const stats = await gatherWeeklyDigestStats(businessId);
  if (!stats) return "skipped";

  const to = await resolveOwnerEmail(businessId);
  if (!to) {
    logger.warn({ businessId }, "weekly-digest: no owner email");
    return "skipped";
  }

  const recoveredLine =
    stats.livAttributedBookings > 0
      ? `Liv was involved in ${stats.livAttributedBookings} booking${
          stats.livAttributedBookings === 1 ? "" : "s"
        } this week (~${formatMoney(stats.livAttributedValueMinor, stats.currency)} in booked services).`
      : "No Liv-attributed bookings this week yet — when customers book via voice, SMS, or chat, they will show here.";

  const body = [
    `Hi — here's Liv's week in review for ${stats.businessName}.`,
    ``,
    recoveredLine,
    ``,
    `Total bookings created this week: ${stats.weekBookingsTotal}.`,
    ``,
    `Open the Livia app for today's briefing and your conversation queue.`,
    ``,
    `— Liv`,
  ].join("\n");

  return sendOperationalEmail({
    businessId,
    to,
    subject: `Your week with Liv — ${stats.businessName}`,
    body,
    templateKey: "weekly-digest",
  });
}

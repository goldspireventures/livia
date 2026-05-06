// Internal cron-callable routes. Protected by INTERNAL_CRON_SECRET header.
// POST /internal/cron/send-reminders — T-24h booking reminders, deduped
// via notificationLogs.templateKey.

import { Router, type IRouter } from "express";
import { db, bookingsTable, notificationLogsTable } from "@workspace/db";
import { and, eq, gte, lte, or, inArray } from "drizzle-orm";
import { enrichBooking } from "../services/bookings.service";
import { sendBookingReminderEmail } from "../services/booking-emails.service";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function authorize(req: Parameters<Parameters<IRouter["post"]>[1]>[0]): boolean {
  const expected = process.env["INTERNAL_CRON_SECRET"];
  if (!expected) return false;
  const got = req.headers["x-internal-cron-secret"];
  return typeof got === "string" && got === expected;
}

const REMINDER_TEMPLATE_KEY = "booking-reminder-t24";

router.post("/internal/cron/send-reminders", async (req, res): Promise<void> => {
  if (!authorize(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60_000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60_000);

  const candidates = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        gte(bookingsTable.startAt, windowStart),
        lte(bookingsTable.startAt, windowEnd),
        or(
          eq(bookingsTable.status, "CONFIRMED"),
          eq(bookingsTable.status, "PENDING"),
        ),
      ),
    );

  if (candidates.length === 0) {
    res.json({ checked: 0, sent: 0, skipped: 0 });
    return;
  }

  // Dedupe: which of these bookings already have a reminder row?
  const ids = candidates.map((b) => b.id);
  const alreadySent = await db
    .select({ bookingId: notificationLogsTable.bookingId })
    .from(notificationLogsTable)
    .where(
      and(
        inArray(notificationLogsTable.bookingId, ids),
        eq(notificationLogsTable.templateKey, REMINDER_TEMPLATE_KEY),
      ),
    );
  const sentSet = new Set(alreadySent.map((r) => r.bookingId));

  let sent = 0;
  let skipped = 0;
  for (const b of candidates) {
    if (sentSet.has(b.id)) {
      skipped++;
      continue;
    }
    try {
      const enriched = await enrichBooking(b);
      await sendBookingReminderEmail({
        business: b.businessId,
        booking: enriched as Parameters<typeof sendBookingReminderEmail>[0]["booking"],
      });
      sent++;
    } catch (err) {
      logger.error({ err, bookingId: b.id }, "send-reminders: per-booking failure");
    }
  }

  res.json({ checked: candidates.length, sent, skipped });
});

export default router;

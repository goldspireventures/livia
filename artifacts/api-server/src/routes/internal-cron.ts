// Internal cron-callable routes. Protected by INTERNAL_CRON_SECRET header.
// POST /internal/cron/send-reminders — T-24h booking reminders, deduped
// via notificationLogs.templateKey.

import { Router, type IRouter } from "express";
import { db, bookingsTable, notificationLogsTable } from "@workspace/db";
import { and, eq, gte, lte, or, inArray } from "drizzle-orm";
import { enrichBooking } from "../services/bookings.service";
import { sendBookingReminderEmail } from "../services/booking-emails.service";
import { logger } from "../lib/logger";
import { runVoiceSettlementSweep } from "../services/settlement.service";
import { snapshotActiveStaffSeats } from "../services/billing.service";
import { businessesTable } from "@workspace/db";
import { sendOnboardingStuckNudges, findStuckOnboardingBusinesses } from "../services/onboarding-nudge.service";
import { isInngestWorkflowsEnabled } from "../lib/inngest";
import { notifyBusinessMembersPush } from "../services/push.service";
import { sweepPendingWebhookDeliveries } from "../services/webhook-delivery.service";

import { sendError } from "../lib/http-errors";
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
    sendError(res, req, 401, "Unauthorized");
    return;
  }

  if (isInngestWorkflowsEnabled()) {
    res.json({
      checked: 0,
      sent: 0,
      skipped: 0,
      engine: "inngest",
      message:
        "T-24h reminders are scheduled by the booking-reminder-t24 workflow. Cron sweep is fallback only when WORKFLOWS_DISABLED or Inngest is off.",
    });
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

router.post("/internal/cron/billing-snapshot", async (req, res): Promise<void> => {
  if (!authorize(req)) {
    sendError(res, req, 401, "Unauthorized");
    return;
  }

  const businesses = await db.select({ id: businessesTable.id }).from(businessesTable);
  let seats = 0;
  for (const { id } of businesses) {
    await snapshotActiveStaffSeats(id);
    seats++;
  }

  const settlement = await runVoiceSettlementSweep();
  res.json({ staffSnapshots: seats, settlement });
});

router.post("/internal/cron/webhook-deliveries", async (req, res): Promise<void> => {
  if (!authorize(req)) {
    sendError(res, req, 401, "Unauthorized");
    return;
  }
  const result = await sweepPendingWebhookDeliveries();
  res.json(result);
});

/** Businesses stuck in onboarding >48h with &lt;50% progress — list + optional Resend nudge. */
router.post("/internal/cron/onboarding-stuck", async (req, res): Promise<void> => {
  if (!authorize(req)) {
    sendError(res, req, 401, "Unauthorized");
    return;
  }
  const send = req.body?.send === true || req.query.send === "true";
  const stuck = await findStuckOnboardingBusinesses();
  const nudge = send ? await sendOnboardingStuckNudges() : null;
  res.json({
    stuck: stuck.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      percentComplete: s.percentComplete,
      currentAct: s.currentAct,
      updatedAt: s.updatedAt,
      ownerEmail: s.ownerEmail ? `${s.ownerEmail.slice(0, 3)}…` : null,
    })),
    nudge,
  });
});

/** Daily commerce intelligence sync — fallback when Inngest is off. */
router.post("/internal/cron/commerce-intelligence", async (req, res): Promise<void> => {
  if (!authorize(req)) {
    sendError(res, req, 401, "Unauthorized");
    return;
  }
  if (isInngestWorkflowsEnabled()) {
    res.json({
      engine: "inngest",
      message: "commerce-intelligence-daily workflow handles this when Inngest is on",
    });
    return;
  }
  const rows = await db.select({ id: businessesTable.id }).from(businessesTable);
  const { runCommerceIntelligenceDaily } = await import(
    "../services/commerce-weekly-digest.service"
  );
  let signalsSynced = 0;
  let proposalsCreated = 0;
  for (const row of rows) {
    const result = await runCommerceIntelligenceDaily(row.id);
    signalsSynced += result.signalsSynced;
    proposalsCreated += result.proposalsCreated;
  }
  res.json({ processed: rows.length, signalsSynced, proposalsCreated });
});

/** Beauty fill-cycle rebook SMS — weekly dedupe per client + service. */
router.post("/internal/cron/beauty-fill-cycle", async (req, res): Promise<void> => {
  if (!authorize(req)) {
    sendError(res, req, 401, "Unauthorized");
    return;
  }
  const { sweepBeautyFillCycleNudges } = await import(
    "../services/beauty-fill-cycle.service"
  );
  const result = await sweepBeautyFillCycleNudges();
  res.json(result);
});

/** Multi-touch aftercare sequence steps (body-art / medspa). */
router.post("/internal/cron/aftercare-sequences", async (req, res): Promise<void> => {
  if (!authorize(req)) {
    sendError(res, req, 401, "Unauthorized");
    return;
  }
  const { processDueAftercareSequences } = await import(
    "../services/guest-care-aftercare.service"
  );
  const result = await processDueAftercareSequences();
  res.json(result);
});

/** ~17:00 local — one push summarising far-future booking in-app alerts (no instant push). */
router.post("/internal/cron/evening-notification-roundup", async (req, res): Promise<void> => {
  if (!authorize(req)) {
    sendError(res, req, 401, "Unauthorized");
    return;
  }
  const { runEveningNotificationRoundup } = await import(
    "../services/evening-notification-roundup.service"
  );
  const targetHour =
    typeof req.body?.targetHour === "number" ? (req.body.targetHour as number) : undefined;
  const result = await runEveningNotificationRoundup({ targetHour });
  res.json(result);
});

/** Event-vendor — Liv prep nudges + post-event review emails (consult-first lifecycle). */
router.post("/internal/cron/event-vendor-lifecycle", async (req, res): Promise<void> => {
  if (!authorize(req)) {
    sendError(res, req, 401, "Unauthorized");
    return;
  }
  const { runEventVendorLifecycleSweep } = await import(
    "../services/event-vendor-lifecycle.service"
  );
  const businessId = (req.body?.businessId as string | undefined)?.trim();
  const result = await runEventVendorLifecycleSweep(businessId ? { businessId } : undefined);
  res.json(result);
});

router.post("/internal/cron/test-push", async (req, res): Promise<void> => {
  if (!authorize(req)) {
    sendError(res, req, 401, "Unauthorized");
    return;
  }
  const businessId = (req.body?.businessId as string | undefined)?.trim();
  if (!businessId) {
    sendError(res, req, 400, "businessId is required");
    return;
  }
  const result = await notifyBusinessMembersPush({
    businessId,
    title: "Livia test push",
    body: "Push pipeline is wired. New bookings will notify like this.",
    data: { type: "test" },
  });
  res.json(result);
});

export default router;

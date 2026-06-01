// Bookings.
//
// STAFF-scoping note: when the effective role is STAFF, list reads are
// pinned to `staffId = actingStaffId`. STAFF can still create bookings
// (e.g. logging a walk-in) but only assigned to themselves; a STAFF
// caller cannot fetch or update a booking that belongs to a colleague.

import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId, getRoleContext } from "../lib/auth";
import {
  listBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  rescheduleBooking,
} from "../services/bookings.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";
import { appendHumanAudit } from "../lib/audit";
import { recordBookingOutcomeMeters } from "../services/billing.service";
import { emitBookingCreated, emitBookingStatusChange } from "../lib/booking-events";
import { listStuckContinuityBookings } from "../services/booking-continuity.service";
import { listCustomerDriftCandidates } from "../services/customer-drift.service";
import { getBookingTimeline } from "../services/booking-timeline.service";
import { getLinkedInboxCaseForBooking } from "../services/booking-linked-inbox.service";
import { listBookingMedia, attachBookingMedia } from "../services/booking-media.service";
import { replyDomainError } from "../lib/domain-errors";
import { markOnboardingTestBooking } from "../services/onboarding-progress.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

const STATUS_EVENT: Record<string, string> = {
  CONFIRMED: EventType.BOOKING_CONFIRMED,
  CANCELLED: EventType.BOOKING_CANCELLED,
  COMPLETED: EventType.BOOKING_COMPLETED,
  NO_SHOW: EventType.BOOKING_NO_SHOW,
};

// Access: OWNER+ADMIN+STAFF. STAFF is forced to staffId=me.
router.get(
  "/businesses/:businessId/bookings",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const ctx = getRoleContext(req);
    const { status, staffId, customerId, source, from, to, limit, offset } = req.query;

    // STAFF effective role: ignore client-supplied staffId, pin to mine.
    const effectiveStaffId =
      ctx.effectiveRole === "STAFF"
        ? ctx.actingStaffId ?? "__no_staff__"
        : (staffId as string | undefined);

    const result = await listBookings(businessId, {
      status: status as string | undefined,
      staffId: effectiveStaffId,
      customerId: customerId as string | undefined,
      source: source as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json(result);
  },
);

// Access: OWNER+ADMIN+STAFF. STAFF can only book for themselves.
router.post(
  "/businesses/:businessId/bookings",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const ctx = getRoleContext(req);
    const { serviceId, customerId, staffId, startAt, channelType, notes } = req.body;
    if (!serviceId || !customerId || !startAt) {
      sendError(res, req, 400, "serviceId, customerId, and startAt are required");
      return;
    }

    // STAFF can only assign bookings to themselves.
    let assignedStaffId: string | undefined = staffId;
    if (ctx.role === "STAFF") {
      if (!ctx.actingStaffId) {
        sendError(res, req, 403, "Staff account is not linked to a staff row."); return;
      }
      if (staffId && staffId !== ctx.actingStaffId) {
        sendError(res, req, 403, "Staff can only create bookings assigned to themselves."); return;
      }
      assignedStaffId = ctx.actingStaffId;
    }

    try {
      const booking = await createBooking(businessId, { serviceId, customerId, staffId: assignedStaffId, startAt, channelType, notes });
      await logEvent({ type: EventType.BOOKING_CREATED, businessId, userId, entityType: "booking", entityId: booking.id });
      await appendHumanAudit(businessId, userId, "human.booking.create", "booking", booking.id, {
        status: booking.status,
        customerId,
        serviceId,
        staffId: assignedStaffId ?? null,
        startAt,
      });
      void emitBookingCreated(booking as Parameters<typeof emitBookingCreated>[0]).catch(
        () => undefined,
      );
      res.status(201).json(booking);
    } catch (err: any) {
      if (err.message === "SERVICE_NOT_FOUND") {
        sendError(res, req, 400, "Service not found"); return;
      }
      if (err.message === "SLOT_CONFLICT") {
        sendError(res, req, 409, "Slot is no longer available"); return;
      }
      if (err.message === "STAFF_NOT_ASSIGNED_TO_SERVICE") {
        sendError(res, req, 400, "That team member is not assigned to this service — update Team → Services first.",);
        return;
      }
      if (err.message === "STAFF_NOT_FOUND") {
        sendError(res, req, 400, "Staff member not found or inactive"); return;
      }
      throw err;
    }
  },
);

router.get(
  "/businesses/:businessId/bookings/stuck-continuity",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const hours = req.query.hours ? parseInt(String(req.query.hours), 10) : 24;
    const rows = await listStuckContinuityBookings(businessId, Number.isFinite(hours) ? hours : 24);
    res.json({ stuck: rows });
  },
);

router.get(
  "/businesses/:businessId/bookings/drift-candidates",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const minDays = req.query.minDays ? parseInt(String(req.query.minDays), 10) : 90;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 15;
    const rows = await listCustomerDriftCandidates(businessId, {
      minDays: Number.isFinite(minDays) ? minDays : 90,
      limit: Number.isFinite(limit) ? limit : 15,
    });
    res.json({ candidates: rows });
  },
);

router.get(
  "/businesses/:businessId/bookings/:bookingId/media",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const bookingId = getBizId(req.params.bookingId);
    const media = await listBookingMedia(businessId, bookingId);
    res.json({ media });
  },
);

router.post(
  "/businesses/:businessId/bookings/:bookingId/media",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const bookingId = getBizId(req.params.bookingId);
    const { url, mimeType } = req.body;
    if (!url || typeof url !== "string") {
      sendError(res, req, 400, "url is required");
      return;
    }
    const row = await attachBookingMedia(businessId, bookingId, { url, mimeType });
    if (!row) {
      sendError(res, req, 404, "Booking not found");
      return;
    }
    res.status(201).json(row);
  },
);

router.get(
  "/businesses/:businessId/bookings/:bookingId/timeline",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const bookingId = getBizId(req.params.bookingId);
    const ctx = getRoleContext(req);
    const b = await getBookingById(businessId, bookingId);
    if (!b) {
      sendError(res, req, 404, "Booking not found");
      return;
    }
    if (ctx.effectiveRole === "STAFF" && b.staffId !== ctx.actingStaffId) {
      sendError(res, req, 404, "Booking not found");
      return;
    }
    const timeline = await getBookingTimeline(businessId, bookingId);
    res.json({ timeline });
  },
);

// Access: OWNER+ADMIN+STAFF (STAFF only their own).
router.get(
  "/businesses/:businessId/bookings/:bookingId",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const bookingId = getBizId(req.params.bookingId);
    const ctx = getRoleContext(req);
    const b = await getBookingById(businessId, bookingId);
    if (!b) { sendError(res, req, 404, "Booking not found"); return; }
    if (ctx.effectiveRole === "STAFF" && b.staffId !== ctx.actingStaffId) {
      sendError(res, req, 404, "Booking not found");
      return;
    }
    const linkedInboxCase = await getLinkedInboxCaseForBooking(businessId, bookingId);
    res.json({ ...b, linkedInboxCase });
  },
);

// Access: OWNER+ADMIN+STAFF. STAFF can update only their own bookings,
// and is not allowed to reassign to a different staff member.
router.patch(
  "/businesses/:businessId/bookings/:bookingId",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const bookingId = getBizId(req.params.bookingId);
    const ctx = getRoleContext(req);

    if (ctx.role === "STAFF") {
      const existing = await getBookingById(businessId, bookingId);
      if (!existing || existing.staffId !== ctx.actingStaffId) {
        sendError(res, req, 404, "Booking not found");
        return;
      }
      if (req.body?.staffId && req.body.staffId !== ctx.actingStaffId) {
        sendError(res, req, 403, "Staff cannot reassign bookings.");
        return;
      }
    }

    try {
      const before = await getBookingById(businessId, bookingId);
      const updated = await updateBookingStatus(businessId, bookingId, req.body);
      if (!updated) { sendError(res, req, 404, "Booking not found"); return; }
      if (req.body.status && STATUS_EVENT[req.body.status]) {
        await logEvent({ type: STATUS_EVENT[req.body.status], businessId, userId, entityType: "booking", entityId: bookingId });
      }
      await appendHumanAudit(businessId, userId, "human.booking.update", "booking", bookingId, {
        changes: req.body,
        status: updated.status,
      });
      if (req.body.status) {
        const source =
          (before as { source?: string } | null)?.source ??
          (updated as { source?: string }).source ??
          "web";
        await recordBookingOutcomeMeters(
          businessId,
          bookingId,
          updated.serviceId,
          source,
          updated.status,
        );
        void emitBookingStatusChange(
          updated as Parameters<typeof emitBookingStatusChange>[0],
          updated.status,
          req.body.cancellationReason,
        ).catch(() => undefined);
      }
      res.json(updated);
    } catch (err: unknown) {
      if (replyDomainError(req, res, err)) return;
      throw err;
    }
  },
);

router.post(
  "/businesses/:businessId/bookings/:bookingId/reschedule",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const bookingId = getBizId(req.params.bookingId);
    const ctx = getRoleContext(req);
    const startAt = req.body?.startAt;
    if (!startAt || typeof startAt !== "string") {
      sendError(res, req, 400, "startAt is required");
      return;
    }

    if (ctx.role === "STAFF") {
      const existing = await getBookingById(businessId, bookingId);
      if (!existing || existing.staffId !== ctx.actingStaffId) {
        sendError(res, req, 404, "Booking not found");
        return;
      }
    }

    try {
      const updated = await rescheduleBooking(businessId, bookingId, startAt);
      await appendHumanAudit(businessId, userId, "human.booking.reschedule", "booking", bookingId, {
        startAt,
        status: updated.status,
      });
      res.json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "BOOKING_NOT_FOUND") {
        sendError(res, req, 404, "Booking not found");
        return;
      }
      if (msg === "INVALID_STATUS_FOR_RESCHEDULE") {
        sendError(res, req, 400, "Only pending or confirmed bookings can be rescheduled");
        return;
      }
      if (msg === "SLOT_CONFLICT") {
        sendError(res, req, 409, "That time is no longer available");
        return;
      }
      if (replyDomainError(req, res, err)) return;
      throw err;
    }
  },
);

router.post(
  "/businesses/:businessId/bookings/:bookingId/running-late",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const bookingId = getBizId(req.params.bookingId);
    const minutesLate = Number(req.body?.minutesLate ?? 15);
    if (!Number.isFinite(minutesLate) || minutesLate < 1) {
      sendError(res, req, 400, "minutesLate must be a positive number");
      return;
    }
    const { notifyBookingRunningLate } = await import("../services/running-late.service");
    const result = await notifyBookingRunningLate(businessId, bookingId, { minutesLate });
    if (!result) {
      sendError(res, req, 404, "Booking not found or not notifiable");
      return;
    }
    res.json(result);
  },
);

router.post(
  "/businesses/:businessId/bookings/running-late-broadcast",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const minutesLate = Number(req.body?.minutesLate ?? 15);
    const message = typeof req.body?.message === "string" ? req.body.message : undefined;
    if (!Number.isFinite(minutesLate) || minutesLate < 1) {
      sendError(res, req, 400, "minutesLate must be a positive number");
      return;
    }
    const { inngest, isInngestWorkflowsEnabled } = await import("../lib/inngest");
    if (!isInngestWorkflowsEnabled()) {
      sendError(res, req, 503, "Workflows not enabled in this environment");
      return;
    }
    await inngest.send({
      name: "livia/running-late.broadcast",
      data: { businessId, minutesLate, message },
    });
    res.status(202).json({ queued: true, minutesLate });
  },
);

router.get(
  "/businesses/:businessId/visit-feedback",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const { listRecentVisitFeedback } = await import("../services/visit-feedback.service");
    const rows = await listRecentVisitFeedback(businessId);
    res.json({ data: rows });
  },
);

export default router;

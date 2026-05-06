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
} from "../services/bookings.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";

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
    const { status, staffId, customerId, from, to, limit, offset } = req.query;

    // STAFF effective role: ignore client-supplied staffId, pin to mine.
    const effectiveStaffId =
      ctx.effectiveRole === "STAFF"
        ? ctx.actingStaffId ?? "__no_staff__"
        : (staffId as string | undefined);

    const result = await listBookings(businessId, {
      status: status as string | undefined,
      staffId: effectiveStaffId,
      customerId: customerId as string | undefined,
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
      res.status(400).json({ error: "serviceId, customerId, and startAt are required" }); return;
    }

    // STAFF can only assign bookings to themselves.
    let assignedStaffId: string | undefined = staffId;
    if (ctx.role === "STAFF") {
      if (!ctx.actingStaffId) {
        res.status(403).json({ error: "Staff account is not linked to a staff row." }); return;
      }
      if (staffId && staffId !== ctx.actingStaffId) {
        res.status(403).json({ error: "Staff can only create bookings assigned to themselves." }); return;
      }
      assignedStaffId = ctx.actingStaffId;
    }

    try {
      const booking = await createBooking(businessId, { serviceId, customerId, staffId: assignedStaffId, startAt, channelType, notes });
      await logEvent({ type: EventType.BOOKING_CREATED, businessId, userId, entityType: "booking", entityId: booking.id });
      res.status(201).json(booking);
    } catch (err: any) {
      if (err.message === "SERVICE_NOT_FOUND") {
        res.status(400).json({ error: "Service not found" }); return;
      }
      if (err.message === "SLOT_CONFLICT") {
        res.status(409).json({ error: "Slot is no longer available" }); return;
      }
      throw err;
    }
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
    if (!b) { res.status(404).json({ error: "Booking not found" }); return; }
    if (ctx.effectiveRole === "STAFF" && b.staffId !== ctx.actingStaffId) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    res.json(b);
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
        res.status(404).json({ error: "Booking not found" });
        return;
      }
      if (req.body?.staffId && req.body.staffId !== ctx.actingStaffId) {
        res.status(403).json({ error: "Staff cannot reassign bookings." });
        return;
      }
    }

    try {
      const updated = await updateBookingStatus(businessId, bookingId, req.body);
      if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }
      if (req.body.status && STATUS_EVENT[req.body.status]) {
        await logEvent({ type: STATUS_EVENT[req.body.status], businessId, userId, entityType: "booking", entityId: bookingId });
      }
      res.json(updated);
    } catch (err: any) {
      if (err.message?.startsWith("INVALID_TRANSITION")) {
        res.status(409).json({ error: "Invalid status transition" }); return;
      }
      throw err;
    }
  },
);

export default router;

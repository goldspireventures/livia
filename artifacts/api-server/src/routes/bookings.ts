import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { userHasAccessToBusiness } from "../services/businesses.service";
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

router.get("/businesses/:businessId/bookings", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const { status, staffId, customerId, from, to, limit, offset } = req.query;
  const result = await listBookings(businessId, {
    status: status as string | undefined,
    staffId: staffId as string | undefined,
    customerId: customerId as string | undefined,
    from: from as string | undefined,
    to: to as string | undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  });
  res.json(result);
});

router.post("/businesses/:businessId/bookings", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const { serviceId, customerId, staffId, startAt, channelType, notes } = req.body;
  if (!serviceId || !customerId || !startAt) {
    res.status(400).json({ error: "serviceId, customerId, and startAt are required" }); return;
  }
  try {
    const booking = await createBooking(businessId, { serviceId, customerId, staffId, startAt, channelType, notes });
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
});

router.get("/businesses/:businessId/bookings/:bookingId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const bookingId = getBizId(req.params.bookingId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const b = await getBookingById(businessId, bookingId);
  if (!b) { res.status(404).json({ error: "Booking not found" }); return; }
  res.json(b);
});

router.patch("/businesses/:businessId/bookings/:bookingId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const bookingId = getBizId(req.params.bookingId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
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
});

export default router;

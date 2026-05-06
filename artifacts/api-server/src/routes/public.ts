import { Router, type IRouter } from "express";
import { getBusinessBySlug } from "../services/businesses.service";
import { listServices } from "../services/services.service";
import { listStaff } from "../services/staff.service";
import { getAvailableSlots } from "../services/slots.service";
import { findOrCreateCustomer } from "../services/customers.service";
import { createBooking } from "../services/bookings.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";

const router: IRouter = Router();

router.get("/public/b/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const biz = await getBusinessBySlug(slug);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

  const [services, staff] = await Promise.all([
    listServices(biz.id, true),
    listStaff(biz.id, true),
  ]);

  res.json({
    id: biz.id,
    name: biz.name,
    slug: biz.slug,
    description: biz.description,
    category: biz.category,
    city: biz.city,
    logoUrl: biz.logoUrl,
    coverImageUrl: biz.coverImageUrl,
    instagramHandle: biz.instagramHandle,
    timezone: biz.timezone,
    aiEnabled: biz.aiEnabled ?? "true",
    aiGreeting: biz.aiGreeting ?? null,
    services,
    staff,
  });
});

router.get("/public/b/:slug/slots", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const biz = await getBusinessBySlug(slug);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

  const { serviceId, date, staffId } = req.query;
  if (!serviceId || !date) {
    res.status(400).json({ error: "serviceId and date are required" }); return;
  }

  const slots = await getAvailableSlots({
    businessId: biz.id,
    serviceId: serviceId as string,
    date: date as string,
    staffId: staffId as string | undefined,
    timezone: biz.timezone,
  });

  res.json({ date, serviceId, slots });
});

router.post("/public/b/:slug/book", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const biz = await getBusinessBySlug(slug);
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

  const {
    serviceId, staffId, startAt,
    customerFirstName, customerLastName, customerEmail, customerPhone,
    notes, channelType,
  } = req.body;

  if (!serviceId || !startAt || !customerFirstName) {
    res.status(400).json({ error: "serviceId, startAt, and customerFirstName are required" }); return;
  }

  try {
    const customer = await findOrCreateCustomer(biz.id, {
      firstName: customerFirstName,
      lastName: customerLastName,
      email: customerEmail,
      phone: customerPhone,
    });

    const booking = await createBooking(biz.id, {
      serviceId, customerId: customer.id, staffId, startAt,
      channelType: channelType ?? "WEB", notes,
    });

    await logEvent({
      type: EventType.BOOKING_CREATED,
      businessId: biz.id,
      entityType: "booking",
      entityId: booking.id,
      context: { channel: channelType ?? "WEB", source: "public" },
    });

    res.status(201).json({
      bookingId: booking.id,
      status: booking.status,
      startAt: booking.startAt,
      endAt: booking.endAt,
      serviceName: booking.service?.name ?? "",
      staffDisplayName: booking.staff?.displayName ?? null,
      businessName: biz.name,
    });
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

export default router;

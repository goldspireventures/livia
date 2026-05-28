import { Router, type IRouter } from "express";
import {
  requirePartnerApiKey,
  requirePartnerScope,
  assertPartnerCanAccessSlug,
} from "../lib/partner-auth";
import {
  getPartnerBusinessBySlug,
  listPartnerBookings,
  listPartnerCustomers,
  listPartnerServices,
  listPartnerSlots,
  createPartnerBooking,
} from "../services/partner-api.service";
import { safeClientMessage, sendError } from "../lib/http-errors";

const router: IRouter = Router();

router.use("/partner/v1", requirePartnerApiKey());

const getSlug = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

async function resolveBiz(req: Parameters<Parameters<IRouter["get"]>[1]>[0], slug: string) {
  const ctx = req.partnerAuth!;
  const access = await assertPartnerCanAccessSlug(ctx, slug);
  if (!access) return null;
  const biz = await getPartnerBusinessBySlug(slug);
  if (!biz || biz.id !== access.businessId) return null;
  return biz;
}

router.get(
  "/partner/v1/businesses/:slug",
  requirePartnerScope("business:read"),
  async (req, res): Promise<void> => {
    const slug = getSlug(req.params.slug);
    const biz = await resolveBiz(req, slug);
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json({ data: biz });
  },
);

router.get(
  "/partner/v1/businesses/:slug/bookings",
  requirePartnerScope("bookings:read"),
  async (req, res): Promise<void> => {
    const slug = getSlug(req.params.slug);
    const biz = await resolveBiz(req, slug);
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }

    const fromRaw = (req.query.from as string | undefined) ?? "";
    const toRaw = (req.query.to as string | undefined) ?? "";
    const from = fromRaw ? new Date(fromRaw) : new Date();
    const to = toRaw ? new Date(toRaw) : new Date(Date.now() + 30 * 86_400_000);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      sendError(res, req, 400, "from and to must be valid ISO dates");
      return;
    }

    const bookings = await listPartnerBookings(biz.id, from, to);
    res.json({
      data: { slug, from: from.toISOString(), to: to.toISOString(), bookings },
    });
  },
);

router.get(
  "/partner/v1/businesses/:slug/customers",
  requirePartnerScope("customers:read"),
  async (req, res): Promise<void> => {
    const slug = getSlug(req.params.slug);
    const biz = await resolveBiz(req, slug);
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json({ data: { slug, customers: await listPartnerCustomers(biz.id) } });
  },
);

router.get(
  "/partner/v1/businesses/:slug/services",
  requirePartnerScope("services:read"),
  async (req, res): Promise<void> => {
    const slug = getSlug(req.params.slug);
    const biz = await resolveBiz(req, slug);
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json({ data: { slug, services: await listPartnerServices(biz.id) } });
  },
);

router.get(
  "/partner/v1/businesses/:slug/slots",
  requirePartnerScope("slots:read"),
  async (req, res): Promise<void> => {
    const slug = getSlug(req.params.slug);
    const biz = await resolveBiz(req, slug);
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }

    const serviceId = (req.query.serviceId as string | undefined)?.trim();
    const date = (req.query.date as string | undefined)?.trim();
    const staffId = (req.query.staffId as string | undefined)?.trim();

    if (!serviceId || !date) {
      sendError(res, req, 400, "serviceId and date (YYYY-MM-DD) are required");
      return;
    }

    const slots = await listPartnerSlots({
      businessId: biz.id,
      serviceId,
      date,
      staffId: staffId || undefined,
      timezone: biz.timezone,
    });

    res.json({ data: { slug, serviceId, date, slots } });
  },
);

router.post(
  "/partner/v1/businesses/:slug/bookings",
  requirePartnerScope("bookings:write"),
  async (req, res): Promise<void> => {
    const slug = getSlug(req.params.slug);
    const biz = await resolveBiz(req, slug);
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    const { serviceId, startAt, staffId, customerFirstName, customerLastName, customerEmail, customerPhone, notes } =
      req.body ?? {};
    if (!serviceId || !startAt || !customerFirstName) {
      sendError(res, req, 400, "serviceId, startAt, customerFirstName required");
      return;
    }
    try {
      const created = await createPartnerBooking(biz.id, {
        serviceId: String(serviceId),
        startAt: String(startAt),
        staffId: staffId ? String(staffId) : undefined,
        customerFirstName: String(customerFirstName),
        customerLastName: customerLastName ? String(customerLastName) : undefined,
        customerEmail: customerEmail ? String(customerEmail) : undefined,
        customerPhone: customerPhone ? String(customerPhone) : undefined,
        notes: notes ? String(notes) : undefined,
      });
      res.status(201).json({ data: { slug, ...created } });
    } catch (err) {
      sendError(res, req, 400, safeClientMessage(err, "Booking failed"));
    }
  },
);

export default router;

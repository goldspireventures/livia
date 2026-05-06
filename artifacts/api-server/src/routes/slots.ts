// Slot engine — used by the booking new-form. Accessed by anyone with
// staff or higher (creating bookings is allowed for staff).
// Access: OWNER+ADMIN+STAFF.

import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { getBusinessById } from "../services/businesses.service";
import { getAvailableSlots } from "../services/slots.service";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

router.get(
  "/businesses/:businessId/slots",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const { serviceId, date, staffId } = req.query;
    if (!serviceId || !date) {
      res.status(400).json({ error: "serviceId and date are required" }); return;
    }
    const biz = await getBusinessById(businessId);
    const slots = await getAvailableSlots({
      businessId,
      serviceId: serviceId as string,
      date: date as string,
      staffId: staffId as string | undefined,
      timezone: biz?.timezone ?? "Europe/London",
    });
    res.json({ date, serviceId, slots });
  },
);

export default router;

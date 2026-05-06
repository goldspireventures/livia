import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { userHasAccessToBusiness, getBusinessById } from "../services/businesses.service";
import { getAvailableSlots } from "../services/slots.service";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

router.get("/businesses/:businessId/slots", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
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
});

export default router;

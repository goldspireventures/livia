import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { userHasAccessToBusiness } from "../services/businesses.service";
import {
  listServices,
  getServiceById,
  createService,
  updateService,
  deactivateService,
} from "../services/services.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

router.get("/businesses/:businessId/services", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
  res.json(await listServices(businessId, isActive));
});

router.post("/businesses/:businessId/services", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const { name, durationMinutes } = req.body;
  if (!name || !durationMinutes) {
    res.status(400).json({ error: "name and durationMinutes are required" }); return;
  }
  const s = await createService(businessId, req.body);
  await logEvent({ type: EventType.SERVICE_CREATED, businessId, userId, entityType: "service", entityId: s.id });
  res.status(201).json(s);
});

router.get("/businesses/:businessId/services/:serviceId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const serviceId = getBizId(req.params.serviceId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const s = await getServiceById(businessId, serviceId);
  if (!s) { res.status(404).json({ error: "Service not found" }); return; }
  res.json(s);
});

router.patch("/businesses/:businessId/services/:serviceId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const serviceId = getBizId(req.params.serviceId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const s = await updateService(businessId, serviceId, req.body);
  if (!s) { res.status(404).json({ error: "Service not found" }); return; }
  await logEvent({ type: EventType.SERVICE_UPDATED, businessId, userId, entityType: "service", entityId: serviceId });
  res.json(s);
});

router.delete("/businesses/:businessId/services/:serviceId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const serviceId = getBizId(req.params.serviceId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const s = await deactivateService(businessId, serviceId);
  if (!s) { res.status(404).json({ error: "Service not found" }); return; }
  await logEvent({ type: EventType.SERVICE_DEACTIVATED, businessId, userId, entityType: "service", entityId: serviceId });
  res.sendStatus(204);
});

export default router;

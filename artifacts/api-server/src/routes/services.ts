import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import {
  listServices,
  getServiceById,
  createService,
  updateService,
  deactivateService,
} from "../services/services.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

// Access: OWNER+ADMIN+STAFF — staff see the catalogue to know what they offer.
router.get(
  "/businesses/:businessId/services",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
    res.json(await listServices(businessId, isActive));
  },
);

// Access: OWNER+ADMIN — pricing is not a staff decision.
router.post(
  "/businesses/:businessId/services",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const { name, durationMinutes } = req.body;
    if (!name || !durationMinutes) {
      sendError(res, req, 400, "name and durationMinutes are required"); return;
    }
    const s = await createService(businessId, req.body);
    await logEvent({ type: EventType.SERVICE_CREATED, businessId, userId, entityType: "service", entityId: s.id });
    res.status(201).json(s);
  },
);

// Access: OWNER+ADMIN+STAFF (read).
router.get(
  "/businesses/:businessId/services/:serviceId",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const serviceId = getBizId(req.params.serviceId);
    const s = await getServiceById(businessId, serviceId);
    if (!s) { sendError(res, req, 404, "Service not found"); return; }
    res.json(s);
  },
);

// Access: OWNER+ADMIN.
router.patch(
  "/businesses/:businessId/services/:serviceId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const serviceId = getBizId(req.params.serviceId);
    const s = await updateService(businessId, serviceId, req.body);
    if (!s) { sendError(res, req, 404, "Service not found"); return; }
    await logEvent({ type: EventType.SERVICE_UPDATED, businessId, userId, entityType: "service", entityId: serviceId });
    res.json(s);
  },
);

// Access: OWNER+ADMIN.
router.delete(
  "/businesses/:businessId/services/:serviceId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const serviceId = getBizId(req.params.serviceId);
    const s = await deactivateService(businessId, serviceId);
    if (!s) { sendError(res, req, 404, "Service not found"); return; }
    await logEvent({ type: EventType.SERVICE_DEACTIVATED, businessId, userId, entityType: "service", entityId: serviceId });
    res.sendStatus(204);
  },
);

export default router;

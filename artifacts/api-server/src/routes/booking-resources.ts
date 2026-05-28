import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import {
  createBookingResource,
  listBookingResources,
  updateBookingResource,
} from "../services/booking-resources.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/resources",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const activeOnly = req.query.active !== "false";
    res.json(await listBookingResources(businessId, activeOnly));
  },
);

router.post(
  "/businesses/:businessId/resources",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const { name, resourceType, capacity, sortOrder } = req.body ?? {};
    if (!name || !resourceType) {
      sendError(res, req, 400, "name and resourceType are required");
      return;
    }
    if (!["room", "equipment", "thermal"].includes(resourceType)) {
      sendError(res, req, 400, "resourceType must be room, equipment, or thermal");
      return;
    }
    const row = await createBookingResource(businessId, {
      name,
      resourceType,
      capacity,
      sortOrder,
    });
    res.status(201).json(row);
  },
);

router.patch(
  "/businesses/:businessId/resources/:resourceId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const resourceId = getBizId(req.params.resourceId);
    const row = await updateBookingResource(businessId, resourceId, req.body ?? {});
    if (!row) {
      sendError(res, req, 404, "Resource not found");
      return;
    }
    res.json(row);
  },
);

export default router;

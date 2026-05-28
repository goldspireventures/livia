import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import {
  bookDayPackage,
  createDayPackage,
  listDayPackages,
} from "../services/day-packages.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/day-packages",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    res.json(await listDayPackages(bizId(req.params.businessId)));
  },
);

router.post(
  "/businesses/:businessId/day-packages",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = bizId(req.params.businessId);
    const { name, description, priceMinor, currency, steps } = req.body ?? {};
    if (!name || !Array.isArray(steps) || steps.length === 0) {
      sendError(res, req, 400, "name and steps[] are required");
      return;
    }
    res.status(201).json(await createDayPackage(businessId, { name, description, priceMinor, currency, steps }));
  },
);

router.post(
  "/businesses/:businessId/day-packages/:packageId/book",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = bizId(req.params.businessId);
    const packageId = bizId(req.params.packageId);
    const { customerId, itineraryStartAt, staffId } = req.body ?? {};
    if (!customerId || !itineraryStartAt) {
      sendError(res, req, 400, "customerId and itineraryStartAt are required");
      return;
    }
    try {
      res.status(201).json(
        await bookDayPackage(businessId, {
          packageId,
          customerId,
          itineraryStartAt,
          staffId,
          channelType: "WEB",
        }),
      );
    } catch (e) {
      const err = e as Error;
      if (err.message === "RESOURCE_AT_CAPACITY" || err.message === "SLOT_CONFLICT") {
        sendError(res, req, 409, err.message);
        return;
      }
      throw e;
    }
  },
);

export default router;

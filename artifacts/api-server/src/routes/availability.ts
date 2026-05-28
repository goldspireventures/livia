import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import {
  listAvailabilityRules,
  setAvailabilityRules,
  listTimeOff,
  createTimeOff,
  deleteTimeOff,
} from "../services/availability.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

// Access: OWNER+ADMIN+STAFF (read).
router.get(
  "/businesses/:businessId/availability",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const staffId = req.query.staffId as string | undefined;
    res.json(await listAvailabilityRules(businessId, staffId));
  },
);

// Access: OWNER+ADMIN — schedules are an operations decision.
// Future: STAFF should edit their own row (gated post-Closed-Beta).
router.put(
  "/businesses/:businessId/availability",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const { rules, staffId } = req.body;
    if (!Array.isArray(rules)) {
      sendError(res, req, 400, "rules must be an array"); return;
    }
    const updated = await setAvailabilityRules(businessId, rules, staffId);
    await logEvent({ type: EventType.AVAILABILITY_UPDATED, businessId, userId });
    res.json(updated);
  },
);

// Access: OWNER+ADMIN+STAFF (read).
router.get(
  "/businesses/:businessId/time-off",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const { staffId, from, to } = req.query;
    res.json(await listTimeOff(businessId, {
      staffId: staffId as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
    }));
  },
);

// Access: OWNER+ADMIN.
router.post(
  "/businesses/:businessId/time-off",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const { staffId, startsAt, endsAt, reason } = req.body;
    if (!startsAt || !endsAt) {
      sendError(res, req, 400, "startsAt and endsAt are required"); return;
    }
    const t = await createTimeOff(businessId, { staffId, startsAt, endsAt, reason });
    await logEvent({ type: EventType.TIME_OFF_CREATED, businessId, userId, entityType: "time_off", entityId: t.id });
    res.status(201).json(t);
  },
);

// Access: OWNER+ADMIN.
router.delete(
  "/businesses/:businessId/time-off/:timeOffId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const timeOffId = getBizId(req.params.timeOffId);
    const t = await deleteTimeOff(businessId, timeOffId);
    if (!t) { sendError(res, req, 404, "Time off not found"); return; }
    await logEvent({ type: EventType.TIME_OFF_REMOVED, businessId, userId, entityType: "time_off", entityId: timeOffId });
    res.sendStatus(204);
  },
);

export default router;

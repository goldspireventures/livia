import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { userHasAccessToBusiness } from "../services/businesses.service";
import {
  listAvailabilityRules,
  setAvailabilityRules,
  listTimeOff,
  createTimeOff,
  deleteTimeOff,
} from "../services/availability.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

router.get("/businesses/:businessId/availability", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const staffId = req.query.staffId as string | undefined;
  res.json(await listAvailabilityRules(businessId, staffId));
});

router.put("/businesses/:businessId/availability", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const { rules, staffId } = req.body;
  if (!Array.isArray(rules)) {
    res.status(400).json({ error: "rules must be an array" }); return;
  }
  const updated = await setAvailabilityRules(businessId, rules, staffId);
  await logEvent({ type: EventType.AVAILABILITY_UPDATED, businessId, userId });
  res.json(updated);
});

router.get("/businesses/:businessId/time-off", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const { staffId, from, to } = req.query;
  res.json(await listTimeOff(businessId, {
    staffId: staffId as string | undefined,
    from: from as string | undefined,
    to: to as string | undefined,
  }));
});

router.post("/businesses/:businessId/time-off", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const { staffId, startsAt, endsAt, reason } = req.body;
  if (!startsAt || !endsAt) {
    res.status(400).json({ error: "startsAt and endsAt are required" }); return;
  }
  const t = await createTimeOff(businessId, { staffId, startsAt, endsAt, reason });
  await logEvent({ type: EventType.TIME_OFF_CREATED, businessId, userId, entityType: "time_off", entityId: t.id });
  res.status(201).json(t);
});

router.delete("/businesses/:businessId/time-off/:timeOffId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const timeOffId = getBizId(req.params.timeOffId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const t = await deleteTimeOff(businessId, timeOffId);
  if (!t) { res.status(404).json({ error: "Time off not found" }); return; }
  await logEvent({ type: EventType.TIME_OFF_REMOVED, businessId, userId, entityType: "time_off", entityId: timeOffId });
  res.sendStatus(204);
});

export default router;

import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { userHasAccessToBusiness } from "../services/businesses.service";
import {
  listStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deactivateStaff,
  getStaffServicesForStaff,
  setStaffServices,
} from "../services/staff.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";

const router: IRouter = Router();

const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

router.get("/businesses/:businessId/staff", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
  const staff = await listStaff(businessId, isActive);
  res.json(staff);
});

router.post("/businesses/:businessId/staff", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const { firstName, displayName } = req.body;
  if (!firstName || !displayName) {
    res.status(400).json({ error: "firstName and displayName are required" }); return;
  }
  const s = await createStaff(businessId, req.body);
  await logEvent({ type: EventType.STAFF_CREATED, businessId, userId, entityType: "staff", entityId: s.id });
  res.status(201).json(s);
});

router.get("/businesses/:businessId/staff/:staffId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const staffId = getBizId(req.params.staffId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const s = await getStaffById(businessId, staffId);
  if (!s) { res.status(404).json({ error: "Staff not found" }); return; }
  res.json(s);
});

router.patch("/businesses/:businessId/staff/:staffId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const staffId = getBizId(req.params.staffId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const updated = await updateStaff(businessId, staffId, req.body);
  if (!updated) { res.status(404).json({ error: "Staff not found" }); return; }
  await logEvent({ type: EventType.STAFF_UPDATED, businessId, userId, entityType: "staff", entityId: staffId });
  res.json(updated);
});

router.delete("/businesses/:businessId/staff/:staffId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const staffId = getBizId(req.params.staffId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const s = await deactivateStaff(businessId, staffId);
  if (!s) { res.status(404).json({ error: "Staff not found" }); return; }
  await logEvent({ type: EventType.STAFF_DEACTIVATED, businessId, userId, entityType: "staff", entityId: staffId });
  res.sendStatus(204);
});

router.get("/businesses/:businessId/staff/:staffId/services", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const staffId = getBizId(req.params.staffId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const services = await getStaffServicesForStaff(businessId, staffId);
  res.json(services);
});

router.put("/businesses/:businessId/staff/:staffId/services", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const staffId = getBizId(req.params.staffId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const { serviceIds } = req.body;
  if (!Array.isArray(serviceIds)) {
    res.status(400).json({ error: "serviceIds must be an array" }); return;
  }
  await setStaffServices(staffId, serviceIds);
  const services = await getStaffServicesForStaff(businessId, staffId);
  res.json(services);
});

export default router;

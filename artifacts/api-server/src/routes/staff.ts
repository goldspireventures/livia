import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
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

// Access: OWNER+ADMIN+STAFF — staff need the roster to see colleagues' shifts.
router.get(
  "/businesses/:businessId/staff",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
    const staff = await listStaff(businessId, isActive);
    res.json(staff);
  },
);

// Access: OWNER+ADMIN — staff can't add headcount.
router.post(
  "/businesses/:businessId/staff",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const { firstName, displayName } = req.body;
    if (!firstName || !displayName) {
      res.status(400).json({ error: "firstName and displayName are required" }); return;
    }
    const s = await createStaff(businessId, req.body);
    await logEvent({ type: EventType.STAFF_CREATED, businessId, userId, entityType: "staff", entityId: s.id });
    res.status(201).json(s);
  },
);

// Access: OWNER+ADMIN+STAFF (read).
router.get(
  "/businesses/:businessId/staff/:staffId",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const staffId = getBizId(req.params.staffId);
    const s = await getStaffById(businessId, staffId);
    if (!s) { res.status(404).json({ error: "Staff not found" }); return; }
    res.json(s);
  },
);

// Access: OWNER+ADMIN — staff edits are an admin action.
// Future refinement: allow STAFF to edit their own row, gated post-Closed-Beta.
router.patch(
  "/businesses/:businessId/staff/:staffId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const staffId = getBizId(req.params.staffId);
    const updated = await updateStaff(businessId, staffId, req.body);
    if (!updated) { res.status(404).json({ error: "Staff not found" }); return; }
    await logEvent({ type: EventType.STAFF_UPDATED, businessId, userId, entityType: "staff", entityId: staffId });
    res.json(updated);
  },
);

// Access: OWNER+ADMIN.
router.delete(
  "/businesses/:businessId/staff/:staffId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const staffId = getBizId(req.params.staffId);
    const s = await deactivateStaff(businessId, staffId);
    if (!s) { res.status(404).json({ error: "Staff not found" }); return; }
    await logEvent({ type: EventType.STAFF_DEACTIVATED, businessId, userId, entityType: "staff", entityId: staffId });
    res.sendStatus(204);
  },
);

// Access: OWNER+ADMIN+STAFF (read assignment).
router.get(
  "/businesses/:businessId/staff/:staffId/services",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const staffId = getBizId(req.params.staffId);
    const services = await getStaffServicesForStaff(businessId, staffId);
    res.json(services);
  },
);

// Access: OWNER+ADMIN — assigning services to a staff is an admin action.
router.put(
  "/businesses/:businessId/staff/:staffId/services",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const staffId = getBizId(req.params.staffId);
    const { serviceIds } = req.body;
    if (!Array.isArray(serviceIds)) {
      res.status(400).json({ error: "serviceIds must be an array" }); return;
    }
    await setStaffServices(staffId, serviceIds);
    const services = await getStaffServicesForStaff(businessId, staffId);
    res.json(services);
  },
);

export default router;

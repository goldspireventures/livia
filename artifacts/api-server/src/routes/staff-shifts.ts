import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import {
  createStaffShift,
  deleteStaffShift,
  listStaffShifts,
} from "../services/staff-shifts.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/staff-shifts",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const { staffId, from, to } = req.query;
    const shifts = await listStaffShifts(bizId(req.params.businessId), {
      staffId: staffId as string | undefined,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });
    res.json(shifts);
  },
);

router.post(
  "/businesses/:businessId/staff-shifts",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const { staffId, startsAt, endsAt, label } = req.body;
    if (!staffId || !startsAt || !endsAt) {
      sendError(res, req, 400, "staffId, startsAt, endsAt required");
      return;
    }
    const row = await createStaffShift(bizId(req.params.businessId), {
      staffId,
      startsAt,
      endsAt,
      label,
    });
    res.status(201).json(row);
  },
);

router.delete(
  "/businesses/:businessId/staff-shifts/:shiftId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const row = await deleteStaffShift(
      bizId(req.params.businessId),
      bizId(req.params.shiftId),
    );
    if (!row) {
      sendError(res, req, 404, "Shift not found");
      return;
    }
    res.status(204).send();
  },
);

export default router;

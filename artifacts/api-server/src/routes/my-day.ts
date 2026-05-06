// My Day — staff-scoped read surface.
// Access: OWNER+ADMIN+STAFF. STAFF is auto-scoped to their own staff row;
// OWNER/ADMIN can pass `?as=staff:<id>` (handled in requireRole) to
// preview a specific staff persona.

import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getRoleContext } from "../lib/auth";
import { getMyDay } from "../services/my-day.service";

const router: IRouter = Router();
const getBizId = (param: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

router.get(
  "/businesses/:businessId/my-day",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const ctx = getRoleContext(req);

    // Owner/admin can also pass an explicit `staffId` query param without
    // the persona switcher, e.g. for an "audit this staff member" view.
    const explicit =
      typeof req.query.staffId === "string" ? req.query.staffId : null;

    const staffId =
      ctx.effectiveRole === "STAFF" ? ctx.actingStaffId : explicit;

    const data = await getMyDay(businessId, staffId);
    res.json({
      ...data,
      role: ctx.role,
      effectiveRole: ctx.effectiveRole,
    });
  },
);

export default router;

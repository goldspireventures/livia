// Owner cockpit dashboard. Revenue + cross-staff aggregates → not for STAFF.
// Access: OWNER+ADMIN.

import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { getDashboardSummary, getActivityFeed } from "../services/dashboard.service";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

router.get(
  "/businesses/:businessId/dashboard",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    res.json(await getDashboardSummary(businessId));
  },
);

router.get(
  "/businesses/:businessId/activity",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    res.json(await getActivityFeed(businessId, limit));
  },
);

export default router;

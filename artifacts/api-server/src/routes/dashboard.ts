// Owner cockpit dashboard. Revenue + cross-staff aggregates → not for STAFF.
// Access: OWNER+ADMIN.

import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { getDashboardSummary, getActivityFeed } from "../services/dashboard.service";
import { getPublicIntakeFeed } from "../services/public-intake.service";
import { getTodayVerticalInsights } from "../services/today-vertical-insights.service";
import { sendError } from "../lib/http-errors";

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

router.get(
  "/businesses/:businessId/today-vertical-insights",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const payload = await getTodayVerticalInsights(businessId);
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(payload);
  },
);

router.get(
  "/businesses/:businessId/public-intake",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    res.json(await getPublicIntakeFeed(businessId));
  },
);

export default router;

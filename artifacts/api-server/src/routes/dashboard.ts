import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { userHasAccessToBusiness } from "../services/businesses.service";
import { getDashboardSummary, getActivityFeed } from "../services/dashboard.service";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

router.get("/businesses/:businessId/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  res.json(await getDashboardSummary(businessId));
});

router.get("/businesses/:businessId/activity", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  res.json(await getActivityFeed(businessId, limit));
});

export default router;

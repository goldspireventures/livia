import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { userHasAccessToBusiness } from "../services/businesses.service";
import { db, featureFlagsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

router.get("/businesses/:businessId/feature-flags", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const flags = await db
    .select()
    .from(featureFlagsTable)
    .where(eq(featureFlagsTable.businessId, businessId));
  res.json(flags);
});

export default router;

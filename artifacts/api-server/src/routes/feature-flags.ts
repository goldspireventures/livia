// Access: OWNER+ADMIN+STAFF (read; flags drive UI shape for everyone).
import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { db, featureFlagsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

router.get(
  "/businesses/:businessId/feature-flags",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const flags = await db
      .select()
      .from(featureFlagsTable)
      .where(eq(featureFlagsTable.businessId, businessId));
    res.json(flags);
  },
);

export default router;

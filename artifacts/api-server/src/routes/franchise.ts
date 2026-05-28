import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import { db, franchiseLinksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { appendHumanAudit } from "../lib/audit";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.patch(
  "/businesses/:businessId/franchise-links/:linkId/policy",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const franchisorBusinessId = bizId(req.params.businessId);
    const linkId = bizId(req.params.linkId);
    const { policyPackOverride } = req.body ?? {};
    if (!policyPackOverride || typeof policyPackOverride !== "object") {
      sendError(res, req, 400, "policyPackOverride object required");
      return;
    }
    const [row] = await db
      .update(franchiseLinksTable)
      .set({ policyPackOverride, updatedAt: new Date() })
      .where(
        and(
          eq(franchiseLinksTable.id, linkId),
          eq(franchiseLinksTable.franchisorBusinessId, franchisorBusinessId),
        ),
      )
      .returning();
    if (!row) {
      sendError(res, req, 404, "Franchise link not found");
      return;
    }
    await appendHumanAudit(
      franchisorBusinessId,
      userId,
      "franchise.policy.updated",
      "franchise_link",
      linkId,
      { franchiseeBusinessId: row.franchiseeBusinessId },
    );
    res.json(row);
  },
);

export default router;

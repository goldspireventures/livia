import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import {
  getLifecycleForBusiness,
  getLifecycleForUser,
  listOwnershipCandidates,
} from "../services/lifecycle.service";
import {
  transferBusinessOwnership,
  type OutgoingOwnerDisposition,
} from "../services/ownership-transfer.service";
import { logger } from "../lib/logger";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (param: string | string[]) => (Array.isArray(param) ? param[0] : param);

router.get("/me/lifecycle", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  res.json(await getLifecycleForUser(userId));
});

router.get(
  "/businesses/:businessId/lifecycle",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    try {
      res.json(await getLifecycleForBusiness(userId, businessId));
    } catch {
      sendError(res, req, 404, "Business not found");
    }
  },
);

router.get(
  "/businesses/:businessId/ownership-candidates",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    res.json({ candidates: await listOwnershipCandidates(businessId, userId) });
  },
);

router.post(
  "/businesses/:businessId/transfer-ownership",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const actingUserId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const { incomingUserId, outgoingDisposition } = req.body ?? {};

    if (!incomingUserId || typeof incomingUserId !== "string") {
      sendError(res, req, 400, "incomingUserId is required");
      return;
    }

    const disposition: OutgoingOwnerDisposition =
      outgoingDisposition === "ADMIN" || outgoingDisposition === "REVOKE"
        ? outgoingDisposition
        : "STAFF";

    try {
      const result = await transferBusinessOwnership({
        businessId,
        actingUserId,
        incomingUserId,
        outgoingDisposition: disposition,
      });
      res.json(result);
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === "NOT_OWNER") {
        sendError(res, req, 403, e.message, { code: e.code });
        return;
      }
      if (e.code === "INCOMING_NOT_MEMBER" || e.code === "SAME_USER") {
        sendError(res, req, 400, e.message, { code: e.code });
        return;
      }
      logger.error({ err, businessId }, "transfer-ownership failed");
      sendError(res, req, 500, e.message ?? "Transfer failed");
    }
  },
);

export default router;

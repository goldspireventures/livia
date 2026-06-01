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
import { getBusinessById } from "../services/businesses.service";
import { createInvitation, type InvitableRole } from "../services/invitations.service";

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
    res.json(await listOwnershipCandidates(businessId, userId));
  },
);

/** Owner-only — succession invite (separate from Team → Invite on Staff page). */
router.post(
  "/businesses/:businessId/ownership-invitations",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const { email, role } = req.body ?? {};

    if (!email || typeof email !== "string") {
      sendError(res, req, 400, "email is required");
      return;
    }
    const inviteRole: InvitableRole = role === "STAFF" ? "STAFF" : "ADMIN";

    const biz = await getBusinessById(businessId);
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }

    try {
      const inv = await createInvitation({
        businessId,
        businessName: biz.name,
        email: email.trim().toLowerCase(),
        role: inviteRole,
        deskRole: inviteRole === "ADMIN" ? "manager" : undefined,
        inviterUserId: userId,
        successionIntent: true,
      });
      res.status(201).json(inv);
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === "CLERK_NOT_CONFIGURED") {
        sendError(res, req, 503, e.message, { code: e.code });
        return;
      }
      logger.error({ err, businessId, email }, "ownership-invitation failed");
      sendError(res, req, 502, e.message ?? "Could not create invitation", {
        code: "INVITATION_FAILED",
      });
    }
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
      if (
        e.code === "INCOMING_NOT_MEMBER" ||
        e.code === "INCOMING_NOT_ELIGIBLE" ||
        e.code === "SAME_USER"
      ) {
        sendError(res, req, 400, e.message, { code: e.code });
        return;
      }
      logger.error({ err, businessId }, "transfer-ownership failed");
      sendError(res, req, 500, e.message ?? "Transfer failed");
    }
  },
);

export default router;

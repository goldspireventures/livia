// Invitations: owner/admin invites a teammate by email. Implementation
// notes live in invitations.service.ts.
// Access: OWNER+ADMIN only.

import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import { getBusinessById } from "../services/businesses.service";
import {
  createInvitation,
  acceptPendingInvitations,
  type InvitableRole,
} from "../services/invitations.service";
import { logger } from "../lib/logger";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (param: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

router.post(
  "/businesses/:businessId/invitations",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const { email, role, deskRole, redirectUrl } = req.body ?? {};

    if (!email || typeof email !== "string") {
      sendError(res, req, 400, "email is required");
      return;
    }
    if (role !== "ADMIN" && role !== "STAFF") {
      sendError(res, req, 400, "role must be 'ADMIN' or 'STAFF'");
      return;
    }

    const biz = await getBusinessById(businessId);
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }

    try {
      const desk =
        deskRole === "reception" || deskRole === "manager" ? deskRole : undefined;
      const inv = await createInvitation({
        businessId,
        businessName: biz.name,
        email: email.trim().toLowerCase(),
        role: role as InvitableRole,
        deskRole: role === "ADMIN" ? desk ?? "manager" : desk,
        inviterUserId: userId,
        redirectUrl,
      });
      res.status(201).json(inv);
    } catch (err) {
      const e = err as Error & { code?: string; status?: number };
      if (e.code === "CLERK_NOT_CONFIGURED") {
        sendError(res, req, 503, e.message, { code: e.code });
        return;
      }
      logger.error({ err, businessId, email }, "createInvitation failed");
      sendError(res, req, 502, e.message ?? "Could not create invitation", { code: "INVITATION_FAILED", });
    }
  },
);

// Called by the dashboard right after Clerk sign-in to materialise any
// pending memberships from publicMetadata. Idempotent + safe to call
// repeatedly.
router.post(
  "/me/accept-invitations",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const result = await acceptPendingInvitations(userId);
    res.json(result);
  },
);

export default router;

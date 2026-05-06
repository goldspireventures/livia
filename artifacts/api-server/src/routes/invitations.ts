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
    const { email, role, redirectUrl } = req.body ?? {};

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "email is required" });
      return;
    }
    if (role !== "ADMIN" && role !== "STAFF") {
      res.status(400).json({ error: "role must be 'ADMIN' or 'STAFF'" });
      return;
    }

    const biz = await getBusinessById(businessId);
    if (!biz) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    try {
      const inv = await createInvitation({
        businessId,
        businessName: biz.name,
        email: email.trim().toLowerCase(),
        role: role as InvitableRole,
        inviterUserId: userId,
        redirectUrl,
      });
      res.status(201).json(inv);
    } catch (err) {
      const e = err as Error & { code?: string; status?: number };
      if (e.code === "CLERK_NOT_CONFIGURED") {
        res.status(503).json({ error: e.message, code: e.code });
        return;
      }
      logger.error({ err, businessId, email }, "createInvitation failed");
      res.status(502).json({
        error: e.message ?? "Could not create invitation",
        code: "INVITATION_FAILED",
      });
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

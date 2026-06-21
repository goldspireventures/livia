import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import {
  getHostDashboardSummary,
  linkHostRenter,
  linkHostRenterBySlug,
  listHostRenters,
  updateHostRenterRentStatus,
  endHostRenterLink,
} from "../services/chair-rental.service";
import { appendHumanAudit } from "../lib/audit";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/host/dashboard",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const hostBusinessId = bizId(req.params.businessId);
    res.json(await getHostDashboardSummary(hostBusinessId));
  },
);

router.get(
  "/businesses/:businessId/host/renters",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    res.json(await listHostRenters(bizId(req.params.businessId)));
  },
);

router.post(
  "/businesses/:businessId/host/renters/invite",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const hostBusinessId = bizId(req.params.businessId);
    const { renterSlug, chairLabel, weeklyRentMinor, currency } = req.body ?? {};
    if (!renterSlug || !chairLabel) {
      sendError(res, req, 400, "renterSlug and chairLabel required");
      return;
    }
    const row = await linkHostRenterBySlug(hostBusinessId, {
      renterSlug: String(renterSlug),
      chairLabel: String(chairLabel),
      weeklyRentMinor: typeof weeklyRentMinor === "number" ? weeklyRentMinor : undefined,
      currency: typeof currency === "string" ? currency : undefined,
    });
    if (!row) {
      sendError(res, req, 400, "Could not link renter — check slug exists and is not the host shop");
      return;
    }
    await appendHumanAudit(
      hostBusinessId,
      userId,
      "host.renter.invited",
      "host_renter_link",
      row.id,
      { renterSlug, chairLabel },
    );
    res.status(201).json(row);
  },
);

router.post(
  "/businesses/:businessId/host/renters",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const hostBusinessId = bizId(req.params.businessId);
    const { renterBusinessId, chairLabel, weeklyRentMinor, currency } = req.body;
    if (!renterBusinessId || !chairLabel) {
      sendError(res, req, 400, "renterBusinessId and chairLabel required");
      return;
    }
    const row = await linkHostRenter(hostBusinessId, {
      renterBusinessId,
      chairLabel,
      weeklyRentMinor,
      currency,
    });
    if (!row) {
      sendError(res, req, 400, "Could not link renter");
      return;
    }
    await appendHumanAudit(
      hostBusinessId,
      userId,
      "host.renter.linked",
      "host_renter_link",
      row.id,
      { renterBusinessId, chairLabel },
    );
    res.status(201).json(row);
  },
);

router.patch(
  "/businesses/:businessId/host/renters/:linkId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const rentStatus = req.body.rentStatus as "due" | "paid" | "waived";
    if (!["due", "paid", "waived"].includes(rentStatus)) {
      sendError(res, req, 400, "Invalid rentStatus");
      return;
    }
    const row = await updateHostRenterRentStatus(
      bizId(req.params.businessId),
      bizId(req.params.linkId),
      rentStatus,
    );
    if (!row) {
      sendError(res, req, 404, "Link not found");
      return;
    }
    res.json(row);
  },
);

router.post(
  "/businesses/:businessId/host/renters/:linkId/end",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const hostBusinessId = bizId(req.params.businessId);
    const linkId = bizId(req.params.linkId);
    const result = await endHostRenterLink(hostBusinessId, linkId);
    if (!result) {
      sendError(res, req, 404, "Active link not found");
      return;
    }
    await appendHumanAudit(hostBusinessId, userId, "host.renter.ended", "host_renter_link", linkId, {
      renterBusinessId: result.portability.renterBusinessId,
      customerCount: result.portability.customerCount,
    });
    res.json(result);
  },
);

export default router;

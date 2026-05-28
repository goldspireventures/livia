import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import {
  proposeTimeOff,
  approveTimeOffRequest,
  getTimeOffRequest,
  listTimeOffRequests,
} from "../services/time-off.service";
import { getResolvedTenant } from "../lib/tenant-context";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (param: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

router.get(
  "/businesses/:businessId/time-off-requests",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const staffId = typeof req.query.staffId === "string" ? req.query.staffId : undefined;
    res.json(await listTimeOffRequests(businessId, { staffId }));
  },
);

router.post(
  "/businesses/:businessId/time-off-requests",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const tenant = getResolvedTenant(req);
    const { staffId, kind, startAt, endAt, reason } = req.body ?? {};
    if (!staffId || !startAt || !endAt) {
      sendError(res, req, 400, "staffId, startAt, and endAt are required");
      return;
    }
    const row = await proposeTimeOff({
      businessId,
      staffId,
      requestedByMembershipId: tenant.membershipId,
      kind: kind ?? "annual_leave",
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      reason,
    });
    res.status(201).json(row);
  },
);

router.post(
  "/businesses/:businessId/time-off-requests/:requestId/approve",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const requestId = getBizId(req.params.requestId);
    getUserId(req);
    const tenant = getResolvedTenant(req);

    const existing = await getTimeOffRequest(businessId, requestId);
    if (!existing) {
      sendError(res, req, 404, "Time-off request not found");
      return;
    }

    const updated = await approveTimeOffRequest(businessId, requestId, {
      decidedByMembershipId: tenant.membershipId,
      decisionNote: req.body?.decisionNote,
    });
    res.json(updated);
  },
);

export default router;

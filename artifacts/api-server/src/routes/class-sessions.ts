import { Router, type IRouter } from "express";
import { withBusinessFeature } from "../lib/wedge-api-gate";
import {
  createClassSession,
  enrollInClass,
  listClassSessions,
  listSessionRoster,
} from "../services/class-sessions.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/class-sessions",
  ...withBusinessFeature("class-sessions", "STAFF", async (req, res) => {
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    res.json(await listClassSessions(bizId(req.params.businessId), { from, to }));
  }),
);

router.post(
  "/businesses/:businessId/class-sessions",
  ...withBusinessFeature("class-sessions", "ADMIN", async (req, res) => {
    const { title, startsAt, endsAt, capacity, waitlistCapacity, serviceId, staffId } = req.body;
    if (!title || !startsAt || !endsAt) {
      sendError(res, req, 400, "title, startsAt, endsAt required");
      return;
    }
    const row = await createClassSession(bizId(req.params.businessId), {
      title,
      startsAt,
      endsAt,
      capacity,
      waitlistCapacity,
      serviceId,
      staffId,
    });
    res.status(201).json(row);
  }),
);

router.post(
  "/businesses/:businessId/class-sessions/:sessionId/enroll",
  ...withBusinessFeature("class-sessions", "STAFF", async (req, res) => {
    const customerId = req.body?.customerId;
    if (!customerId) {
      sendError(res, req, 400, "customerId required");
      return;
    }
    const result = await enrollInClass(
      bizId(req.params.businessId),
      bizId(req.params.sessionId),
      customerId,
    );
    if ("error" in result) {
      sendError(res, req, result.error === "full" ? 409 : 404, result.error ?? "Request failed");
      return;
    }
    res.status(201).json(result.enrollment);
  }),
);

router.get(
  "/businesses/:businessId/class-sessions/:sessionId/roster",
  ...withBusinessFeature("class-sessions", "STAFF", async (req, res) => {
    const roster = await listSessionRoster(
      bizId(req.params.businessId),
      bizId(req.params.sessionId),
    );
    if (!roster) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(roster);
  }),
);

export default router;

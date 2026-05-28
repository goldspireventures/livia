import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import {
  bookCareSeriesSession,
  createCareSeries,
  listCareSeries,
  suggestNextSessionStart,
} from "../services/care-series.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/care-series",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = bizId(req.params.businessId);
    const customerId = typeof req.query.customerId === "string" ? req.query.customerId : undefined;
    res.json(await listCareSeries(businessId, customerId));
  },
);

router.post(
  "/businesses/:businessId/care-series",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = bizId(req.params.businessId);
    const body = req.body ?? {};
    if (!body.customerId || !body.name || !body.serviceId || !body.sessionsTotal) {
      sendError(res, req, 400, "customerId, name, serviceId, sessionsTotal required");
      return;
    }
    const row = await createCareSeries(businessId, body);
    res.status(201).json(row);
  },
);

router.post(
  "/businesses/:businessId/care-series/:seriesId/book-session",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = bizId(req.params.businessId);
    const seriesId = bizId(req.params.seriesId);
    const { sessionNumber, startAt } = req.body ?? {};
    if (!sessionNumber || !startAt) {
      sendError(res, req, 400, "sessionNumber and startAt required");
      return;
    }
    try {
      res.status(201).json(
        await bookCareSeriesSession(businessId, seriesId, {
          sessionNumber: Number(sessionNumber),
          startAt,
        }),
      );
    } catch (e) {
      const err = e as Error;
      if (err.message === "SLOT_CONFLICT" || err.message === "SESSION_ALREADY_BOOKED") {
        sendError(res, req, 409, err.message);
        return;
      }
      throw e;
    }
  },
);

router.get(
  "/businesses/:businessId/care-series/:seriesId/next-suggestion",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = bizId(req.params.businessId);
    const seriesId = bizId(req.params.seriesId);
    const rows = await listCareSeries(businessId);
    const series = rows.find((r) => r.id === seriesId);
    if (!series) {
      sendError(res, req, 404, "Series not found");
      return;
    }
    const next = suggestNextSessionStart(series);
    res.json({ suggestedStartAt: next?.toISOString() ?? null });
  },
);

export default router;

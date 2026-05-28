import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import {
  listMedspaProcedures,
  listPendingConsents,
  listIntakesAwaitingReview,
  signConsentRecord,
  upsertMedicalIntake,
  markIntakeReviewed,
} from "../services/medspa.service";
import {
  joinSlotWaitlist,
  listActiveWaitlist,
} from "../services/waitlist.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get("/businesses/:businessId/medspa/procedures", requireAuth, requireRole("STAFF"), (_req, res) => {
  res.json({ data: listMedspaProcedures() });
});

router.get(
  "/businesses/:businessId/medspa/consents/pending",
  requireAuth,
  requireRole("STAFF"),
  async (req, res) => {
    res.json({ data: await listPendingConsents(bizId(req.params.businessId)) });
  },
);

router.patch(
  "/businesses/:businessId/medspa/consents/:consentId/sign",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const signatureName = String(req.body?.signatureName ?? "").trim();
    if (!signatureName) {
      sendError(res, req, 400, "signatureName required");
      return;
    }
    const row = await signConsentRecord({
      businessId: bizId(req.params.businessId),
      consentId: bizId(req.params.consentId),
      signatureName,
      bookingId: typeof req.body?.bookingId === "string" ? req.body.bookingId : undefined,
    });
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  },
);

router.get(
  "/businesses/:businessId/medspa/intakes/review-queue",
  requireAuth,
  requireRole("STAFF"),
  async (req, res) => {
    res.json({ data: await listIntakesAwaitingReview(bizId(req.params.businessId)) });
  },
);

router.post(
  "/businesses/:businessId/medspa/intakes",
  requireAuth,
  requireRole("STAFF"),
  async (req, res) => {
    const { customerId, bookingId, allergies, medications, conditions, priorProcedures, notes, submit } =
      req.body ?? {};
    if (!customerId) {
      sendError(res, req, 400, "customerId required");
      return;
    }
    const row = await upsertMedicalIntake({
      businessId: bizId(req.params.businessId),
      customerId: String(customerId),
      bookingId: bookingId ? String(bookingId) : undefined,
      allergies,
      medications,
      conditions,
      priorProcedures,
      notes,
      submit: Boolean(submit),
    });
    res.status(201).json(row);
  },
);

router.patch(
  "/businesses/:businessId/medspa/intakes/:intakeId/reviewed",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const row = await markIntakeReviewed(
      bizId(req.params.businessId),
      bizId(req.params.intakeId),
    );
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  },
);

router.get(
  "/businesses/:businessId/waitlist",
  requireAuth,
  requireRole("STAFF"),
  async (req, res) => {
    res.json({ data: await listActiveWaitlist(bizId(req.params.businessId)) });
  },
);

router.post(
  "/businesses/:businessId/waitlist",
  requireAuth,
  requireRole("STAFF"),
  async (req, res) => {
    const row = await joinSlotWaitlist({
      businessId: bizId(req.params.businessId),
      ...req.body,
    });
    res.status(201).json(row);
  },
);

export default router;

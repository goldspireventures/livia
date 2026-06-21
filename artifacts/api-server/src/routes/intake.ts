import { Router, type IRouter } from "express";
import { withBusinessFeature } from "../lib/wedge-api-gate";
import {
  listIntakesAwaitingReview,
  markIntakeReviewed,
  upsertMedicalIntake,
} from "../services/medspa.service";
import { intakeFormTitleForVertical, intakePromptForVertical } from "@workspace/policy";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

import { sendError } from "../lib/http-errors";

const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/intakes/config",
  ...withBusinessFeature("intake_forms", "STAFF", async (req, res) => {
    const businessId = bizId(req.params.businessId);
    const [biz] = await db
      .select({ vertical: businessesTable.vertical })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);
    res.json({
      title: intakeFormTitleForVertical(biz?.vertical),
      prompt: intakePromptForVertical(biz?.vertical),
      vertical: biz?.vertical ?? null,
    });
  }),
);

router.get(
  "/businesses/:businessId/intakes/review-queue",
  ...withBusinessFeature("intake_forms", "STAFF", async (req, res) => {
    res.json({ data: await listIntakesAwaitingReview(bizId(req.params.businessId)) });
  }),
);

router.post(
  "/businesses/:businessId/intakes",
  ...withBusinessFeature("intake_forms", "STAFF", async (req, res) => {
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
      submit: !!submit,
    });
    res.status(201).json(row);
  }),
);

router.patch(
  "/businesses/:businessId/intakes/:intakeId/reviewed",
  ...withBusinessFeature("intake_forms", "ADMIN", async (req, res) => {
    const row = await markIntakeReviewed(bizId(req.params.businessId), bizId(req.params.intakeId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

export default router;

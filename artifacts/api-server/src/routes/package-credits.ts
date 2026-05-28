import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import {
  burnPackageCredit,
  grantPackageCredits,
  listPackageCredits,
} from "../services/package-credits.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/package-credits",
  requireAuth,
  requireRole("STAFF"),
  async (req, res) => {
    const customerId =
      typeof req.query.customerId === "string" ? req.query.customerId : undefined;
    res.json(await listPackageCredits(bizId(req.params.businessId), customerId));
  },
);

router.post(
  "/businesses/:businessId/package-credits",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const { customerId, packageName, creditsTotal, expiresAt } = req.body ?? {};
    if (!customerId || !packageName || !creditsTotal) {
      sendError(res, req, 400, "customerId, packageName, creditsTotal required");
      return;
    }
    const row = await grantPackageCredits(bizId(req.params.businessId), {
      customerId,
      packageName,
      creditsTotal: Number(creditsTotal),
      expiresAt,
    });
    res.status(201).json(row);
  },
);

router.post(
  "/businesses/:businessId/package-credits/:ledgerId/burn",
  requireAuth,
  requireRole("STAFF"),
  async (req, res) => {
    const result = await burnPackageCredit(
      bizId(req.params.businessId),
      bizId(req.params.ledgerId),
      Number(req.body?.amount ?? 1),
    );
    if ("error" in result) {
      sendError(res, req, 409, result.error ?? "Request failed");
      return;
    }
    res.json(result.ledger);
  },
);

export default router;

import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { importBooksyCsv } from "../services/booksy-import.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.post(
  "/businesses/:businessId/import/booksy-csv",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const csv =
      typeof req.body?.csv === "string"
        ? req.body.csv
        : typeof req.body === "string"
          ? req.body
          : "";
    if (!csv.trim()) {
      sendError(res, req, 400, "csv text required in body.csv");
      return;
    }
    res.json(await importBooksyCsv(bizId(req.params.businessId), csv));
  },
);

export default router;

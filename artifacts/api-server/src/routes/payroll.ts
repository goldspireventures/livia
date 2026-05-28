import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import { requireEntitlement } from "../lib/entitlements-gate";
import { buildPayrollExportCsv, runPayrollPreflight } from "../services/payroll-export.service";
import { getBusinessById } from "../services/businesses.service";
import { appendHumanAudit } from "../lib/audit";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (param: string | string[]) => (Array.isArray(param) ? param[0] : param);

router.get(
  "/businesses/:businessId/payroll/preflight",
  requireAuth,
  requireRole("ADMIN"),
  requireEntitlement("payroll_export"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const fromRaw = String(req.query.from ?? "");
    const toRaw = String(req.query.to ?? "");
    if (!fromRaw || !toRaw) {
      sendError(res, req, 400, "from and to (ISO dates) are required");
      return;
    }
    const from = new Date(fromRaw);
    const to = new Date(toRaw);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      sendError(res, req, 400, "Invalid date range");
      return;
    }
    const result = await runPayrollPreflight(businessId, from, to);
    res.json(result);
  },
);

router.get(
  "/businesses/:businessId/payroll/export.csv",
  requireAuth,
  requireRole("ADMIN"),
  requireEntitlement("payroll_export"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const fromRaw = String(req.query.from ?? "");
    const toRaw = String(req.query.to ?? "");
    const format = req.query.format === "gb" ? "gb" : "ie";
    if (!fromRaw || !toRaw) {
      sendError(res, req, 400, "from and to (ISO dates) are required");
      return;
    }
    const biz = await getBusinessById(businessId);
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    const from = new Date(fromRaw);
    const to = new Date(toRaw);
    const { csv, rows, preflight } = await buildPayrollExportCsv({
      businessId,
      from,
      to,
      timezone: biz.timezone,
      format,
    });
    await appendHumanAudit(businessId, userId, "human.payroll.export", "business", businessId, {
      from: fromRaw,
      to: toRaw,
      rowCount: rows.length,
      preflightOk: preflight.ok,
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="livia-payroll-${fromRaw.slice(0, 10)}-${toRaw.slice(0, 10)}.csv"`,
    );
    if (!preflight.ok) {
      res.setHeader("X-Livia-Preflight-Warnings", String(preflight.issues.length));
    }
    res.send(csv);
  },
);

export default router;

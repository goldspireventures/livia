import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { tenantHasEntitlementForBusiness } from "../services/billing.service";
import { buildEnterpriseAuditExportCsv } from "../services/enterprise-audit-export.service";
import {
  getEnterpriseSsoConfig,
  upsertEnterpriseSsoConfig,
} from "../services/enterprise-sso.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

async function requireEnterprise(businessId: string): Promise<boolean> {
  const entitled = await tenantHasEntitlementForBusiness(businessId, "enterprise_audit_export");
  if (entitled) return true;
  const chain = await tenantHasEntitlementForBusiness(businessId, "multi_brand");
  return chain;
}

router.get(
  "/businesses/:businessId/enterprise/audit-export",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = bizId(req.params.businessId);
    if (!(await requireEnterprise(businessId))) {
      sendError(res, req, 403, "enterprise_audit_export not entitled");
      return;
    }
    const fromRaw = String(req.query.from ?? "");
    const toRaw = String(req.query.to ?? "");
    const from = fromRaw ? new Date(fromRaw) : new Date(Date.now() - 30 * 86_400_000);
    const to = toRaw ? new Date(toRaw) : new Date();
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      sendError(res, req, 400, "invalid from/to");
      return;
    }
    const csv = await buildEnterpriseAuditExportCsv({ businessId, from, to });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="livia-audit-export-${businessId.slice(-8)}.csv"`,
    );
    res.send(csv);
  },
);

router.get(
  "/businesses/:businessId/enterprise/sso",
  requireAuth,
  requireRole("OWNER"),
  async (req, res) => {
    const businessId = bizId(req.params.businessId);
    res.json({ data: await getEnterpriseSsoConfig(businessId) });
  },
);

router.put(
  "/businesses/:businessId/enterprise/sso",
  requireAuth,
  requireRole("OWNER"),
  async (req, res) => {
    const businessId = bizId(req.params.businessId);
    if (!(await requireEnterprise(businessId))) {
      sendError(res, req, 403, "enterprise tier required for SSO config");
      return;
    }
    const row = await upsertEnterpriseSsoConfig(businessId, req.body ?? {});
    res.json(row);
  },
);

export default router;

import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { searchAuditLog } from "../services/audit-log.service";

const router: IRouter = Router();
const getBizId = (param: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

router.get(
  "/businesses/:businessId/audit-log",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const { q, actionClass, resourceKind, from, to, limit, offset } = req.query;

    const result = await searchAuditLog(businessId, {
      q: typeof q === "string" ? q : undefined,
      actionClass: typeof actionClass === "string" ? actionClass : undefined,
      resourceKind: typeof resourceKind === "string" ? resourceKind : undefined,
      from: typeof from === "string" ? from : undefined,
      to: typeof to === "string" ? to : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined,
      offset: offset ? parseInt(String(offset), 10) : undefined,
    });

    res.json(result);
  },
);

export default router;

import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { listOpenWorkflowPauses } from "../lib/workflow-pause";
import { isInngestWorkflowsEnabled } from "../lib/inngest";

const router: IRouter = Router();
const getBizId = (param: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

router.get(
  "/businesses/:businessId/workflows/status",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const pauses = await listOpenWorkflowPauses(businessId);
    res.json({
      engine: isInngestWorkflowsEnabled() ? "inngest" : "fallback-cron",
      livWaiting: pauses.length > 0,
      pauses: pauses.map((p) => ({
        workflowId: p.workflowId,
        reason: p.reason,
        pausedAt: p.pausedAt,
      })),
    });
  },
);

export default router;

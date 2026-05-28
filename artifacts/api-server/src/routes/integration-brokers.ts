import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { listIntegrationBrokers } from "../services/integration-brokers.service";

const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/integration-brokers",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    res.json(await listIntegrationBrokers(bizId(req.params.businessId)));
  },
);

export default router;

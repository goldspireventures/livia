import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/calendar/sync-status",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const { getGoogleCalendarSyncStatus } = await import("../services/google-calendar-sync.service");
    res.json(await getGoogleCalendarSyncStatus(bizId(req.params.businessId)));
  },
);

router.post(
  "/businesses/:businessId/calendar/sync",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const { runGoogleCalendarSync } = await import("../services/google-calendar-sync.service");
    res.json(await runGoogleCalendarSync(bizId(req.params.businessId)));
  },
);

export default router;

import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import {
  listShiftTemplates,
  createShiftTemplate,
  applyShiftTemplatesForWeek,
} from "../services/shift-templates.service";
import { sendError } from "../lib/http-errors";
import { db, staffTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => (Array.isArray(param) ? param[0] : param);

router.get(
  "/businesses/:businessId/shift-templates",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    res.json({ templates: await listShiftTemplates(getBizId(req.params.businessId)) });
  },
);

router.post(
  "/businesses/:businessId/shift-templates",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const { name, dayOfWeek, startTime, endTime, label, roleHint, minStaff } = req.body ?? {};
    if (!name || dayOfWeek === undefined || !startTime || !endTime) {
      sendError(res, req, 400, "name, dayOfWeek, startTime, endTime required");
      return;
    }
    const row = await createShiftTemplate({
      businessId,
      name,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      label,
      roleHint,
      minStaff: minStaff ? Number(minStaff) : undefined,
    });
    res.status(201).json(row);
  },
);

router.post(
  "/businesses/:businessId/shift-templates/materialize",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const weekStart = req.body?.weekStart ? new Date(req.body.weekStart) : new Date();
    const staffRows = await db
      .select({ id: staffTable.id })
      .from(staffTable)
      .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));
    const created = await applyShiftTemplatesForWeek(
      businessId,
      weekStart,
      staffRows.map((s) => s.id),
    );
    res.json({ created });
  },
);

export default router;

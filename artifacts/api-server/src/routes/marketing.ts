import { Router, type IRouter } from "express";
import { CreateMarketingLeadBody } from "@workspace/api-zod";
import { createMarketingLead } from "../services/marketing-leads.service";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/public/marketing/leads", async (req, res): Promise<void> => {
  const parsed = CreateMarketingLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid lead payload" });
    return;
  }

  try {
    const { id } = await createMarketingLead(parsed.data);
    logger.info({ lead_id: id, source: parsed.data.source ?? "livia.io" }, "marketing_lead_captured");
    res.status(201).json({ ok: true });
  } catch (err) {
    logger.error({ err }, "marketing_lead_capture_failed");
    res.status(500).json({ error: "Failed to record lead" });
  }
});

export default router;

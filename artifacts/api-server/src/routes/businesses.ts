import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import {
  getBusinessById,
  createBusiness,
  updateBusiness,
  getBusinessBySlug,
} from "../services/businesses.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";

const router: IRouter = Router();

// Access: any authenticated user (anyone can spin up a new shop).
router.post("/businesses", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { name, slug, description, category, email, phone, timezone, city, country, logoUrl, instagramHandle } = req.body;

  if (!name || !slug) {
    res.status(400).json({ error: "name and slug are required" });
    return;
  }

  const existing = await getBusinessBySlug(slug);
  if (existing) {
    res.status(409).json({ error: "Slug already taken" });
    return;
  }

  const biz = await createBusiness(userId, {
    name, slug, description, category, email, phone, timezone, city, country, logoUrl, instagramHandle,
  });

  await logEvent({
    type: EventType.BUSINESS_CREATED,
    businessId: biz.id,
    userId,
    entityType: "business",
    entityId: biz.id,
    context: { name, slug },
  });

  res.status(201).json(biz);
});

// Access: OWNER+ADMIN+STAFF (read).
router.get(
  "/businesses/:businessId",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const biz = await getBusinessById(id);
    if (!biz) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    res.json(biz);
  },
);

// Access: OWNER+ADMIN. Editing the shop's identity is not a STAFF action.
router.patch(
  "/businesses/:businessId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;

    const updated = await updateBusiness(id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    await logEvent({
      type: EventType.BUSINESS_UPDATED,
      businessId: id,
      userId,
      entityType: "business",
      entityId: id,
    });

    res.json(updated);
  },
);

export default router;

import { Router, type IRouter } from "express";
import { requireAuth, getUserId, resolveMembership, getStaffIdForUser } from "../lib/auth";
import { getOrCreateUser, updateUser } from "../services/users.service";
import { getBusinessesForUser } from "../services/businesses.service";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const user = await getOrCreateUser(userId);
  res.json(user);
});

router.patch("/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { fullName, avatarUrl } = req.body;
  const updated = await updateUser(userId, { fullName, avatarUrl });
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(updated);
});

router.get("/me/businesses", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businesses = await getBusinessesForUser(userId);
  res.json(businesses);
});

// What role does this user have inside this business? Used by the
// dashboard + mobile app to decide whether to show STAFF surfaces, the
// persona switcher, AI/communications settings, etc. Returns 404 when
// there's no membership at all (cross-tenant isolation).
router.get(
  "/me/businesses/:businessId/membership",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = Array.isArray(req.params.businessId)
      ? req.params.businessId[0]
      : req.params.businessId;
    const role = await resolveMembership(userId, businessId);
    if (!role) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const staffId = await getStaffIdForUser(userId, businessId);
    res.json({ businessId, role, staffId });
  },
);

export default router;

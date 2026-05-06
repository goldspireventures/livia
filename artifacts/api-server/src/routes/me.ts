import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { getOrCreateUser, getUserById, updateUser } from "../services/users.service";
import { getBusinessesForUser } from "../services/businesses.service";
import { logEvent } from "../services/events.service";

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

export default router;

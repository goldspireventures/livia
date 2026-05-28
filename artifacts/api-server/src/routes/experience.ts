import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { getExperienceMapForUser } from "../services/experience.service";

const router: IRouter = Router();

/** Live product map — businesses, public slugs, staff ids for view-as. */
router.get("/experience/map", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  res.json(await getExperienceMapForUser(userId));
});

export default router;

import { Router, type IRouter } from "express";
import { db, staffTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireAuth, getUserId, resolveMembership, getStaffIdForUser } from "../lib/auth";
import { getOrCreateUser, updateUser } from "../services/users.service";
import { getBusinessesForUser } from "../services/businesses.service";

const router: IRouter = Router();

const RECEPTION_HINT = /(reception|front[ -]?desk|concierge)/i;

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

// Per ADR 0010 — persona is derived, never stored. We surface the
// minimum signal needed for the client to derive the right shell:
// role, ownStaffId, plus two cheap signals about that staff record
// (front-desk title hint, tenure in days). The client combines these
// with businessCount to pick founder/owner/manager/receptionist/
// senior/junior/customer. Returns 404 when there's no membership at
// all (cross-tenant isolation).
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

    let isReception = false;
    let tenureDays = 0;
    if (staffId) {
      const [s] = await db
        .select({
          displayName: staffTable.displayName,
          firstName: staffTable.firstName,
          lastName: staffTable.lastName,
          bio: staffTable.bio,
          createdAt: staffTable.createdAt,
        })
        .from(staffTable)
        .where(and(eq(staffTable.id, staffId), eq(staffTable.businessId, businessId)));
      if (s) {
        const haystack = `${s.displayName ?? ""} ${s.firstName ?? ""} ${s.lastName ?? ""} ${s.bio ?? ""}`;
        isReception = RECEPTION_HINT.test(haystack);
        const ms = Date.now() - new Date(s.createdAt).getTime();
        tenureDays = Math.max(0, Math.floor(ms / 86_400_000));
      }
    }

    res.json({ businessId, role, staffId, isReception, tenureDays });
  },
);

export default router;

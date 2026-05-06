import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { db, businessesTable, businessMembershipsTable, staffTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────

export type Role = "OWNER" | "ADMIN" | "STAFF";

export interface RoleContext {
  // The user's actual membership role for the business in the URL.
  // OWNER membership rows are auto-created in createBusiness; the
  // business `ownerId` column is also recognised as OWNER if no row exists.
  role: Role;
  // The role to use for read-shaping decisions on this request. Equal to
  // `role` unless the caller is OWNER/ADMIN and explicitly opted into a
  // staff persona via `?as=staff:<staffId>`.
  effectiveRole: Role;
  // When effectiveRole === STAFF *and* the OWNER/ADMIN is impersonating
  // a specific staff row, this is the staff.id they're viewing-as.
  // For native STAFF callers this is the staff row tied to their userId
  // (or null if no staff row links to them yet).
  actingStaffId: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId as string | undefined || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).userId = userId;
  next();
}

export function getUserId(req: Request): string {
  return (req as any).userId as string;
}

// ─── Membership resolution ───────────────────────────────────────────────

export async function resolveMembership(
  userId: string,
  businessId: string,
): Promise<Role | null> {
  // Treat the business `ownerId` column as OWNER even if the
  // business_memberships row is somehow missing — defensive in case an
  // older business pre-dated auto-enrolment.
  const [biz] = await db
    .select({ ownerId: businessesTable.ownerId })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  if (!biz) return null;
  if (biz.ownerId === userId) return "OWNER";

  const [mem] = await db
    .select({ role: businessMembershipsTable.role })
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, userId),
      ),
    );
  return (mem?.role as Role | undefined) ?? null;
}

export async function getStaffIdForUser(
  userId: string,
  businessId: string,
): Promise<string | null> {
  const [s] = await db
    .select({ id: staffTable.id })
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.userId, userId)));
  return s?.id ?? null;
}

// ─── requireRole middleware ──────────────────────────────────────────────

const RANK: Record<Role, number> = { STAFF: 1, ADMIN: 2, OWNER: 3 };

/**
 * Gate a `:businessId`-scoped route by role.
 *
 * - 401 if unauthenticated
 * - 404 if no membership at all (cross-tenant isolation; we never leak
 *   "this business exists but you can't see it")
 * - 403 if the user's role is below the minimum required role
 *
 * Honours `?as=staff:<staffId>` for OWNER/ADMIN callers, which sets
 * `effectiveRole=STAFF` + `actingStaffId` for read-shaping. The actual
 * authorisation is still done against the user's real role — staff
 * impersonation cannot be used to *escalate* permissions.
 */
export function requireRole(min: Role): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const raw = req.params.businessId;
    const businessId = Array.isArray(raw) ? raw[0] : raw;
    if (!businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    const role = await resolveMembership(userId, businessId);
    if (!role) {
      // 404 — never confirm or deny existence of the business to a
      // non-member. Keep parity with prior `userHasAccessToBusiness` UX.
      res.status(404).json({ error: "Business not found" });
      return;
    }
    if (RANK[role] < RANK[min]) {
      res.status(403).json({
        error: `Forbidden: requires ${min}, but you are ${role}`,
        code: "INSUFFICIENT_ROLE",
      });
      return;
    }

    // Persona override (read-only) — only OWNER/ADMIN may view-as.
    let effectiveRole: Role = role;
    let actingStaffId: string | null = null;
    const asParam = typeof req.query.as === "string" ? req.query.as : undefined;
    let isImpersonating = false;
    if (asParam && (role === "OWNER" || role === "ADMIN")) {
      // Format: `staff:<staffId>` or `staff` (any staff persona, no specific row).
      const m = /^staff(?::(.+))?$/.exec(asParam);
      if (m) {
        effectiveRole = "STAFF";
        actingStaffId = m[1] ?? null;
        isImpersonating = true;
      }
    } else if (role === "STAFF") {
      actingStaffId = await getStaffIdForUser(userId, businessId);
    }

    // Read-only persona: when an OWNER/ADMIN is actively impersonating a
    // STAFF row, refuse all mutating verbs. This prevents accidental
    // writes performed "as staff" and matches the documented contract in
    // the persona switcher UI.
    if (isImpersonating && req.method !== "GET" && req.method !== "HEAD") {
      res.status(403).json({
        error: "Persona view is read-only. Exit the staff view to make changes.",
        code: "PERSONA_READ_ONLY",
      });
      return;
    }

    const ctx: RoleContext = { role, effectiveRole, actingStaffId };
    (req as any).roleContext = ctx;
    next();
  };
}

export function getRoleContext(req: Request): RoleContext {
  const ctx = (req as any).roleContext as RoleContext | undefined;
  if (!ctx) {
    throw new Error("getRoleContext called before requireRole middleware");
  }
  return ctx;
}

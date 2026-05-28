/**
 * Dev-only simulation auth bypass.
 *
 * When NODE_ENV=development, requests carrying a valid X-Sim-Token header
 * skip Clerk JWT validation and get a real demo userId injected onto the request.
 *
 * The token is a HMAC-SHA256 of "<userId>:<businessId>:<timestamp>" using
 * SIM_AUTH_SECRET (falls back to "livia-dev-sim" in dev).
 *
 * NEVER activate in production — this file is excluded from prod builds via
 * the check at the start of the middleware.
 */

import type { Request, Response, NextFunction } from "express";
import { createHmac } from "node:crypto";
import { db, businessesTable, businessMembershipsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const DEV_SECRET = process.env.SIM_AUTH_SECRET ?? "livia-dev-sim";
const TOKEN_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

export function buildSimToken(userId: string, businessId: string): string {
  const ts = Date.now();
  const payload = `${userId}:${businessId}:${ts}`;
  const sig = createHmac("sha256", DEV_SECRET).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

function verifySimToken(token: string): { userId: string; businessId: string } | null {
  const parts = token.split(":");
  if (parts.length !== 4) return null;
  const [userId, businessId, tsStr, sig] = parts as [string, string, string, string];
  const ts = Number(tsStr);
  if (isNaN(ts) || Date.now() - ts > TOKEN_MAX_AGE_MS) return null;
  const payload = `${userId}:${businessId}:${ts}`;
  const expected = createHmac("sha256", DEV_SECRET).update(payload).digest("hex");
  if (sig !== expected) return null;
  return { userId, businessId };
}

/**
 * Express middleware — insert BEFORE clerkMiddleware.
 * Only active when NODE_ENV=development.
 */
export function simAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== "development") {
    next();
    return;
  }
  const header = req.headers["x-sim-token"];
  if (!header || typeof header !== "string") {
    next();
    return;
  }
  const parsed = verifySimToken(header);
  if (!parsed) {
    next();
    return;
  }
  // Inject userId so requireAuth + requireRole see a real user.
  (req as any).__simUserId = parsed.userId;
  (req as any).__simBusinessId = parsed.businessId;
  next();
}

/**
 * Patched requireAuth that checks __simUserId first.
 * Import this instead of requireAuth in the sim context.
 */
export function requireAuthOrSim(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === "development" && (req as any).__simUserId) {
    (req as any).userId = (req as any).__simUserId;
    next();
    return;
  }
  const { getAuth } = require("@clerk/express");
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).userId = auth.userId;
  next();
}

/**
 * Lookup or mint a demo operator userId for a given business slug.
 * Returns the Clerk userId of the business owner row.
 */
export async function getSimOwnerForBusiness(businessId: string): Promise<string | null> {
  // Find the OWNER membership for this business.
  const [biz] = await db
    .select({ ownerId: businessesTable.ownerId })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (biz?.ownerId) return biz.ownerId;

  // Fallback: any OWNER membership row.
  const [mem] = await db
    .select({ userId: businessMembershipsTable.userId })
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.role, "OWNER"),
      ),
    )
    .limit(1);
  return mem?.userId ?? null;
}

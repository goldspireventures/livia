import type { Request, Response, NextFunction, RequestHandler } from "express";
import { db, apiCredentialsTable, businessesTable } from "@workspace/db";
import { and, eq, isNull } from "drizzle-orm";
import { verifyApiKey } from "./api-key-crypto";
import type { PartnerScope } from "./partner-scopes";

export type PartnerAuthContext = {
  kind: "legacy" | "credential";
  credentialId?: string;
  businessId: string | null;
  scopes: PartnerScope[];
  allowedSlugs: string[] | null;
};

declare global {
  namespace Express {
    interface Request {
      partnerAuth?: PartnerAuthContext;
    }
  }
}

const LEGACY_SCOPES: PartnerScope[] = [
  "bookings:read",
  "customers:read",
  "services:read",
  "slots:read",
  "business:read",
];

async function resolveCredential(rawKey: string): Promise<PartnerAuthContext | null> {
  const prefix = rawKey.slice(0, 16);
  const [row] = await db
    .select()
    .from(apiCredentialsTable)
    .where(
      and(eq(apiCredentialsTable.keyPrefix, prefix), isNull(apiCredentialsTable.revokedAt)),
    );

  if (!row || !verifyApiKey(rawKey, row.keyHash)) return null;

  await db
    .update(apiCredentialsTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiCredentialsTable.id, row.id));

  return {
    kind: "credential",
    credentialId: row.id,
    businessId: row.businessId,
    scopes: (row.scopes ?? []).filter((s): s is PartnerScope =>
      LEGACY_SCOPES.includes(s as PartnerScope),
    ),
    allowedSlugs:
      row.allowedSlugs && row.allowedSlugs.length > 0 ? row.allowedSlugs : null,
  };
}

export function extractApiKey(req: Request): string | null {
  const header =
    (req.headers["x-partner-api-key"] as string | undefined)?.trim() ??
    (req.headers["x-api-key"] as string | undefined)?.trim() ??
    (req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "").trim();
  return header || null;
}

export function requirePartnerApiKey(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const raw = extractApiKey(req);
    if (!raw) {
      res.status(401).json({ error: "Missing API key", code: "API_KEY_REQUIRED" });
      return;
    }

    const legacy = process.env.PARTNER_API_KEY?.trim();
    if (legacy && raw === legacy) {
      req.partnerAuth = {
        kind: "legacy",
        businessId: null,
        scopes: LEGACY_SCOPES,
        allowedSlugs: null,
      };
      next();
      return;
    }

    try {
      const ctx = await resolveCredential(raw);
      if (!ctx || ctx.scopes.length === 0) {
        res.status(401).json({ error: "Invalid API key" });
        return;
      }
      req.partnerAuth = ctx;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requirePartnerScope(...needed: PartnerScope[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ctx = req.partnerAuth;
    if (!ctx) {
      res.status(500).json({ error: "Partner auth context missing" });
      return;
    }
    for (const scope of needed) {
      if (!ctx.scopes.includes(scope)) {
        res.status(403).json({
          error: `API key missing scope: ${scope}`,
          code: "SCOPE_REQUIRED",
          scope,
        });
        return;
      }
    }
    next();
  };
}

export async function assertPartnerCanAccessSlug(
  ctx: PartnerAuthContext,
  slug: string,
): Promise<{ businessId: string } | null> {
  const [biz] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug));

  if (!biz) return null;

  if (ctx.businessId && ctx.businessId !== biz.id) {
    return null;
  }
  if (ctx.allowedSlugs && !ctx.allowedSlugs.includes(slug)) {
    return null;
  }
  return { businessId: biz.id };
}

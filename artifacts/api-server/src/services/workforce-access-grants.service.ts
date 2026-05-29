import { db, internalWorkforceAccessGrantsTable } from "@workspace/db";
import {
  isCockpitGrantableGoldspireEmail,
  normalizeEmail,
  resolveWorkforceAccessTier,
} from "@workspace/policy";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { generateId } from "../lib/id";
import { getWorkforceAccessConfig } from "../lib/workforce-access-env.js";
import {
  getCockpitWorkforceGrantsSync,
  invalidateCockpitWorkforceGrantsCache,
  isCockpitWorkforceGrantsCacheLoaded,
  replaceCockpitWorkforceGrantsCache,
  type CockpitGrantTier,
} from "../lib/workforce-access-grants-cache.js";

export type { CockpitGrantTier };

async function loadActiveGrantsMap(): Promise<Map<string, CockpitGrantTier>> {
  const rows = await db
    .select({
      email: internalWorkforceAccessGrantsTable.email,
      tier: internalWorkforceAccessGrantsTable.tier,
    })
    .from(internalWorkforceAccessGrantsTable)
    .where(isNull(internalWorkforceAccessGrantsTable.revokedAt));

  const map = new Map<string, CockpitGrantTier>();
  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!email) continue;
    const tier = row.tier === "full" ? "full" : "restricted";
    map.set(email, tier);
  }
  return map;
}

export async function refreshCockpitWorkforceGrantsCache(): Promise<void> {
  replaceCockpitWorkforceGrantsCache(await loadActiveGrantsMap());
}

export async function ensureCockpitWorkforceGrantsCache(): Promise<ReadonlyMap<string, CockpitGrantTier>> {
  if (!isCockpitWorkforceGrantsCacheLoaded()) await refreshCockpitWorkforceGrantsCache();
  return getCockpitWorkforceGrantsSync();
}

export { setCockpitWorkforceGrantsCacheForTest } from "../lib/workforce-access-grants-cache.js";
export { invalidateCockpitWorkforceGrantsCache } from "../lib/workforce-access-grants-cache.js";

export async function listCockpitWorkforceAccessGrants() {
  const rows = await db
    .select()
    .from(internalWorkforceAccessGrantsTable)
    .where(isNull(internalWorkforceAccessGrantsTable.revokedAt))
    .orderBy(desc(internalWorkforceAccessGrantsTable.grantedAt));

  return {
    goldspireDomain: getWorkforceAccessConfig().goldspireStaffDomains[0] ?? "goldspireventures.com",
    grants: rows.map((r) => ({
      id: r.id,
      email: normalizeEmail(r.email),
      tier: (r.tier === "full" ? "full" : "restricted") as CockpitGrantTier,
      notes: r.notes,
      grantedBy: r.grantedBy,
      grantedAt: r.grantedAt.toISOString(),
    })),
  };
}

export async function grantCockpitWorkforceAccess(args: {
  email: string;
  tier: CockpitGrantTier;
  grantedBy: string;
  notes?: string;
}) {
  const config = getWorkforceAccessConfig();
  const email = normalizeEmail(args.email);
  if (!email) throw new Error("Email is required");
  if (!isCockpitGrantableGoldspireEmail(email, config)) {
    throw new Error(
      `Only @${config.goldspireStaffDomains.join(", @")} addresses can be granted via cockpit`,
    );
  }
  if (args.tier !== "restricted" && args.tier !== "full") {
    throw new Error("Tier must be restricted or full");
  }

  const [existing] = await db
    .select({ id: internalWorkforceAccessGrantsTable.id })
    .from(internalWorkforceAccessGrantsTable)
    .where(
      and(
        sql`lower(${internalWorkforceAccessGrantsTable.email}) = ${email}`,
        isNull(internalWorkforceAccessGrantsTable.revokedAt),
      ),
    )
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(internalWorkforceAccessGrantsTable)
      .set({
        tier: args.tier,
        notes: args.notes?.trim() || null,
        grantedBy: args.grantedBy,
        grantedAt: new Date(),
      })
      .where(eq(internalWorkforceAccessGrantsTable.id, existing.id))
      .returning();
    invalidateCockpitWorkforceGrantsCache();
    await refreshCockpitWorkforceGrantsCache();
    return row;
  }

  const [row] = await db
    .insert(internalWorkforceAccessGrantsTable)
    .values({
      id: generateId(),
      email,
      tier: args.tier,
      notes: args.notes?.trim() || null,
      grantedBy: args.grantedBy,
    })
    .returning();

  invalidateCockpitWorkforceGrantsCache();
  await refreshCockpitWorkforceGrantsCache();
  return row;
}

export async function revokeCockpitWorkforceAccess(args: { email: string; revokedBy: string }) {
  const email = normalizeEmail(args.email);
  if (!email) throw new Error("Email is required");

  const [row] = await db
    .update(internalWorkforceAccessGrantsTable)
    .set({ revokedAt: new Date(), revokedBy: args.revokedBy })
    .where(
      and(
        sql`lower(${internalWorkforceAccessGrantsTable.email}) = ${email}`,
        isNull(internalWorkforceAccessGrantsTable.revokedAt),
      ),
    )
    .returning();

  if (!row) throw new Error("No active grant for that email");

  invalidateCockpitWorkforceGrantsCache();
  await refreshCockpitWorkforceGrantsCache();
  return row;
}

export async function resolveWorkforceAccessTierForEmail(email: string | null | undefined) {
  await ensureCockpitWorkforceGrantsCache();
  const config = getWorkforceAccessConfig();
  const normalized = normalizeEmail(email);
  return {
    email: normalized,
    tier: resolveWorkforceAccessTier(normalized, config, getCockpitWorkforceGrantsSync()),
    goldspireRequiresCockpitGrant:
      !normalized || !isCockpitGrantableGoldspireEmail(normalized, config)
        ? false
        : !getCockpitWorkforceGrantsSync().has(normalized),
  };
}

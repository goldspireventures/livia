import { db, featureFlagsTable, businessesTable } from "@workspace/db";
import { eq, isNull, or, ilike, and } from "drizzle-orm";
import { generateId } from "../lib/id";
import { FeatureFlagKey } from "@workspace/db";

const KNOWN_KEYS = Object.values(FeatureFlagKey);

export async function listInternalFeatureFlags(opts?: {
  businessId?: string;
  globalOnly?: boolean;
}) {
  const conditions = [];
  if (opts?.globalOnly) {
    conditions.push(isNull(featureFlagsTable.businessId));
  } else if (opts?.businessId) {
    conditions.push(eq(featureFlagsTable.businessId, opts.businessId));
  }

  const rows = await db
    .select({
      id: featureFlagsTable.id,
      key: featureFlagsTable.key,
      businessId: featureFlagsTable.businessId,
      description: featureFlagsTable.description,
      isEnabled: featureFlagsTable.isEnabled,
      businessName: businessesTable.name,
      businessSlug: businessesTable.slug,
    })
    .from(featureFlagsTable)
    .leftJoin(businessesTable, eq(featureFlagsTable.businessId, businessesTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(500);

  return { knownKeys: KNOWN_KEYS, flags: rows };
}

export async function upsertInternalFeatureFlag(args: {
  key: string;
  businessId?: string | null;
  isEnabled: boolean;
  description?: string;
}) {
  const [existing] = await db
    .select()
    .from(featureFlagsTable)
    .where(
      args.businessId
        ? and(
            eq(featureFlagsTable.key, args.key),
            eq(featureFlagsTable.businessId, args.businessId),
          )
        : and(eq(featureFlagsTable.key, args.key), isNull(featureFlagsTable.businessId)),
    )
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(featureFlagsTable)
      .set({
        isEnabled: args.isEnabled,
        description: args.description ?? existing.description,
        updatedAt: new Date(),
      })
      .where(eq(featureFlagsTable.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(featureFlagsTable)
    .values({
      id: generateId(),
      key: args.key,
      businessId: args.businessId ?? null,
      isEnabled: args.isEnabled,
      description: args.description ?? null,
    })
    .returning();
  return row;
}

export async function searchBusinessesForFlags(q: string) {
  const pattern = `%${q.trim().replace(/%/g, "\\%")}%`;
  return db
    .select({ id: businessesTable.id, name: businessesTable.name, slug: businessesTable.slug })
    .from(businessesTable)
    .where(or(ilike(businessesTable.name, pattern), ilike(businessesTable.slug, pattern)))
    .limit(20);
}

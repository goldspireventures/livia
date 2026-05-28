import { db, mediaAssetsTable, customersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function createMediaAsset(
  businessId: string,
  data: {
    url: string;
    kind?: string;
    mimeType?: string;
    entityType?: string;
    entityId?: string;
  },
) {
  const [row] = await db
    .insert(mediaAssetsTable)
    .values({
      id: generateId(),
      businessId,
      url: data.url,
      kind: data.kind ?? "image",
      mimeType: data.mimeType ?? null,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
    })
    .returning();

  if (data.entityType === "customer" && data.entityId) {
    await db
      .update(customersTable)
      .set({ avatarUrl: data.url, updatedAt: new Date() })
      .where(and(eq(customersTable.id, data.entityId), eq(customersTable.businessId, businessId)));
  }

  return row;
}

export async function listMediaAssets(
  businessId: string,
  opts: { entityType?: string; entityId?: string },
) {
  const conditions = [eq(mediaAssetsTable.businessId, businessId)];
  if (opts.entityType) conditions.push(eq(mediaAssetsTable.entityType, opts.entityType));
  if (opts.entityId) conditions.push(eq(mediaAssetsTable.entityId, opts.entityId));

  return db
    .select()
    .from(mediaAssetsTable)
    .where(and(...conditions));
}

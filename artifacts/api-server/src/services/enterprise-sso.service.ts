import { db, enterpriseSsoConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getEnterpriseSsoConfig(businessId: string) {
  const [row] = await db
    .select()
    .from(enterpriseSsoConfigsTable)
    .where(eq(enterpriseSsoConfigsTable.businessId, businessId))
    .limit(1);
  return row ?? null;
}

export async function upsertEnterpriseSsoConfig(
  businessId: string,
  data: {
    provider?: string;
    issuerUrl?: string | null;
    clientId?: string | null;
    metadataUrl?: string | null;
    enabled?: boolean;
  },
) {
  const existing = await getEnterpriseSsoConfig(businessId);
  if (existing) {
    const [row] = await db
      .update(enterpriseSsoConfigsTable)
      .set({
        provider: data.provider ?? existing.provider,
        issuerUrl: data.issuerUrl !== undefined ? data.issuerUrl : existing.issuerUrl,
        clientId: data.clientId !== undefined ? data.clientId : existing.clientId,
        metadataUrl: data.metadataUrl !== undefined ? data.metadataUrl : existing.metadataUrl,
        enabled: data.enabled ?? existing.enabled,
        updatedAt: new Date(),
      })
      .where(eq(enterpriseSsoConfigsTable.businessId, businessId))
      .returning();
    return row!;
  }
  const [row] = await db
    .insert(enterpriseSsoConfigsTable)
    .values({
      businessId,
      provider: data.provider ?? "oidc",
      issuerUrl: data.issuerUrl ?? null,
      clientId: data.clientId ?? null,
      metadataUrl: data.metadataUrl ?? null,
      enabled: data.enabled ?? false,
    })
    .returning();
  return row!;
}

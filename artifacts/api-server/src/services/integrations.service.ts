import {
  db,
  apiCredentialsTable,
  webhookEndpointsTable,
  webhookDeliveriesTable,
} from "@workspace/db";
import { and, eq, desc, isNull } from "drizzle-orm";
import { generateId } from "../lib/id";
import { generateApiKey, generateWebhookSecret } from "../lib/api-key-crypto";
import {
  isPartnerScope,
  isWebhookEvent,
  WEBHOOK_SUBSCRIBABLE_EVENTS,
  type PartnerScope,
} from "../lib/partner-scopes";

export function listWebhookableEvents(): string[] {
  return [...WEBHOOK_SUBSCRIBABLE_EVENTS];
}

export async function listWebhookEndpoints(businessId: string) {
  return db
    .select({
      id: webhookEndpointsTable.id,
      url: webhookEndpointsTable.url,
      subscribedEvents: webhookEndpointsTable.subscribedEvents,
      enabled: webhookEndpointsTable.enabled,
      description: webhookEndpointsTable.description,
      createdAt: webhookEndpointsTable.createdAt,
    })
    .from(webhookEndpointsTable)
    .where(eq(webhookEndpointsTable.businessId, businessId))
    .orderBy(desc(webhookEndpointsTable.createdAt));
}

export async function createWebhookEndpoint(
  businessId: string,
  input: { url: string; subscribedEvents: string[]; description?: string },
): Promise<{ endpoint: typeof webhookEndpointsTable.$inferSelect; secret: string }> {
  const events = input.subscribedEvents.filter(isWebhookEvent);
  if (events.length === 0) {
    throw new Error("INVALID_EVENTS");
  }
  const secret = generateWebhookSecret();
  const id = generateId();
  const [endpoint] = await db
    .insert(webhookEndpointsTable)
    .values({
      id,
      businessId,
      url: input.url,
      secret,
      subscribedEvents: events,
      description: input.description ?? null,
      enabled: true,
    })
    .returning();
  return { endpoint, secret };
}

export async function updateWebhookEndpoint(
  businessId: string,
  endpointId: string,
  patch: { url?: string; subscribedEvents?: string[]; enabled?: boolean; description?: string },
) {
  const events = patch.subscribedEvents?.filter(isWebhookEvent);
  const [row] = await db
    .update(webhookEndpointsTable)
    .set({
      ...(patch.url !== undefined ? { url: patch.url } : {}),
      ...(events !== undefined ? { subscribedEvents: events } : {}),
      ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(webhookEndpointsTable.id, endpointId),
        eq(webhookEndpointsTable.businessId, businessId),
      ),
    )
    .returning();
  return row ?? null;
}

export async function deleteWebhookEndpoint(businessId: string, endpointId: string) {
  await db
    .delete(webhookEndpointsTable)
    .where(
      and(
        eq(webhookEndpointsTable.id, endpointId),
        eq(webhookEndpointsTable.businessId, businessId),
      ),
    );
}

export async function listApiCredentials(businessId: string) {
  return db
    .select({
      id: apiCredentialsTable.id,
      label: apiCredentialsTable.label,
      keyPrefix: apiCredentialsTable.keyPrefix,
      scopes: apiCredentialsTable.scopes,
      lastUsedAt: apiCredentialsTable.lastUsedAt,
      createdAt: apiCredentialsTable.createdAt,
    })
    .from(apiCredentialsTable)
    .where(
      and(
        eq(apiCredentialsTable.businessId, businessId),
        isNull(apiCredentialsTable.revokedAt),
      ),
    )
    .orderBy(desc(apiCredentialsTable.createdAt));
}

export async function createTenantApiKey(
  businessId: string,
  userId: string,
  input: { label: string; scopes: string[] },
): Promise<{ id: string; label: string; keyPrefix: string; rawKey: string; scopes: PartnerScope[] }> {
  const scopes = input.scopes.filter(isPartnerScope);
  if (scopes.length === 0) throw new Error("INVALID_SCOPES");

  const { rawKey, keyPrefix, keyHash } = generateApiKey("tenant");
  const id = generateId();
  await db.insert(apiCredentialsTable).values({
    id,
    businessId,
    label: input.label,
    keyPrefix,
    keyHash,
    scopes,
    allowedSlugs: [],
    createdByUserId: userId,
  });
  return { id, label: input.label, keyPrefix, rawKey, scopes };
}

export async function revokeApiCredential(businessId: string, credentialId: string) {
  await db
    .update(apiCredentialsTable)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(apiCredentialsTable.id, credentialId),
        eq(apiCredentialsTable.businessId, businessId),
      ),
    );
}

export async function listRecentWebhookDeliveries(businessId: string, limit = 20) {
  return db
    .select({
      id: webhookDeliveriesTable.id,
      endpointId: webhookDeliveriesTable.endpointId,
      eventName: webhookDeliveriesTable.eventName,
      status: webhookDeliveriesTable.status,
      attempts: webhookDeliveriesTable.attempts,
      lastError: webhookDeliveriesTable.lastError,
      deliveredAt: webhookDeliveriesTable.deliveredAt,
      createdAt: webhookDeliveriesTable.createdAt,
    })
    .from(webhookDeliveriesTable)
    .where(eq(webhookDeliveriesTable.businessId, businessId))
    .orderBy(desc(webhookDeliveriesTable.createdAt))
    .limit(limit);
}

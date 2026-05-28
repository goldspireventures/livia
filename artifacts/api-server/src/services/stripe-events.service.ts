import { db, stripeEventsTable, providerDlqTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { generateId } from "../lib/id";
import { logger } from "../lib/logger";

/** Returns true if this is a new event (caller should process). False = duplicate. */
export async function claimStripeEvent(args: {
  eventId: string;
  type: string;
  livemode: boolean;
  businessId?: string | null;
  payload?: unknown;
}): Promise<boolean> {
  try {
    await db.insert(stripeEventsTable).values({
      id: args.eventId,
      type: args.type,
      livemode: args.livemode,
      businessId: args.businessId ?? null,
      payload: args.payload as Record<string, unknown> | null,
    });
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/duplicate|unique/i.test(msg)) return false;
    throw err;
  }
}

export async function recordProviderDlq(args: {
  provider: string;
  operation: string;
  businessId?: string | null;
  payload?: unknown;
  error: string;
}): Promise<void> {
  const id = generateId();
  logger.warn(
    { provider: args.provider, operation: args.operation, businessId: args.businessId, error: args.error },
    "provider DLQ entry",
  );
  await db.insert(providerDlqTable).values({
    id,
    provider: args.provider,
    operation: args.operation,
    businessId: args.businessId ?? null,
    payload: args.payload as Record<string, unknown> | null,
    error: args.error.slice(0, 2000),
    attempts: 1,
  });
}

export async function listRecentProviderDlq(limit = 50) {
  return db
    .select()
    .from(providerDlqTable)
    .orderBy(desc(providerDlqTable.createdAt))
    .limit(limit);
}

export async function countOpenPaymentIssues(businessId?: string) {
  const dlq = await db.select().from(providerDlqTable).limit(200);
  const stripeDlq = dlq.filter((d) => d.provider === "stripe");
  return {
    stripeDlqCount: stripeDlq.length,
    recent: stripeDlq.slice(0, 10),
  };
}

import { db, eventsTable } from "@workspace/db";
import type { EventTypeLiteral } from "@workspace/db";
import { generateId } from "../lib/id";

export async function logEvent(opts: {
  type: EventTypeLiteral | string;
  businessId?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  context?: Record<string, unknown>;
  level?: "INFO" | "WARN" | "ERROR";
}): Promise<void> {
  try {
    await db.insert(eventsTable).values({
      id: generateId(),
      type: opts.type,
      source: "api",
      level: opts.level ?? "INFO",
      businessId: opts.businessId,
      userId: opts.userId,
      entityType: opts.entityType,
      entityId: opts.entityId,
      context: opts.context ?? {},
    });
  } catch {
    // never let event logging crash the main flow
  }
}

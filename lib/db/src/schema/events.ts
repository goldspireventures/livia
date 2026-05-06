import { pgTable, text, timestamp, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventLevelEnum = pgEnum("event_level", ["INFO", "WARN", "ERROR"]);

export const eventsTable = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    source: text("source").notNull().default("api"),
    level: eventLevelEnum("level").notNull().default("INFO"),
    businessId: text("business_id"),
    userId: text("user_id"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    context: jsonb("context"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("events_business_idx").on(t.businessId),
    index("events_type_idx").on(t.type),
    index("events_created_at_idx").on(t.createdAt),
    index("events_entity_idx").on(t.entityType, t.entityId),
  ],
);

export const insertEventSchema = createInsertSchema(eventsTable).omit({ createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type LiviaEvent = typeof eventsTable.$inferSelect;

export const EventType = {
  USER_SIGNED_UP: "USER_SIGNED_UP",
  BUSINESS_CREATED: "BUSINESS_CREATED",
  BUSINESS_UPDATED: "BUSINESS_UPDATED",
  STAFF_CREATED: "STAFF_CREATED",
  STAFF_UPDATED: "STAFF_UPDATED",
  STAFF_DEACTIVATED: "STAFF_DEACTIVATED",
  SERVICE_CREATED: "SERVICE_CREATED",
  SERVICE_UPDATED: "SERVICE_UPDATED",
  SERVICE_DEACTIVATED: "SERVICE_DEACTIVATED",
  AVAILABILITY_UPDATED: "AVAILABILITY_UPDATED",
  TIME_OFF_CREATED: "TIME_OFF_CREATED",
  TIME_OFF_REMOVED: "TIME_OFF_REMOVED",
  BOOKING_CREATED: "BOOKING_CREATED",
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  BOOKING_COMPLETED: "BOOKING_COMPLETED",
  BOOKING_NO_SHOW: "BOOKING_NO_SHOW",
  CUSTOMER_CREATED: "CUSTOMER_CREATED",
  CUSTOMER_UPDATED: "CUSTOMER_UPDATED",
  NOTIFICATION_SENT: "NOTIFICATION_SENT",
  NOTIFICATION_FAILED: "NOTIFICATION_FAILED",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  MESSAGE_SENT: "MESSAGE_SENT",
  CHANNEL_IDENTITY_LINKED: "CHANNEL_IDENTITY_LINKED",
  PAYMENT_INTENT_CREATED: "PAYMENT_INTENT_CREATED",
  PAYMENT_SUCCEEDED: "PAYMENT_SUCCEEDED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  REFUND_CREATED: "REFUND_CREATED",
  AI_OBSERVATION_CREATED: "AI_OBSERVATION_CREATED",
  INCIDENT_CREATED: "INCIDENT_CREATED",
  INCIDENT_UPDATED: "INCIDENT_UPDATED",
  FEATURE_FLAG_UPDATED: "FEATURE_FLAG_UPDATED",
} as const;

export type EventTypeLiteral = (typeof EventType)[keyof typeof EventType];

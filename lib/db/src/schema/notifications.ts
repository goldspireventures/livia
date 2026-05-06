import { pgTable, text, timestamp, boolean, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { businessesTable } from "./businesses";
import { customersTable } from "./customers";
import { bookingsTable } from "./bookings";
import { usersTable } from "./users";

export const notificationChannelEnum = pgEnum("notification_channel", [
  "EMAIL", "SMS", "PUSH", "WHATSAPP", "IN_APP",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "PENDING", "SENT", "FAILED", "SIMULATED",
]);

export const devicePlatformEnum = pgEnum("device_platform", ["IOS", "ANDROID", "WEB"]);

export const notificationLogsTable = pgTable(
  "notification_logs",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    channel: notificationChannelEnum("channel").notNull(),
    templateKey: text("template_key"),
    status: notificationStatusEnum("status").notNull().default("PENDING"),
    payload: jsonb("payload"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notif_logs_business_idx").on(t.businessId),
    index("notif_logs_booking_idx").on(t.bookingId),
    index("notif_logs_customer_idx").on(t.customerId),
  ],
);

export const messageLogsTable = pgTable(
  "message_logs",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    channelType: text("channel_type").notNull(),
    direction: text("direction").notNull(), // INBOUND | OUTBOUND
    externalMessageId: text("external_message_id"),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("msg_logs_business_idx").on(t.businessId),
    index("msg_logs_customer_idx").on(t.customerId),
    index("msg_logs_created_at_idx").on(t.createdAt),
  ],
);

export const deviceTokensTable = pgTable(
  "device_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "cascade" }),
    platform: devicePlatformEnum("platform").notNull(),
    token: text("token").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("device_tokens_user_idx").on(t.userId),
    index("device_tokens_customer_idx").on(t.customerId),
  ],
);

export const insertNotificationLogSchema = createInsertSchema(notificationLogsTable).omit({ createdAt: true });
export const insertMessageLogSchema = createInsertSchema(messageLogsTable).omit({ createdAt: true });
export const insertDeviceTokenSchema = createInsertSchema(deviceTokensTable).omit({ createdAt: true, updatedAt: true });
export type NotificationLog = typeof notificationLogsTable.$inferSelect;
export type MessageLog = typeof messageLogsTable.$inferSelect;
export type DeviceToken = typeof deviceTokensTable.$inferSelect;

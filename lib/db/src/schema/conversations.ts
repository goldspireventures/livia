import { pgTable, text, timestamp, jsonb, pgEnum, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";
import { customersTable } from "./customers";
import { bookingsTable } from "./bookings";

export const conversationChannelEnum = pgEnum("conversation_channel", [
  "WEB",
  "SMS",
  "INSTAGRAM",
  "WHATSAPP",
  "EMAIL",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "OPEN",
  "HANDED_OFF",
  "CLOSED",
]);

export const conversationMessageRoleEnum = pgEnum("conversation_message_role", [
  "USER",
  "ASSISTANT",
  "SYSTEM",
  "TOOL",
]);

export const conversationsTable = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customersTable.id, {
      onDelete: "set null",
    }),
    channel: conversationChannelEnum("channel").notNull().default("WEB"),
    status: conversationStatusEnum("status").notNull().default("OPEN"),
    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    aiHandled: boolean("ai_handled").notNull().default(true),
    summary: text("summary"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("conversations_business_idx").on(t.businessId),
    index("conversations_business_status_idx").on(t.businessId, t.status),
    index("conversations_last_message_idx").on(t.lastMessageAt),
  ],
);

export const conversationMessagesTable = pgTable(
  "conversation_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    role: conversationMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    toolName: text("tool_name"),
    toolInput: jsonb("tool_input"),
    toolResult: jsonb("tool_result"),
    bookingId: text("booking_id").references(() => bookingsTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("conversation_messages_conversation_idx").on(t.conversationId),
    index("conversation_messages_created_idx").on(t.createdAt),
  ],
);

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
});
export const selectConversationSchema = createSelectSchema(conversationsTable);
export const insertConversationMessageSchema = createInsertSchema(conversationMessagesTable).omit({
  createdAt: true,
});
export const selectConversationMessageSchema = createSelectSchema(conversationMessagesTable);

export type Conversation = typeof conversationsTable.$inferSelect;
export type ConversationMessage = typeof conversationMessagesTable.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;

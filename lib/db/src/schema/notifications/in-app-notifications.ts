import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { businessesTable } from "../identity/businesses";
import { usersTable } from "../identity/users";

export const userNotificationsTable = pgTable(
  "user_notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    businessId: text("business_id").references(() => businessesTable.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    priority: text("priority").notNull().default("info"),
    personaHint: text("persona_hint"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    mobileHref: text("mobile_href"),
    resourceKind: text("resource_kind"),
    resourceId: text("resource_id"),
    dedupeKey: text("dedupe_key").notNull(),
    metadata: jsonb("metadata"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("user_notifications_user_created_idx").on(t.userId, t.createdAt),
    index("user_notifications_business_idx").on(t.businessId, t.createdAt),
  ],
);

export const insertUserNotificationSchema = createInsertSchema(userNotificationsTable).omit({
  createdAt: true,
});
export const selectUserNotificationSchema = createSelectSchema(userNotificationsTable);
export type UserNotification = typeof userNotificationsTable.$inferSelect;
export type InsertUserNotification = typeof userNotificationsTable.$inferInsert;

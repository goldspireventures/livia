import { pgTable, text, timestamp, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const membershipRoleEnum = pgEnum("membership_role", ["OWNER", "ADMIN", "STAFF"]);

export const businessesTable = pgTable(
  "businesses",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    category: text("category"),
    email: text("email"),
    phone: text("phone"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country").default("GB"),
    timezone: text("timezone").notNull().default("Europe/London"),
    logoUrl: text("logo_url"),
    coverImageUrl: text("cover_image_url"),
    websiteUrl: text("website_url"),
    instagramHandle: text("instagram_handle"),
    aiEnabled: text("ai_enabled").notNull().default("true"),
    aiTone: text("ai_tone").notNull().default("FRIENDLY"),
    aiGreeting: text("ai_greeting"),
    aiKnowledge: text("ai_knowledge"),
    aiCanBookDirectly: text("ai_can_book_directly").notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("businesses_slug_idx").on(t.slug),
    index("businesses_owner_idx").on(t.ownerId),
  ],
);

export const businessMembershipsTable = pgTable(
  "business_memberships",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull().default("STAFF"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("memberships_business_idx").on(t.businessId),
    index("memberships_user_idx").on(t.userId),
    uniqueIndex("memberships_unique_idx").on(t.businessId, t.userId),
  ],
);

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({ createdAt: true, updatedAt: true });
export const selectBusinessSchema = createSelectSchema(businessesTable);
export const insertMembershipSchema = createInsertSchema(businessMembershipsTable).omit({ createdAt: true });
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;
export type BusinessMembership = typeof businessMembershipsTable.$inferSelect;

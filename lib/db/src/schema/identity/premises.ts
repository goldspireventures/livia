import { pgTable, text, timestamp, boolean, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { businessesTable } from "./businesses";

export const premisesTable = pgTable(
  "premises",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country").notNull().default("IE"),
    sharedPhone: text("shared_phone"),
    sharedWhatsappPhoneNumberId: text("shared_whatsapp_phone_number_id"),
    /** menu = customer picks tenant; default = route to default_business_id */
    routingMode: text("routing_mode").notNull().default("menu"),
    defaultBusinessId: text("default_business_id").references(() => businessesTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("premises_slug_idx").on(t.slug),
    index("premises_owner_idx").on(t.ownerUserId),
  ],
);

export const premisesTenantsTable = pgTable(
  "premises_tenants",
  {
    id: text("id").primaryKey(),
    premisesId: text("premises_id")
      .notNull()
      .references(() => premisesTable.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    publicLabel: text("public_label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("premises_tenant_unique_idx").on(t.premisesId, t.businessId),
    index("premises_tenants_premises_idx").on(t.premisesId),
    index("premises_tenants_business_idx").on(t.businessId),
  ],
);

export type Premises = typeof premisesTable.$inferSelect;
export type PremisesTenant = typeof premisesTenantsTable.$inferSelect;

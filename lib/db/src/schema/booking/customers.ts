import { pgTable, text, timestamp, boolean, jsonb, index, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "../identity/businesses";

export const channelTypeEnum = pgEnum("channel_type", [
  "WEB", "APP", "WHATSAPP", "SMS", "INSTAGRAM", "SNAPCHAT", "EMAIL",
]);

// Customer's preferred way of being reached for outbound by Liv (per data-model.md).
export const preferredModalityEnum = pgEnum("preferred_modality", [
  "VOICE", "WHATSAPP", "SMS", "EMAIL", "INSTAGRAM", "WEB", "ANY",
]);

// Cohort typology used by Liv to tune phrasing/cadence (per F4 / docs/research/customer-archetypes.md).
export const customerTypologyEnum = pgEnum("customer_typology", [
  "REGULAR", "OCCASIONAL", "LAPSED", "VIP", "AT_RISK", "NEW", "GUEST",
]);

export const customersTable = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    firstName: text("first_name"),
    lastName: text("last_name"),
    displayName: text("display_name"),
    email: text("email"),
    phone: text("phone"),
    notes: text("notes"),
    tags: text("tags").array(),
    isBlocked: boolean("is_blocked").notNull().default(false),
    // Composable monetisation: customer-shape primitives Liv reads on every interaction.
    preferredModality: preferredModalityEnum("preferred_modality").notNull().default("ANY"),
    preferredStaffId: text("preferred_staff_id"),
    customerTypology: customerTypologyEnum("customer_typology").notNull().default("NEW"),
    // GDPR consent ledger: { marketing: bool; sms: bool; whatsapp: bool;
    //   voiceRecording: bool; aiAgentInteraction: bool; updatedAt: ISO; basis: enum }
    consent: jsonb("consent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("customers_business_idx").on(t.businessId),
    index("customers_email_idx").on(t.businessId, t.email),
    index("customers_phone_idx").on(t.businessId, t.phone),
    index("customers_typology_idx").on(t.businessId, t.customerTypology),
    index("customers_preferred_staff_idx").on(t.preferredStaffId),
  ],
);

export const channelIdentitiesTable = pgTable(
  "channel_identities",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    channelType: channelTypeEnum("channel_type").notNull(),
    externalId: text("external_id").notNull(),
    username: text("username"),
    displayName: text("display_name"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("channel_identities_business_idx").on(t.businessId),
    index("channel_identities_customer_idx").on(t.customerId),
    uniqueIndex("channel_identities_external_idx").on(t.businessId, t.channelType, t.externalId),
  ],
);

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ createdAt: true, updatedAt: true });
export const selectCustomerSchema = createSelectSchema(customersTable);
export const insertChannelIdentitySchema = createInsertSchema(channelIdentitiesTable).omit({ createdAt: true, updatedAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
export type ChannelIdentity = typeof channelIdentitiesTable.$inferSelect;

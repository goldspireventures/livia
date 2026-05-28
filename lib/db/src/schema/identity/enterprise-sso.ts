import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";

export const enterpriseSsoConfigsTable = pgTable("enterprise_sso_configs", {
  businessId: text("business_id")
    .primaryKey()
    .references(() => businessesTable.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("oidc"),
  issuerUrl: text("issuer_url"),
  clientId: text("client_id"),
  metadataUrl: text("metadata_url"),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

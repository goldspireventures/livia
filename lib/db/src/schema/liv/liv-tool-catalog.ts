import { pgTable, text, timestamp, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const livToolCatalogTable = pgTable(
  "liv_tool_catalog",
  {
    id: text("id").primaryKey(),
    toolId: text("tool_id").notNull(),
    version: text("version").notNull().default("1.0.0"),
    profile: text("profile").notNull(),
    risk: text("risk").notNull(),
    description: text("description").notNull(),
    inputSchema: jsonb("input_schema").$type<Record<string, unknown>>().notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("liv_tool_catalog_tool_profile_idx").on(t.toolId, t.profile)],
);

export type LivToolCatalogRow = typeof livToolCatalogTable.$inferSelect;

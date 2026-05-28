import { pgTable, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const livPromptVersionsTable = pgTable(
  "liv_prompt_versions",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    promptKey: text("prompt_key").notNull(),
    version: integer("version").notNull().default(1),
    content: text("content").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("liv_prompt_versions_lookup_idx").on(t.businessId, t.promptKey, t.isActive)],
);

export type LivPromptVersion = typeof livPromptVersionsTable.$inferSelect;

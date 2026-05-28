import { pgTable, text, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const livBusinessToolOverridesTable = pgTable(
  "liv_business_tool_overrides",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    toolId: text("tool_id").notNull(),
    profile: text("profile").notNull(),
    enabled: boolean("enabled").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("liv_business_tool_overrides_unique_idx").on(
      t.businessId,
      t.toolId,
      t.profile,
    ),
  ],
);

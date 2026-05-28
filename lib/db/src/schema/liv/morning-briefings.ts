import { pgTable, text, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const morningBriefingsTable = pgTable(
  "morning_briefings",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    briefingDate: text("briefing_date").notNull(),
    content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("morning_briefings_biz_date_idx").on(t.businessId, t.briefingDate),
    index("morning_briefings_business_idx").on(t.businessId),
  ],
);

export type MorningBriefing = typeof morningBriefingsTable.$inferSelect;

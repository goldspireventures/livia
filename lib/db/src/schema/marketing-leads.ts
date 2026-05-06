import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketingLeadsTable = pgTable(
  "marketing_leads",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    source: text("source").notNull().default("livia.io"),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("marketing_leads_email_idx").on(t.email),
    index("marketing_leads_created_at_idx").on(t.createdAt),
  ],
);

export const insertMarketingLeadSchema = createInsertSchema(
  marketingLeadsTable,
).omit({ id: true, createdAt: true });

export const selectMarketingLeadSchema = createSelectSchema(marketingLeadsTable);

export type MarketingLead = typeof marketingLeadsTable.$inferSelect;
export type InsertMarketingLead = z.infer<typeof insertMarketingLeadSchema>;

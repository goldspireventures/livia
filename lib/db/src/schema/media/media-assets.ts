import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const mediaAssetsTable = pgTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("image"),
    url: text("url").notNull(),
    mimeType: text("mime_type"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_assets_business_entity_idx").on(t.businessId, t.entityType, t.entityId)],
);

export type MediaAsset = typeof mediaAssetsTable.$inferSelect;

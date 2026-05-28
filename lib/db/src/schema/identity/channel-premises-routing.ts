import { pgTable, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { premisesTable } from "./premises";
import { businessesTable } from "./businesses";

export const channelPremisesRoutingTable = pgTable(
  "channel_premises_routing",
  {
    id: text("id").primaryKey(),
    premisesId: text("premises_id")
      .notNull()
      .references(() => premisesTable.id, { onDelete: "cascade" }),
    customerPhone: text("customer_phone").notNull(),
    selectedBusinessId: text("selected_business_id").references(() => businessesTable.id, {
      onDelete: "set null",
    }),
    pendingMenuSentAt: timestamp("pending_menu_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("channel_premises_routing_unique_idx").on(t.premisesId, t.customerPhone),
    index("channel_premises_routing_phone_idx").on(t.customerPhone),
  ],
);

export type ChannelPremisesRouting = typeof channelPremisesRoutingTable.$inferSelect;

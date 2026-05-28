import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { conversationsTable } from "../conversations/conversations";

/** Active Twilio call ↔ Liv conversation mapping (ephemeral per call). */
export const voiceCallSessionsTable = pgTable(
  "voice_call_sessions",
  {
    callSid: text("call_sid").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    customerPhone: text("customer_phone").notNull(),
    turnCount: integer("turn_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("voice_call_sessions_business_idx").on(t.businessId),
    index("voice_call_sessions_conversation_idx").on(t.conversationId),
  ],
);

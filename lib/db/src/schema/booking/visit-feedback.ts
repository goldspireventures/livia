import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { bookingsTable } from "./bookings";
import { businessesTable } from "../identity/businesses";
import { customersTable } from "./customers";

export const visitFeedbackTable = pgTable(
  "visit_feedback",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookingsTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("visit_feedback_business_idx").on(t.businessId),
    index("visit_feedback_booking_idx").on(t.bookingId),
    index("visit_feedback_created_idx").on(t.businessId, t.createdAt),
  ],
);

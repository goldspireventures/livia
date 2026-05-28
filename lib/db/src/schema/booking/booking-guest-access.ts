import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { bookingsTable } from "./bookings";
import { businessesTable } from "../identity/businesses";

/** Opaque token for customer self-serve (receipt, running late, feedback) without login. */
export const bookingGuestAccessTable = pgTable(
  "booking_guest_access",
  {
    bookingId: text("booking_id")
      .primaryKey()
      .references(() => bookingsTable.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("booking_guest_access_business_idx").on(t.businessId),
    index("booking_guest_access_token_idx").on(t.token),
  ],
);

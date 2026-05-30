import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { medicalIntakeRecordsTable } from "./medspa";
import { businessesTable } from "../identity/businesses";

/** Opaque token for guest medical intake without login. */
export const medicalIntakeGuestAccessTable = pgTable(
  "medical_intake_guest_access",
  {
    intakeId: text("intake_id")
      .primaryKey()
      .references(() => medicalIntakeRecordsTable.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("medical_intake_guest_access_token_idx").on(t.token),
  ],
);

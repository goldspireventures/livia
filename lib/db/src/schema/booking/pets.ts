import { pgTable, text, timestamp, numeric, index, primaryKey } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { customersTable } from "./customers";
import { bookingsTable } from "./bookings";

export const petsTable = pgTable(
  "pets",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    species: text("species").notNull().default("dog"),
    breed: text("breed"),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
    behaviourNotes: text("behaviour_notes"),
    allergyNotes: text("allergy_notes"),
    vaccinationNotes: text("vaccination_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pets_business_customer_idx").on(t.businessId, t.customerId)],
);

export const bookingPetsTable = pgTable(
  "booking_pets",
  {
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookingsTable.id, { onDelete: "cascade" }),
    petId: text("pet_id")
      .notNull()
      .references(() => petsTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.bookingId, t.petId] })],
);

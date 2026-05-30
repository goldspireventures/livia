import { pgTable, text, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const guestIdentitiesTable = pgTable("guest_identities", {
  id: text("id").primaryKey(),
  phoneE164: text("phone_e164").notNull().unique(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guestSessionsTable = pgTable(
  "guest_sessions",
  {
    token: text("token").primaryKey(),
    guestId: text("guest_id").references(() => guestIdentitiesTable.id, { onDelete: "cascade" }),
    phoneE164: text("phone_e164").notNull(),
    otpCode: text("otp_code"),
    otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("guest_sessions_phone_idx").on(t.phoneE164)],
);

export const guestShopLinksTable = pgTable(
  "guest_shop_links",
  {
    guestId: text("guest_id")
      .notNull()
      .references(() => guestIdentitiesTable.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    firstBookingAt: timestamp("first_booking_at", { withTimezone: true }),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.guestId, t.businessId] }),
    index("guest_shop_links_business_idx").on(t.businessId),
  ],
);

export const guestFavoritesTable = pgTable(
  "guest_favorites",
  {
    guestId: text("guest_id")
      .notNull()
      .references(() => guestIdentitiesTable.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    pinnedAt: timestamp("pinned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.guestId, t.businessId] })],
);

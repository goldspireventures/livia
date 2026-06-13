import { pgTable, text, timestamp, integer, boolean, date, jsonb, index, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";
import { customersTable } from "./customers";
import { servicesTable } from "./services";

export const eventVendorSiteTable = pgTable("event_vendor_site", {
  businessId: text("business_id")
    .primaryKey()
    .references(() => businessesTable.id, { onDelete: "cascade" }),
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  aboutText: text("about_text"),
  gallery: jsonb("gallery").$type<Array<{ url: string; caption?: string; eventType?: string }>>().notNull().default([]),
  blockedDates: jsonb("blocked_dates").$type<string[]>().notNull().default([]),
  quoteValidityDays: integer("quote_validity_days").notNull().default(14),
  defaultDepositPercent: integer("default_deposit_percent").notNull().default(30),
  termsText: text("terms_text"),
  /** Operator template for Liv — sent when an enquiry is closed as not a fit. */
  declineReplyTemplate: text("decline_reply_template"),
  /** Liv thanks after enquire form submit (WhatsApp assist / copy). */
  enquiryThanksTemplate: text("enquiry_thanks_template"),
  /** Liv quote send assist (WhatsApp copy). */
  quoteWhatsappTemplate: text("quote_whatsapp_template"),
  milestoneDepositTemplate: jsonb("milestone_deposit_template")
    .$type<Array<{ label: string; percent: number; dueDaysBeforeEvent?: number }>>()
    .notNull()
    .default([]),
  setupFeeMinor: integer("setup_fee_minor").notNull().default(0),
  outdoorTermsExtra: text("outdoor_terms_extra"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventMoodBoardItemsTable = pgTable(
  "event_mood_board_items",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    enquiryId: text("enquiry_id")
      .notNull()
      .references(() => enquiriesTable.id, { onDelete: "cascade" }),
    imageUrl: text("image_url"),
    note: text("note"),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("event_mood_board_enquiry_idx").on(t.enquiryId)],
);

export const enquiriesTable = pgTable(
  "enquiries",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
    status: text("status").notNull().default("new"),
    source: text("source").notNull().default("web"),
    eventType: text("event_type"),
    eventDate: date("event_date"),
    eventDateFlexible: boolean("event_date_flexible").notNull().default(false),
    guestCount: integer("guest_count"),
    budgetMinor: integer("budget_minor"),
    budgetRange: text("budget_range"),
    theme: text("theme"),
    notes: text("notes"),
    servicesRequested: jsonb("services_requested").$type<string[]>().notNull().default([]),
    inspirationUrls: jsonb("inspiration_urls").$type<string[]>().notNull().default([]),
    preferredQuoteChannel: text("preferred_quote_channel").notNull().default("email"),
    venue: text("venue"),
    contactName: text("contact_name").notNull(),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone"),
    partnerName: text("partner_name"),
    partnerPhone: text("partner_phone"),
    plannerName: text("planner_name"),
    plannerEmail: text("planner_email"),
    plannerPhone: text("planner_phone"),
    eventDateHoldStatus: text("event_date_hold_status"),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    firstOperatorReplyAt: timestamp("first_operator_reply_at", { withTimezone: true }),
    moodBoardApprovalToken: text("mood_board_approval_token"),
    moodBoardStatus: text("mood_board_status").notNull().default("draft"),
    plannerAccessToken: text("planner_access_token"),
    internalNotes: text("internal_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("enquiries_business_status_idx").on(t.businessId, t.status),
    index("enquiries_business_created_idx").on(t.businessId, t.createdAt),
  ],
);

export const quoteTemplatesTable = pgTable(
  "quote_templates",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    eventTypes: jsonb("event_types").$type<string[]>().notNull().default([]),
    presetLines: jsonb("preset_lines")
      .$type<Array<{ serviceName: string; quantity?: number; unit?: string }>>()
      .notNull()
      .default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("quote_templates_business_idx").on(t.businessId)],
);

export const quotesTable = pgTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    enquiryId: text("enquiry_id").references(() => enquiriesTable.id, { onDelete: "set null" }),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
    status: text("status").notNull().default("draft"),
    personalMessage: text("personal_message"),
    depositPercent: integer("deposit_percent").notNull().default(30),
    subtotalMinor: integer("subtotal_minor").notNull().default(0),
    depositAmountMinor: integer("deposit_amount_minor").notNull().default(0),
    balanceDueMinor: integer("balance_due_minor").notNull().default(0),
    validUntil: date("valid_until"),
    termsSnapshot: text("terms_snapshot"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    sentVia: text("sent_via"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    publicToken: text("public_token").notNull(),
    eventDaySheet: jsonb("event_day_sheet").$type<Record<string, unknown>>(),
    milestoneDeposits: jsonb("milestone_deposits")
      .$type<Array<{ label: string; percent: number; amountMinor: number; dueDate?: string }>>()
      .notNull()
      .default([]),
    depositPaidMinor: integer("deposit_paid_minor").notNull().default(0),
    supersedesQuoteId: text("supersedes_quote_id"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("quotes_public_token_idx").on(t.publicToken),
    index("quotes_business_status_idx").on(t.businessId, t.status),
    index("quotes_enquiry_idx").on(t.enquiryId),
  ],
);

export const quoteLineItemsTable = pgTable(
  "quote_line_items",
  {
    id: text("id").primaryKey(),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotesTable.id, { onDelete: "cascade" }),
    serviceId: text("service_id").references(() => servicesTable.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    quantity: numeric("quantity").notNull().default("1"),
    unit: text("unit").notNull().default("flat"),
    unitPriceMinor: integer("unit_price_minor").notNull().default(0),
    lineTotalMinor: integer("line_total_minor").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("quote_line_items_quote_idx").on(t.quoteId)],
);

export type Enquiry = typeof enquiriesTable.$inferSelect;
export type Quote = typeof quotesTable.$inferSelect;
export type QuoteLineItem = typeof quoteLineItemsTable.$inferSelect;
export type EventVendorSite = typeof eventVendorSiteTable.$inferSelect;
export type QuoteTemplate = typeof quoteTemplatesTable.$inferSelect;

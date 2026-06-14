import { pgTable, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { businessesTable } from "../identity/businesses";
import { customersTable } from "../booking/customers";
import { bookingsTable } from "../booking/bookings";

export const retailProductsTable = pgTable(
  "retail_products",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    priceMinor: integer("price_minor").notNull().default(0),
    currency: text("currency").notNull().default("EUR"),
    sku: text("sku"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    category: text("category"),
    aftercareUsageText: text("aftercare_usage_text"),
    linkedServiceCategory: text("linked_service_category"),
    /** Null = unlimited; decrements when orders are paid. Owner restocks by editing. */
    stockQuantity: integer("stock_quantity"),
    /** Cumulative units sold — Liv increments on paid retail orders. */
    soldQuantity: integer("sold_quantity").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("retail_products_business_idx").on(t.businessId),
    index("retail_products_active_idx").on(t.businessId, t.isActive),
  ],
);

export const retailOrdersTable = pgTable(
  "retail_orders",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    /** Legacy single-SKU orders; null when cart uses retail_order_lines. */
    productId: text("product_id").references(() => retailProductsTable.id, { onDelete: "restrict" }),
    customerId: text("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
    bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
    guestName: text("guest_name"),
    guestEmail: text("guest_email"),
    guestPhone: text("guest_phone"),
    quantity: integer("quantity").notNull().default(1),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("EUR"),
    status: text("status").notNull().default("PENDING"),
    payToken: text("pay_token").notNull().unique(),
    fulfillmentMode: text("fulfillment_mode"),
    fulfillmentDetail: text("fulfillment_detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("retail_orders_business_idx").on(t.businessId),
    index("retail_orders_token_idx").on(t.payToken),
  ],
);

export const insertRetailProductSchema = createInsertSchema(retailProductsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export const retailOrderLinesTable = pgTable(
  "retail_order_lines",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => retailOrdersTable.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => retailProductsTable.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    lineTotalMinor: integer("line_total_minor").notNull(),
    currency: text("currency").notNull().default("EUR"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("retail_order_lines_order_idx").on(t.orderId)],
);

export type RetailProduct = typeof retailProductsTable.$inferSelect;
export type RetailOrder = typeof retailOrdersTable.$inferSelect;
export type RetailOrderLine = typeof retailOrderLinesTable.$inferSelect;

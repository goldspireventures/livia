import {
  db,
  businessesTable,
  retailProductsTable,
  retailOrdersTable,
  retailOrderLinesTable,
  paymentIntentRecordsTable,
} from "@workspace/db";
import { and, asc, eq, or, isNull, gt, inArray } from "drizzle-orm";
import {
  TENANT_RETAIL_PROGRAM,
  inferPublicServiceImageFromName,
  isRetailProductInStock,
  normalizeRetailCartItems,
  parseTenantRetailStoreSettings,
  resolveTenantRetailPack,
  tenantRetailTemplatesForBusiness,
  verticalSupportsRetail,
  type RetailCartItemInput,
  type TenantRetailStoreSettings,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { getBusinessById } from "./businesses.service";
import { getStripe, isStripeConfigured, logStripeSkip } from "../lib/stripe";
import { resolveGuestTokenUrl } from "../lib/guest-public-urls";
import { createBookingPaymentIntent } from "./payment.service";
import { EventType } from "@workspace/db";
import { logEvent } from "./events.service";
import crypto from "node:crypto";

function payToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export async function getRetailStoreBundle(businessId: string) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const settings = parseTenantRetailStoreSettings(biz.retailStore);
  const products = await db
    .select()
    .from(retailProductsTable)
    .where(eq(retailProductsTable.businessId, businessId))
    .orderBy(asc(retailProductsTable.sortOrder), asc(retailProductsTable.name));
  return { settings, products };
}

export async function listActiveRetailProducts(businessId: string) {
  return db
    .select()
    .from(retailProductsTable)
    .where(
      and(
        eq(retailProductsTable.businessId, businessId),
        eq(retailProductsTable.isActive, true),
        or(isNull(retailProductsTable.stockQuantity), gt(retailProductsTable.stockQuantity, 0)),
      ),
    )
    .orderBy(asc(retailProductsTable.sortOrder), asc(retailProductsTable.name))
    .limit(TENANT_RETAIL_PROGRAM.publicMaxVisible);
}

export async function updateRetailStoreSettings(
  businessId: string,
  patch: Partial<TenantRetailStoreSettings>,
) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const current = parseTenantRetailStoreSettings(biz.retailStore);
  const next = { ...current, ...patch };
  const [row] = await db
    .update(businessesTable)
    .set({ retailStore: next, updatedAt: new Date() })
    .where(eq(businessesTable.id, businessId))
    .returning({ retailStore: businessesTable.retailStore });
  return parseTenantRetailStoreSettings(row?.retailStore);
}

export async function createRetailProduct(
  businessId: string,
  data: {
    name: string;
    description?: string;
    priceMinor: number;
    currency?: string;
    sku?: string;
    imageUrl?: string;
    sortOrder?: number;
    category?: string;
    stockQuantity?: number | null;
  },
) {
  const biz = await getBusinessById(businessId);
  const stockQuantity = normalizeStockQuantity(data.stockQuantity);
  const [row] = await db
    .insert(retailProductsTable)
    .values({
      id: generateId(),
      businessId,
      name: data.name,
      description: data.description,
      priceMinor: data.priceMinor,
      currency: data.currency ?? biz?.currency ?? "EUR",
      sku: data.sku,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder ?? 0,
      category: data.category,
      stockQuantity,
      soldQuantity: 0,
      isActive: true,
    })
    .returning();
  return row;
}

function normalizeStockQuantity(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

async function applyRetailInventoryOnPaid(lines: { productId: string; quantity: number }[]) {
  for (const line of lines) {
    const [product] = await db
      .select()
      .from(retailProductsTable)
      .where(eq(retailProductsTable.id, line.productId))
      .limit(1);
    if (!product) continue;

    const qty = Math.max(1, line.quantity);
    const nextSold = (product.soldQuantity ?? 0) + qty;
    const nextStock =
      product.stockQuantity != null ? Math.max(0, product.stockQuantity - qty) : product.stockQuantity;

    await db
      .update(retailProductsTable)
      .set({
        soldQuantity: nextSold,
        stockQuantity: nextStock,
        updatedAt: new Date(),
      })
      .where(eq(retailProductsTable.id, product.id));
  }
}

export type RetailOrderLineView = {
  id: string;
  productId: string;
  productName: string;
  productDescription: string | null;
  productImageUrl: string | null;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  currency: string;
};

async function listRetailOrderLineViews(orderId: string): Promise<RetailOrderLineView[]> {
  const rows = await db
    .select({
      line: retailOrderLinesTable,
      product: retailProductsTable,
    })
    .from(retailOrderLinesTable)
    .innerJoin(retailProductsTable, eq(retailOrderLinesTable.productId, retailProductsTable.id))
    .where(eq(retailOrderLinesTable.orderId, orderId))
    .orderBy(asc(retailOrderLinesTable.sortOrder));

  return rows.map(({ line, product }) => ({
    id: line.id,
    productId: product.id,
    productName: product.name,
    productDescription: product.description,
    productImageUrl: product.imageUrl,
    quantity: line.quantity,
    unitPriceMinor: line.unitPriceMinor,
    lineTotalMinor: line.lineTotalMinor,
    currency: line.currency,
  }));
}

export async function resolveRetailOrderLines(order: {
  id: string;
  productId: string | null;
  quantity: number;
  amountMinor: number;
  currency: string;
}): Promise<RetailOrderLineView[]> {
  const lines = await listRetailOrderLineViews(order.id);
  if (lines.length > 0) return lines;
  if (!order.productId) return [];

  const [product] = await db
    .select()
    .from(retailProductsTable)
    .where(eq(retailProductsTable.id, order.productId))
    .limit(1);
  if (!product) return [];

  const unit = Math.round(order.amountMinor / Math.max(1, order.quantity));
  return [
    {
      id: order.id,
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      productImageUrl: product.imageUrl,
      quantity: order.quantity,
      unitPriceMinor: unit,
      lineTotalMinor: order.amountMinor,
      currency: order.currency,
    },
  ];
}

export async function updateRetailProduct(
  businessId: string,
  productId: string,
  data: Partial<typeof retailProductsTable.$inferInsert>,
) {
  const [row] = await db
    .update(retailProductsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(retailProductsTable.id, productId), eq(retailProductsTable.businessId, businessId)))
    .returning();
  return row ?? null;
}

export async function seedRetailTemplatesForBusiness(
  businessId: string,
  opts?: { enableStore?: boolean },
) {
  const biz = await getBusinessById(businessId);
  if (!biz || !verticalSupportsRetail(biz.vertical)) return { seeded: 0 };

  const existing = await db
    .select({ id: retailProductsTable.id })
    .from(retailProductsTable)
    .where(eq(retailProductsTable.businessId, businessId))
    .limit(1);
  if (existing.length > 0) return { seeded: 0 };

  const templates = tenantRetailTemplatesForBusiness(biz.vertical, biz.subverticalProfileId);
  const pack = resolveTenantRetailPack(biz.vertical, biz.subverticalProfileId);
  const currency = biz.currency ?? "EUR";

  for (const t of templates) {
    await createRetailProduct(businessId, {
      name: t.name,
      description: t.description ?? undefined,
      priceMinor: t.priceMinor,
      currency: t.currency ?? currency,
      sku: t.sku ?? undefined,
      imageUrl: t.imageUrl ?? inferPublicServiceImageFromName(t.name),
      sortOrder: t.sortOrder ?? 0,
      category: t.category,
    });
  }

  await updateRetailStoreSettings(businessId, {
    enabled: opts?.enableStore === true,
    title: pack?.defaultPublicTitle,
  });

  return { seeded: templates.length };
}

/** @deprecated use seedRetailTemplatesForBusiness */
export async function seedBeautyRetailTemplates(businessId: string) {
  return seedRetailTemplatesForBusiness(businessId);
}

/** @deprecated use seedRetailTemplatesForBusiness */
export async function seedWellnessRetailTemplates(businessId: string) {
  return seedRetailTemplatesForBusiness(businessId);
}

export async function ensureRetailShowcaseDepth(businessId: string) {
  const result = await seedRetailTemplatesForBusiness(businessId, { enableStore: true });
  return result.seeded;
}

export async function createPublicRetailOrder(args: {
  businessId: string;
  productId?: string;
  items?: RetailCartItemInput[];
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  quantity?: number;
  customerId?: string;
  bookingId?: string;
}) {
  const normalized = normalizeRetailCartItems(
    args.items?.length
      ? args.items
      : args.productId
        ? [{ productId: args.productId, quantity: args.quantity }]
        : [],
  );
  if (normalized.length === 0) return null;

  const productIds = normalized.map((i: { productId: string; quantity: number }) => i.productId);
  const products = await db
    .select()
    .from(retailProductsTable)
    .where(
      and(
        eq(retailProductsTable.businessId, args.businessId),
        eq(retailProductsTable.isActive, true),
        inArray(retailProductsTable.id, productIds),
      ),
    );

  const byId = new Map(products.map((p) => [p.id, p]));
  const lineDrafts: {
    product: (typeof products)[number];
    quantity: number;
    lineTotalMinor: number;
  }[] = [];

  for (const item of normalized) {
    const product = byId.get(item.productId);
    if (!product || !isRetailProductInStock(product.stockQuantity)) return null;
    if (product.stockQuantity != null && item.quantity > product.stockQuantity) return null;
    lineDrafts.push({
      product,
      quantity: item.quantity,
      lineTotalMinor: product.priceMinor * item.quantity,
    });
  }

  const currencies = new Set(lineDrafts.map((l) => l.product.currency));
  if (currencies.size !== 1) return null;

  const currency = lineDrafts[0]!.product.currency;
  const amountMinor = lineDrafts.reduce((sum, l) => sum + l.lineTotalMinor, 0);
  const totalQty = lineDrafts.reduce((sum, l) => sum + l.quantity, 0);
  const token = payToken();
  const orderId = generateId();
  const primary = lineDrafts[0]!.product;

  const [order] = await db
    .insert(retailOrdersTable)
    .values({
      id: orderId,
      businessId: args.businessId,
      ...(lineDrafts.length === 1 ? { productId: primary.id } : {}),
      guestName: args.guestName?.trim() || null,
      guestEmail: args.guestEmail?.trim() || null,
      guestPhone: args.guestPhone?.trim() || null,
      customerId: args.customerId ?? null,
      bookingId: args.bookingId ?? null,
      quantity: totalQty,
      amountMinor,
      currency,
      status: "PENDING",
      payToken: token,
    })
    .returning();

  await db.insert(retailOrderLinesTable).values(
    lineDrafts.map((line, index) => ({
      id: generateId(),
      orderId,
      productId: line.product.id,
      quantity: line.quantity,
      unitPriceMinor: line.product.priceMinor,
      lineTotalMinor: line.lineTotalMinor,
      currency: line.product.currency,
      sortOrder: index,
    })),
  );

  return {
    order,
    product: primary,
    products: lineDrafts.map((l) => l.product),
    lines: lineDrafts,
    payToken: token,
  };
}

export async function getRetailOrderByToken(slug: string, token: string) {
  const [row] = await db
    .select({
      order: retailOrdersTable,
      business: businessesTable,
    })
    .from(retailOrdersTable)
    .innerJoin(businessesTable, eq(retailOrdersTable.businessId, businessesTable.id))
    .where(and(eq(businessesTable.slug, slug), eq(retailOrdersTable.payToken, token)))
    .limit(1);
  if (!row) return null;

  let product: (typeof retailProductsTable.$inferSelect) | null = null;
  if (row.order.productId) {
    const [hit] = await db
      .select()
      .from(retailProductsTable)
      .where(eq(retailProductsTable.id, row.order.productId))
      .limit(1);
    product = hit ?? null;
  }
  if (!product) {
    const lines = await listRetailOrderLineViews(row.order.id);
    if (lines[0]) {
      const [hit] = await db
        .select()
        .from(retailProductsTable)
        .where(eq(retailProductsTable.id, lines[0].productId))
        .limit(1);
      product = hit ?? null;
    }
  }
  if (!product) return null;

  return { order: row.order, product, business: row.business };
}

export async function markRetailOrderPaid(retailOrderId: string, businessId?: string | null) {
  const [order] = await db
    .select()
    .from(retailOrdersTable)
    .where(eq(retailOrdersTable.id, retailOrderId))
    .limit(1);
  if (!order) return false;
  if (order.status === "PAID") return true;

  const [row] = await db
    .update(retailOrdersTable)
    .set({ status: "PAID", updatedAt: new Date() })
    .where(eq(retailOrdersTable.id, retailOrderId))
    .returning({ id: retailOrdersTable.id, businessId: retailOrdersTable.businessId });
  if (!row) return false;

  const lineRows = await db
    .select({
      productId: retailOrderLinesTable.productId,
      quantity: retailOrderLinesTable.quantity,
    })
    .from(retailOrderLinesTable)
    .where(eq(retailOrderLinesTable.orderId, retailOrderId));

  const inventoryLines =
    lineRows.length > 0
      ? lineRows
      : order.productId
        ? [{ productId: order.productId, quantity: order.quantity }]
        : [];

  await applyRetailInventoryOnPaid(inventoryLines);

  await logEvent({
    businessId: businessId ?? row.businessId,
    type: EventType.PAYMENT_SUCCEEDED,
    entityType: "booking",
    entityId: row.id,
    context: {
      retailOrder: true,
      retailOrderId: row.id,
      quantity: order.quantity,
      lineCount: inventoryLines.length,
    },
  });
  return true;
}

export type RetailCheckoutResult =
  | { mode: "stripe"; checkoutUrl: string; payUrl: string }
  | { mode: "dev"; message: string; payUrl: string }
  | { mode: "error"; message: string };

export async function createRetailOrderCheckout(slug: string, token: string): Promise<RetailCheckoutResult> {
  const hit = await getRetailOrderByToken(slug, token);
  if (!hit) return { mode: "error", message: "Order not found" };
  const { order, product, business } = hit;
  if (order.status === "PAID") return { mode: "error", message: "Already paid" };

  const payUrl = resolveGuestTokenUrl(slug, "shop", token);
  const lineViews = await resolveRetailOrderLines(order);
  const checkoutLabel =
    lineViews.length > 1
      ? `${lineViews.length} items from ${business.name}`
      : `${lineViews[0]?.productName ?? product.name} × ${lineViews[0]?.quantity ?? order.quantity}`;

  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return { mode: "error", message: "Card checkout is not available yet" };
    }
    logStripeSkip("retail-checkout");
    await markRetailOrderPaid(order.id, order.businessId);
    return {
      mode: "dev",
      message: "Order recorded (development — Stripe not configured).",
      payUrl,
    };
  }

  const intent = await createBookingPaymentIntent({
    businessId: order.businessId,
    bookingId: null,
    amountMinor: order.amountMinor,
    currency: order.currency,
    description: checkoutLabel,
    metadata: { retailOrderId: order.id, kind: "retail_order" },
  });

  const stripeLineItems =
    lineViews.length > 0
      ? lineViews.map((line) => ({
          price_data: {
            currency: line.currency.toLowerCase(),
            unit_amount: line.unitPriceMinor,
            product_data: {
              name: line.productName,
              description: business.name,
            },
          },
          quantity: line.quantity,
        }))
      : [
          {
            price_data: {
              currency: order.currency.toLowerCase(),
              unit_amount: order.amountMinor,
              product_data: {
                name: product.name,
                description: business.name,
              },
            },
            quantity: 1,
          },
        ];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: stripeLineItems,
    payment_intent_data: {
      metadata: {
        businessId: order.businessId,
        retailOrderId: order.id,
        paymentIntentRecordId: intent.paymentIntentRecordId,
        kind: "retail_order",
        payToken: token,
      },
    },
    metadata: {
      businessId: order.businessId,
      retailOrderId: order.id,
      kind: "retail_order",
      payToken: token,
    },
    success_url: `${payUrl}?status=success`,
    cancel_url: `${payUrl}?status=cancel`,
  });

  if (session.url) {
    await db
      .update(paymentIntentRecordsTable)
      .set({ checkoutUrl: session.url, updatedAt: new Date() })
      .where(eq(paymentIntentRecordsTable.id, intent.paymentIntentRecordId));
  }

  return session.url
    ? { mode: "stripe", checkoutUrl: session.url, payUrl }
    : { mode: "error", message: "Could not start checkout" };
}

export async function createRetailPayLinkForStaff(args: {
  businessId: string;
  productId: string;
  customerId?: string;
  guestName?: string;
}) {
  const order = await createPublicRetailOrder({
    businessId: args.businessId,
    productId: args.productId,
    guestName: args.guestName,
    quantity: 1,
  });
  if (!order) return null;
  const biz = await getBusinessById(args.businessId);
  if (!biz?.slug) return null;
  const payUrl = resolveGuestTokenUrl(biz.slug, "shop", order.payToken);
  return {
    payUrl,
    productName: order.product.name,
    smsBody: `${order.product.name}: ${payUrl}`,
  };
}

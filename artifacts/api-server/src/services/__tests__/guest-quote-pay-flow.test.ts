/**
 * Integration smoke — requires DB + .env (run from api-server package).
 * node --import dotenv/config --import tsx/esm src/services/__tests__/guest-quote-pay-flow.test.ts
 */
import assert from "node:assert/strict";
import { db, businessesTable, quotesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  createGuestQuoteDepositCheckout,
  getGuestQuotePayView,
} from "../guest-quote-pay.service";
import { acceptPublicQuote } from "../consult-first.service";

const slug = "atelier-decor-dublin";

const [biz] = await db
  .select()
  .from(businessesTable)
  .where(eq(businessesTable.slug, slug))
  .limit(1);
assert.ok(biz, `business ${slug} missing — run pnpm demo:repair`);

let [quote] = await db
  .select()
  .from(quotesTable)
  .where(
    and(
      eq(quotesTable.businessId, biz.id),
      eq(quotesTable.status, "sent"),
    ),
  )
  .orderBy(desc(quotesTable.updatedAt))
  .limit(1);

if (!quote) {
  [quote] = await db
    .select()
    .from(quotesTable)
    .where(eq(quotesTable.businessId, biz.id))
    .orderBy(desc(quotesTable.updatedAt))
    .limit(1);
}

assert.ok(quote, "no quotes for atelier — run pnpm demo:repair");
console.log("quote", {
  id: quote.id,
  status: quote.status,
  token: quote.publicToken,
  depositAmountMinor: quote.depositAmountMinor,
  depositPaidMinor: quote.depositPaidMinor,
});

if (quote.status === "sent") {
  const accepted = await acceptPublicQuote(slug, quote.publicToken);
  assert.ok(accepted, "acceptPublicQuote failed");
  quote = accepted;
}

const payView = await getGuestQuotePayView(slug, quote.publicToken);
assert.ok(payView, "getGuestQuotePayView null");
console.log("payView", payView);
assert.equal(payView!.checkoutAvailable, true, "checkout should be available in dev");

const checkout = await createGuestQuoteDepositCheckout(slug, quote.publicToken);
console.log("checkout", checkout);
assert.notEqual(checkout.mode, "error", `checkout error: ${checkout.mode === "error" ? checkout.message : ""}`);

console.log("guest-quote-pay-flow.test.ts OK");

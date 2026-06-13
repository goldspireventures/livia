import assert from "node:assert/strict";
import {
  formatOperatorDecisionMemory,
  parseOperatorDecisionMemory,
  resolveLivOutboundCopy,
  scoreEnquiryRevenueFit,
} from "../liv-operator-learning-policy";

const decline = parseOperatorDecisionMemory(
  formatOperatorDecisionMemory({
    kind: "decline",
    eventType: "birthday",
    guestCount: 15,
    budgetRange: "€200–€400",
  }),
)!;
assert.equal(decline.kind, "decline");
assert.equal(decline.guestCount, 15);

const patterns = [
  decline,
  { ...decline, at: "" },
  {
    kind: "quote_sent" as const,
    eventType: "wedding",
    guestCount: 120,
    budgetRange: "€2k+",
    at: "",
  },
];

const low = scoreEnquiryRevenueFit(
  { eventType: "birthday", guestCount: 12, budgetRange: "€200–€400" },
  patterns,
);
assert.equal(low.tier, "low");

const high = scoreEnquiryRevenueFit(
  { eventType: "wedding", guestCount: 110, budgetRange: "€3,000–€5,000" },
  patterns,
);
assert.equal(high.tier, "high");

const wa = resolveLivOutboundCopy("quote_whatsapp", {
  firstName: "Sarah",
  businessName: "Atelier",
  total: "€850",
  quoteUrl: "https://example.com/q/1",
});
assert.ok(wa.includes("Sarah"));
assert.ok(wa.includes("€850"));

console.log("liv-operator-learning.test.ts OK");

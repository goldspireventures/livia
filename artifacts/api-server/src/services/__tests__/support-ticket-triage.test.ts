import assert from "node:assert/strict";
import { triageSupportTicket } from "../support-ticket-triage.service";

const billing = triageSupportTicket({
  category: "billing",
  description: "Stripe subscription shows past_due and we cannot open billing portal",
});
assert.equal(billing.priority, "urgent");
assert.ok(billing.tags.includes("billing"));

const copy = triageSupportTicket({
  category: "bug",
  description: "Dashboard still says Shop settings for our physio practice",
});
assert.ok(copy.tags.includes("vertical_copy"));
assert.match(copy.suggestedReply, /Practice/i);

const inbox = triageSupportTicket({
  category: "bug",
  description: "Inbox thread list empty after refresh",
  context: { surfaceId: "dashboard.inbox", route: "/inbox" },
});
assert.ok(inbox.tags.includes("surface:dashboard.inbox"));
assert.ok(inbox.tags.includes("owner:liv"));

console.log("support-ticket-triage.test.ts: ok");

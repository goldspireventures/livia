import assert from "node:assert/strict";
import { ownerIntelBadgesForNav, ownerIntelligenceNavBadges } from "../owner-intelligence-nav";

const badges = ownerIntelligenceNavBadges({
  remediationTasks: [{ severity: "act" }, { severity: "watch" }],
  commerce: { topSignal: { severity: "act" } },
  commerceCapabilityBlockers: [{ capabilityId: "payments" }],
  livPrompts: ["Review billing"],
});
assert.equal(badges.billingActCount, 3);
assert.equal(badges.homeActCount, 4);
assert.equal(badges.livActCount, 1);

const nav = ownerIntelBadgesForNav({
  commerceCapabilityBlockers: [
    {
      capabilityId: "payments",
      capabilityName: "Payments",
      blocker: "Connect Stripe",
      href: "/settings?tab=billing#commerce-fix",
    },
  ],
});
assert.equal(nav["/settings"], 1);

const inboxOnly = ownerIntelBadgesForNav({
  twinRisks: [{ id: "h", title: "Handoffs", body: "Reply", href: "/inbox" }],
});
assert.equal(inboxOnly["/settings"], undefined);

console.log("owner-intelligence-nav.test.ts OK");

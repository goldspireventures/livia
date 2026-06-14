import assert from "node:assert/strict";
import { operatorRouteForResource } from "../notification-policy";
import {
  resolveResourceEngagementEvent,
  resolveResourceStatusTransition,
} from "../resource-transition-program";
import { RESOURCE_FOLLOW_UP_RULES } from "../resource-follow-up-program";

const ctx = {
  resourceId: "proof-1",
  businessId: "biz-1",
  displayLabel: "Serpent & bloom — half sleeve",
  guestFeedback: "Make the serpent smaller",
  version: 2,
};

const guestReject = resolveResourceStatusTransition({
  resourceKind: "design_proof",
  fromStatus: "pending_review",
  toStatus: "rejected",
  actor: "guest",
  context: ctx,
});
assert.equal(guestReject?.kind, "design-proof.changes_requested");
assert.equal(guestReject?.priority, "act");
assert.equal(guestReject?.sendPush, true);
assert.ok(guestReject?.body.includes("smaller"));

const studioSend = resolveResourceStatusTransition({
  resourceKind: "design_proof",
  fromStatus: "draft",
  toStatus: "pending_review",
  actor: "studio",
  context: ctx,
});
assert.equal(studioSend?.kind, "design-proof.awaiting_client");

const silent = resolveResourceStatusTransition({
  resourceKind: "design_proof",
  fromStatus: "pending_review",
  toStatus: "pending_review",
  actor: "guest",
  context: ctx,
});
assert.equal(silent, null);

const quoteAccepted = resolveResourceEngagementEvent({
  event: "quote.accepted",
  context: { resourceId: "q-1", businessId: "biz-1", publicToken: "abc123" },
});
assert.equal(quoteAccepted?.kind, "quote.accepted");
assert.equal(quoteAccepted?.sendPush, true);

const proofRoute = operatorRouteForResource("design_proof", "proof-1");
assert.ok(proofRoute.href.includes("proof-1"));
assert.equal(operatorRouteForResource("quote", "q-1").href, "/quotes?id=q-1");

assert.ok(RESOURCE_FOLLOW_UP_RULES.some((r) => r.resourceKind === "design_proof"));

console.log("resource-transition-program.test.ts: ok");

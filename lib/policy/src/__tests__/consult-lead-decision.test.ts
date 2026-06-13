import assert from "node:assert/strict";
import { resolveConsultLeadDecision } from "../consult-inbox-policy";

const fresh = resolveConsultLeadDecision("new");
assert.ok(fresh?.primary.action === "draft_quote");
assert.ok(fresh?.secondary?.action === "decline");

const quoted = resolveConsultLeadDecision("quoted", { hasLinkedQuote: true });
assert.equal(quoted?.primary.action, "open_quote");

assert.equal(resolveConsultLeadDecision("lost"), null);

console.log("consult-lead-decision.test.ts OK");

/**
 * Allied-health product copy must not leak salon vocabulary (policy + OS labels).
 */
import assert from "node:assert/strict";
import { businessVocabulary } from "@workspace/policy";

const SALON_LEAK = /\b(shop|balayage|stylist|salon)\b/i;

const vocab = businessVocabulary("allied-health", "physio");
assert.equal(vocab.locationNoun, "Practice");
assert.ok(!SALON_LEAK.test(vocab.clientNoun));
assert.ok(!SALON_LEAK.test(vocab.label));

const businessUpdatedLabel = `${vocab.locationNoun} settings updated`;
assert.ok(!SALON_LEAK.test(businessUpdatedLabel), `label leaked: ${businessUpdatedLabel}`);

console.log("vocabulary-leak.test.ts: ok");

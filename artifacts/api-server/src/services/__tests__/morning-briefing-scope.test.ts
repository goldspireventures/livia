import assert from "node:assert/strict";
import { businessVocabulary } from "@workspace/policy";

/**
 * Documents briefing copy rules — full DB integration is E2E.
 * Ensures vertical vocabulary produces distinct service nouns.
 */
const hair = businessVocabulary("hair", null);
const fitness = businessVocabulary("fitness", null);
const pet = businessVocabulary("pet-grooming", null);

assert.notEqual(hair.serviceNoun, fitness.serviceNoun);
assert.notEqual(hair.clientNoun, pet.clientNoun);

function mockSummary(name: string, serviceWord: string, today: number, pending: number) {
  return `${name} · ${today} ${serviceWord}${today === 1 ? "" : "s"} today; ${pending} pending.`;
}

const luxe = mockSummary("Luxe Salon & Spa", hair.serviceNoun.toLowerCase(), 4, 2);
const peak = mockSummary("Peak Performance", fitness.serviceNoun.toLowerCase(), 4, 2);
assert.ok(luxe.includes("Luxe Salon"));
assert.ok(peak.includes("Peak Performance"));
assert.ok(luxe.includes("service"));
assert.ok(peak.includes("session"));
assert.notEqual(luxe, peak);

console.log("morning-briefing-scope.test.ts: ok");

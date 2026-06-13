import assert from "node:assert/strict";
import {
  resolvePresentationLayoutMorph,
  validateVerticalPresentationPack,
} from "../presentation-surface";

const wellness = validateVerticalPresentationPack("wellness");
assert.ok(wellness.ok, wellness.errors.join("; "));
assert.equal(wellness.presetCount, 4);
assert.ok(wellness.morphs.includes("atrium"));
assert.ok(wellness.morphs.includes("timeline-rail"));
assert.ok(wellness.morphs.includes("ledger"));

assert.equal(
  resolvePresentationLayoutMorph("wellness", "wellness-harbour-light"),
  "atrium",
);
assert.equal(
  resolvePresentationLayoutMorph("wellness", "platform-default"),
  "constellation",
);

const beauty = validateVerticalPresentationPack("beauty");
assert.ok(beauty.ok, beauty.errors.join("; "));
assert.ok(beauty.morphs.includes("split-inbox"));
assert.ok(beauty.morphs.includes("menu-card"));
assert.ok(beauty.morphs.includes("cockpit"));
assert.equal(resolvePresentationLayoutMorph("beauty", "beauty-noir-dusk"), "split-inbox");
assert.equal(resolvePresentationLayoutMorph("beauty", "beauty-editorial"), "menu-card");
assert.equal(resolvePresentationLayoutMorph("beauty", "beauty-premium-dark"), "cockpit");
assert.equal(resolvePresentationLayoutMorph("beauty", "beauty-soft-studio"), "atrium");

const eventVendors = validateVerticalPresentationPack("event-vendors");
assert.ok(eventVendors.ok, eventVendors.errors.join("; "));
assert.equal(resolvePresentationLayoutMorph("event-vendors", "event-atelier"), "atrium");
assert.equal(resolvePresentationLayoutMorph("event-vendors", "wedding-ledger"), "pipeline");
assert.equal(resolvePresentationLayoutMorph("event-vendors", "party-pop"), "menu-card");

console.log("presentation-surface.test.ts: ok");

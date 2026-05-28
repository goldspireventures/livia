import assert from "node:assert/strict";
import { verticalHomeModules, livToolHintsForVertical } from "../vertical-features";

const physio = verticalHomeModules("allied-health", "physio");
assert.ok(physio.some((m) => m.id === "care-programmes"));
assert.ok(!physio.some((m) => m.id === "design-proofs"));

const tattoo = verticalHomeModules("body-art", null);
assert.ok(tattoo.some((m) => m.id === "design-proofs"));

const hair = verticalHomeModules("hair", "salon");
assert.ok(!hair.some((m) => m.id === "design-proofs"));

const tools = livToolHintsForVertical("medspa", null);
assert.ok(tools.includes("confirm_booking"));

console.log("vertical-features.test.ts: ok");

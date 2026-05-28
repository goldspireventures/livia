import assert from "node:assert/strict";
import {
  domainEventToLivReaction,
  reactionsForEvent,
} from "@workspace/liv-runtime";

assert.equal(domainEventToLivReaction("booking.created"), "booking.created");
assert.equal(domainEventToLivReaction("booking.confirmed"), "booking.confirmed");
assert.equal(domainEventToLivReaction("booking.no-show"), "booking.no-show");
assert.equal(domainEventToLivReaction("voice.call.completed"), null);

const noShow = reactionsForEvent("booking.no-show", "tenant");
assert.ok(noShow.some((x) => x.kind === "coach_owner"));
assert.equal(noShow[0]?.priority, "act");

const handoff = reactionsForEvent("conversation.updated", "tenant");
assert.equal(handoff[0]?.kind, "pause_liv");

console.log("liv-reactions.test.ts: ok");

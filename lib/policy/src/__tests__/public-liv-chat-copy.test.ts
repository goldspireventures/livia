import assert from "node:assert/strict";
import { publicLivChatCopy, staffLivInboxSuggestions } from "../public-liv-chat-copy";

const wellness = publicLivChatCopy("wellness");
assert.ok(!wellness.suggestedPrompts.some((s) => /haircut|cut tomorrow/i.test(s)));
assert.ok(wellness.suggestedPrompts[0].includes("book"));
assert.equal(wellness.assistantSubtitle, "Booking assistant");

const hair = publicLivChatCopy("hair");
assert.ok(hair.suggestedPrompts.some((s) => /book/i.test(s)));

const inboxWellness = staffLivInboxSuggestions("wellness", null, "open");
assert.ok(inboxWellness.some((s) => /guest/i.test(s)));
assert.ok(!inboxWellness.some((s) => /client needs in one short/i.test(s)));

const allied = publicLivChatCopy("allied-health");
assert.ok(allied.suggestedPrompts[0].includes("assessment"));
assert.ok(!allied.suggestedPrompts.some((s) => /appointment types do you offer/i.test(s)));

console.log("public-liv-chat-copy.test.ts ok");

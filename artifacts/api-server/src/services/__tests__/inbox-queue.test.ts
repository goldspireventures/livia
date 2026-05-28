import assert from "node:assert/strict";
import {
  countByInboxQueueLens,
  defaultInboxQueueLens,
  matchesInboxQueueLens,
} from "@workspace/policy";

const threads = [
  { status: "OPEN", aiHandled: false },
  { status: "OPEN", aiHandled: true },
  { status: "HANDED_OFF", aiHandled: false },
  { status: "CLOSED", aiHandled: true },
];

assert.equal(matchesInboxQueueLens(threads[0]!, "needs_you"), true);
assert.equal(matchesInboxQueueLens(threads[1]!, "liv_handling"), true);
assert.equal(matchesInboxQueueLens(threads[2]!, "taken_over"), true);
assert.equal(matchesInboxQueueLens(threads[3]!, "closed"), true);

const counts = countByInboxQueueLens(threads);
assert.equal(counts.needs_you, 1);
assert.equal(counts.liv_handling, 1);
assert.equal(counts.taken_over, 1);
assert.equal(counts.closed, 1);
assert.equal(counts.all, 4);

assert.equal(defaultInboxQueueLens("manager"), "needs_you");
assert.equal(defaultInboxQueueLens("owner"), "liv_handling");

console.log("inbox-queue.test.ts: ok");

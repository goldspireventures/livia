import assert from "node:assert/strict";
import { inboxLivHandling, inboxNeedsOwnerReply } from "../inbox-queue";

assert.equal(inboxNeedsOwnerReply({ status: "OPEN", aiHandled: false }), true);
assert.equal(inboxNeedsOwnerReply({ status: "OPEN", aiHandled: true }), false);
assert.equal(inboxNeedsOwnerReply({ status: "HANDED_OFF", aiHandled: false }), true);
assert.equal(inboxNeedsOwnerReply({ status: "HANDED_OFF", aiHandled: true }), true);
assert.equal(inboxNeedsOwnerReply({ status: "CLOSED", aiHandled: false }), false);
assert.equal(inboxNeedsOwnerReply(null), false);

assert.equal(inboxLivHandling({ status: "OPEN", aiHandled: true }), true);
assert.equal(inboxLivHandling({ status: "OPEN", aiHandled: false }), false);
assert.equal(inboxLivHandling({ status: "HANDED_OFF", aiHandled: true }), false);

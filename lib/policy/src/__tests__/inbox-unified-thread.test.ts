import assert from "node:assert/strict";
import {
  countUnifiedInboxQueueLens,
  groupInboxThreadsByCustomer,
  inboxUnifiedGuestChannelsLabel,
  matchesUnifiedInboxQueueLens,
  resolveUnifiedQueueState,
  resolveUnifiedReplyTarget,
} from "../inbox-unified-thread";

const marySms = {
  id: "sms-1",
  customerId: "cust-mary",
  customerName: "Mary",
  channel: "SMS",
  status: "OPEN" as const,
  aiHandled: true,
  lastMessageAt: "2026-06-21T10:00:00.000Z",
  lastMessage: "Tuesday works",
};

const maryWa = {
  id: "wa-1",
  customerId: "cust-mary",
  customerName: "Mary",
  channel: "WHATSAPP",
  status: "OPEN" as const,
  aiHandled: true,
  lastMessageAt: "2026-06-21T11:00:00.000Z",
  lastMessage: "Friend waiting?",
};

const maryIg = {
  id: "ig-1",
  customerId: "cust-mary",
  customerName: "Mary",
  channel: "INSTAGRAM",
  status: "OPEN" as const,
  aiHandled: true,
  lastMessageAt: "2026-06-21T09:00:00.000Z",
  lastMessage: "Same stylist?",
};

const needsYouThread = {
  id: "needs-1",
  customerId: "cust-alex",
  customerName: "Alex",
  channel: "SMS",
  status: "OPEN" as const,
  aiHandled: false,
  lastMessageAt: "2026-06-21T12:00:00.000Z",
  lastMessage: "Help",
};

const groups = groupInboxThreadsByCustomer([marySms, maryWa, maryIg, needsYouThread]);
assert.equal(groups.length, 2);
const maryGroup = groups.find((g) => g.customerId === "cust-mary");
assert.ok(maryGroup);
assert.equal(maryGroup!.threads.length, 3);
assert.equal(maryGroup!.primaryConversationId, "wa-1");
assert.deepEqual(new Set(maryGroup!.channels), new Set(["SMS", "WHATSAPP", "INSTAGRAM"]));

assert.equal(resolveUnifiedQueueState(maryGroup!.threads), "liv_handling");
assert.equal(matchesUnifiedInboxQueueLens(maryGroup!, "liv_handling"), true);
assert.equal(matchesUnifiedInboxQueueLens(maryGroup!, "needs_you"), false);

const alexGroup = groups.find((g) => g.customerId === "cust-alex");
assert.ok(alexGroup);
assert.equal(matchesUnifiedInboxQueueLens(alexGroup!, "needs_you"), true);
assert.equal(matchesUnifiedInboxQueueLens(alexGroup!, "liv_handling"), false);

const counts = countUnifiedInboxQueueLens(groups);
assert.equal(counts.liv_handling, 1);
assert.equal(counts.needs_you, 1);

const reply = resolveUnifiedReplyTarget([
  {
    id: "m1",
    conversationId: "ig-1",
    channel: "INSTAGRAM",
    role: "USER",
    content: "old",
    createdAt: "2026-06-21T08:00:00.000Z",
  },
  {
    id: "m2",
    conversationId: "wa-1",
    channel: "WHATSAPP",
    role: "USER",
    content: "latest",
    createdAt: "2026-06-21T11:30:00.000Z",
  },
]);
assert.deepEqual(reply, { conversationId: "wa-1", channel: "WHATSAPP" });

assert.equal(
  inboxUnifiedGuestChannelsLabel(["SMS", "WHATSAPP", "INSTAGRAM"]),
  "SMS · WhatsApp · Instagram",
);

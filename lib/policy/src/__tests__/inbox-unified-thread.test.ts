import assert from "node:assert/strict";
import {
  countUnifiedInboxQueueLens,
  groupInboxThreadsByCustomer,
  inboxUnifiedGuestChannelsLabel,
  matchesUnifiedInboxQueueLens,
  resolveUnifiedQueueState,
  resolveUnifiedReplyTarget,
  buildInboxGuestChannelContext,
  resolveInboxMessageReplyRoute,
  toggleInboxReplyChannelPick,
  isInboxReplyChannelSelected,
  resolveInboxEffectiveReplyConversationId,
} from "../inbox-unified-thread";
import {
  resolveInboxComposeReplyChannel,
  inboxReplyPlaceholderForCompose,
} from "../inbox-channel-routing";

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
assert.deepEqual(new Set(maryGroup!.activeChannels), new Set(["SMS", "WHATSAPP", "INSTAGRAM"]));

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

const ctx = buildInboxGuestChannelContext("cust-mary", groups);
assert.equal(ctx.multi, true);
assert.equal(ctx.threadByChannel.get("WHATSAPP"), "wa-1");

const route = resolveInboxMessageReplyRoute(
  { channel: "SMS", conversationId: "sms-1" },
  ctx,
  "wa-1",
  [marySms, maryWa, maryIg],
);
assert.deepEqual(route, { conversationId: "sms-1", channel: "SMS" });

assert.deepEqual(
  toggleInboxReplyChannelPick(null, { conversationId: "sms-1", channel: "SMS" }),
  { conversationId: "sms-1", channel: "SMS" },
);
assert.equal(
  toggleInboxReplyChannelPick({ conversationId: "sms-1", channel: "SMS" }, {
    conversationId: "sms-1",
    channel: "SMS",
  }),
  null,
);

assert.equal(
  isInboxReplyChannelSelected(
    { conversationId: "sms-1", channel: "SMS" },
    { channel: "SMS", conversationId: "sms-1" },
    ctx,
    "wa-1",
    [marySms, maryWa, maryIg],
  ),
  true,
);

assert.equal(
  resolveInboxEffectiveReplyConversationId(
    { conversationId: "sms-1" },
    "wa-1",
    "ig-1",
  ),
  "sms-1",
);

assert.equal(
  resolveInboxComposeReplyChannel({
    pick: null,
    apiReplyChannel: "WHATSAPP",
    threadChannel: "INSTAGRAM",
    multiChannel: true,
    detailReady: true,
  }),
  "WHATSAPP",
);

assert.equal(
  resolveInboxComposeReplyChannel({
    pick: null,
    apiReplyChannel: null,
    threadChannel: "INSTAGRAM",
    multiChannel: true,
    detailReady: false,
  }),
  null,
);

assert.equal(inboxReplyPlaceholderForCompose(null, true, false), "Reply…");
assert.equal(
  inboxReplyPlaceholderForCompose("SMS", true, true),
  "Reply on SMS…",
);

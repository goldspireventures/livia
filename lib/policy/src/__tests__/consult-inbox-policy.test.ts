import assert from "node:assert/strict";
import {
  countConsultInboxLens,
  isConsultDmChannel,
  resolveConsultInboxNavAttention,
  shouldCloseConsultDm,
} from "../consult-inbox-policy";

assert.equal(isConsultDmChannel("sms"), true);
assert.equal(isConsultDmChannel("WEB"), false);

assert.equal(
  shouldCloseConsultDm({ vertical: "event-vendors", channel: "SMS", status: "OPEN" }),
  true,
);
assert.equal(
  shouldCloseConsultDm({ vertical: "event-vendors", channel: "WEB", status: "OPEN" }),
  false,
);
assert.equal(
  shouldCloseConsultDm({ vertical: "event-vendors", channel: "SMS", status: "HANDED_OFF" }),
  false,
);
assert.equal(shouldCloseConsultDm({ vertical: "hair", channel: "SMS", status: "OPEN" }), false);

assert.deepEqual(
  countConsultInboxLens(
    [{ status: "new" }, { status: "quoted" }],
    [
      { status: "OPEN", channel: "SMS" },
      { status: "CLOSED", channel: "SMS" },
      { status: "HANDED_OFF", channel: "WEB" },
    ],
  ),
  { all: 4, leads: 2, messages: 2 },
);

assert.deepEqual(
  resolveConsultInboxNavAttention({ newEnquiries: 3, unviewedHandoffs: 1 }),
  { count: 4, label: "3 new leads · 1 thread needs reply" },
);

console.log("consult-inbox-policy.test.ts OK");

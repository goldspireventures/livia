import assert from "node:assert/strict";
import { isLivAttributedBooking } from "../weekly-digest-attribution";

assert.equal(
  isLivAttributedBooking({ source: "whatsapp", sourceConversationId: "c1" }),
  true,
);
assert.equal(
  isLivAttributedBooking({ source: "voice", sourceConversationId: null }),
  true,
);
assert.equal(
  isLivAttributedBooking({ source: "staff", sourceConversationId: "c1" }),
  false,
);
assert.equal(
  isLivAttributedBooking({ source: "sms", sourceConversationId: null }),
  false,
);

console.log("weekly-digest-attribution.test.ts: ok");

import assert from "node:assert/strict";
import { inboxOperatorMessageText } from "../inbox-context-copy";
import { livGuestBookingChatReply } from "../booking-experience-copy";

assert.equal(
  inboxOperatorMessageText(
    "(Liv, AI assistant for IMD Allied Health) — You're booked for Test service.",
  ),
  "You're booked for Test service.",
);

assert.equal(livGuestBookingChatReply({
  businessName: "IMD Allied Health",
  serviceName: "Test service",
  staffDisplayName: "Practitioner",
  startAtLocal: "1 Jul 2026, 13:30",
  bookingRef: "974M01VZ",
  status: "PENDING",
}).includes("request"), true);

assert.equal(livGuestBookingChatReply({
  businessName: "IMD Allied Health",
  serviceName: "Test service",
  staffDisplayName: "Practitioner",
  startAtLocal: "1 Jul 2026, 13:30",
  bookingRef: "974M01VZ",
  status: "CONFIRMED",
}).includes("You're booked"), true);

console.log("inbox-operator-message.test.ts: ok");

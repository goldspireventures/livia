import assert from "node:assert/strict";
import {
  defaultLivOutboundOverridesForVertical,
  livOutboundKeysForVertical,
  livPendingBookingAssistCopy,
  resolveLivOutboundCopy,
} from "../liv-platform-program";
import { livConversationalFallbackCopy, livToneInstruction } from "../liv-prompt-program";

assert.deepEqual(livOutboundKeysForVertical("event-vendors"), [
  "decline_reply",
  "enquiry_thanks",
  "quote_whatsapp",
  "stale_quote_nudge",
]);

assert.deepEqual(livOutboundKeysForVertical("hair"), [
  "pending_booking_assist",
  "booking_confirm_email_subject",
  "booking_confirm_email_body",
  "booking_confirm_sms",
]);

const hairDefaults = defaultLivOutboundOverridesForVertical("hair");
assert.ok(hairDefaults.pending_booking_assist?.includes("{{serviceDetail}}"));
assert.ok(hairDefaults.booking_confirm_sms?.includes("{{businessName}}"));

const assist = livPendingBookingAssistCopy("Blow-Dry after your colour");
assert.ok(assist.includes("Blow-Dry after your colour"));
assert.ok(assist.includes("pending team confirm"));

const confirm = resolveLivOutboundCopy("booking_confirm_sms", {
  serviceName: "Cut & colour",
  startLocal: "Fri 12 Jun, 14:00",
  businessName: "Studio One",
});
assert.ok(confirm.includes("Studio One"));

assert.ok(livToneInstruction("PROFESSIONAL").includes("professional"));
assert.ok(livConversationalFallbackCopy("unclear_rephrase").length > 10);

console.log("liv-platform-program.test.ts OK");

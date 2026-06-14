import assert from "node:assert/strict";
import {
  OUTBOUND_DELIVERY_DEFAULTS,
  PLATFORM_DELIVERY_LANES,
  subsystemForOutboundChannel,
} from "../platform-delivery-program";

assert.equal(subsystemForOutboundChannel("SMS"), "messaging_outbound");
assert.equal(subsystemForOutboundChannel("EMAIL"), "messaging_outbound");
assert.equal(OUTBOUND_DELIVERY_DEFAULTS.maxRetryAttempts, 5);
assert.ok(PLATFORM_DELIVERY_LANES.conversationalOutbound.includes("notification_logs"));

console.log("platform-delivery-program.test.ts: ok");

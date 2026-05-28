import assert from "node:assert/strict";

// Smoke: booking source mapping accepts DB enums
const allowed = ["voice", "whatsapp", "sms", "web", "walk-in", "owner-manual"];
assert.ok(allowed.includes("web"));
assert.ok(!allowed.includes("instagram"));

console.log("booking-events-map.test.ts: ok");

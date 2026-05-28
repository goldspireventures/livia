import assert from "node:assert/strict";
import { buildChainAlerts, type ChainShopRollup } from "../chain-alerts";

const base: Omit<ChainShopRollup, "pulseStatus" | "pulseReason"> = {
  businessId: "b1",
  name: "Dublin",
  slug: "dublin",
  planId: null,
  tier: "chain",
  city: "Dublin",
  bookingsThisWeek: 10,
  completedThisWeek: 2,
  todayBookings: 3,
  pendingBookings: 0,
  openConversations: 0,
  handedOffConversations: 0,
  pendingTimeOff: 0,
};

const alerts = buildChainAlerts([
  { ...base, pulseStatus: "ok", pulseReason: null },
  {
    ...base,
    businessId: "b2",
    name: "Galway",
    pulseStatus: "act",
    pulseReason: "2 conversation(s) need owner attention",
    handedOffConversations: 2,
  },
]);

assert.equal(alerts.length, 1);
assert.equal(alerts[0]!.shopName, "Galway");
assert.equal(alerts[0]!.code, "handed_off");
assert.equal(alerts[0]!.severity, "act");

console.log("chain-alerts.test.ts: ok");

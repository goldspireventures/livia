import assert from "node:assert/strict";
import test from "node:test";
import { getGuestHubView } from "../guest-hub.service.ts";

test("getGuestHubView returns null for invalid token", async () => {
  const view = await getGuestHubView("invalid-token-not-in-db");
  assert.equal(view, null);
});

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getSupportPoint,
  listSupportPoints,
  resolveSupportSurfaceId,
} from "../support-points";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

assert.ok(listSupportPoints().length >= 10, "P0 catalog populated");
assert.equal(getSupportPoint("dashboard.inbox")?.owner, "liv");
assert.equal(resolveSupportSurfaceId("/inbox"), "dashboard.inbox");
assert.equal(resolveSupportSurfaceId("/bookings/abc123"), "dashboard.booking.detail");
assert.equal(resolveSupportSurfaceId("/b/luxe-salon-spa"), "public.booking");
assert.equal(resolveSupportSurfaceId("/onboarding", "?intent=second-shop"), "dashboard.onboarding");

for (const point of listSupportPoints()) {
  for (const rel of [...point.policyModules, ...point.uiComponents, ...point.services, ...point.tests]) {
    if (!rel) continue;
    const abs = resolve(root, rel);
    assert.ok(existsSync(abs), `${point.surfaceId}: missing ${rel}`);
  }
}

console.log("support-points.test.ts: ok");

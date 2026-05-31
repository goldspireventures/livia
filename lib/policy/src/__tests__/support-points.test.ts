import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getSupportPoint,
  listSupportPoints,
  resolveSupportSurfaceId,
} from "../support-points";
import { P0_PLATFORM_SURFACES } from "../platform-surface-registry";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

assert.ok(listSupportPoints().length >= 20, "P0 support catalog populated");
assert.equal(getSupportPoint("tenant.inbox")?.owner, "liv");
assert.equal(resolveSupportSurfaceId("/inbox"), "tenant.inbox");
assert.equal(resolveSupportSurfaceId("/bookings/abc123"), "tenant.booking.detail");
assert.equal(resolveSupportSurfaceId("/b/luxe-salon-spa"), "guest.public.book");
assert.equal(resolveSupportSurfaceId("/b/x/pay/tok"), "public.deposit-pay");
assert.equal(resolveSupportSurfaceId("/my"), "guest.public.hub");
assert.equal(resolveSupportSurfaceId("/onboarding", "?intent=second-shop"), "gateway.onboarding");

for (const surface of P0_PLATFORM_SURFACES) {
  if (surface.app === "mobile" || surface.app === "marketing") continue;
  const point = getSupportPoint(surface.surfaceId);
  assert.ok(point, `${surface.surfaceId}: missing support point`);
}

for (const point of listSupportPoints()) {
  for (const rel of [...point.policyModules, ...point.uiComponents, ...point.services, ...point.tests]) {
    if (!rel) continue;
    const abs = resolve(root, rel);
    assert.ok(existsSync(abs), `${point.surfaceId}: missing ${rel}`);
  }
}

console.log("support-points.test.ts: ok");

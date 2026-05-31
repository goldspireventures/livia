import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  P0_PLATFORM_SURFACES,
  resolvePlatformSurfaceId,
  getPlatformSurface,
  canonicalSurfaceId,
} from "../platform-surface-registry";
import { getSupportPoint } from "../support-points";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const openapi = readFileSync(resolve(root, "lib/api-spec/openapi.yaml"), "utf8");

assert.equal(P0_PLATFORM_SURFACES.length, 25, "P0 catalog has 25 surfaces");

for (const surface of P0_PLATFORM_SURFACES) {
  const cardPath = resolve(root, `docs/design/screen-cards/${surface.screenCardId}.yaml`);
  assert.ok(existsSync(cardPath), `${surface.screenCardId}: screen card yaml missing`);
  for (const apiPath of surface.openapiPaths ?? []) {
    assert.ok(
      openapi.includes(apiPath),
      `${surface.surfaceId}: OpenAPI missing ${apiPath}`,
    );
  }
}

const routeChecks: Array<[string, string]> = [
  ["/inbox", "tenant.inbox"],
  ["/chain", "tenant.founder.chain"],
  ["/medspa", "tenant.medspa.hub"],
  ["/my-day", "tenant.staff.my-day"],
  ["/settings", "tenant.settings"],
  ["/bookings/new", "tenant.booking.new"],
  ["/bookings/abc123", "tenant.booking.detail"],
  ["/onboarding", "gateway.onboarding"],
  ["/legal-acceptance", "gateway.legal-accept"],
  ["/demo", "gateway.demo.launcher"],
  ["/demo/wedge/tattoo", "gateway.demo.wedge"],
  ["/b/demo-shop", "guest.public.book"],
  ["/b/demo-shop/pay/tok1", "public.deposit-pay"],
  ["/b/demo-shop/intake/tok1", "public.intake"],
  ["/b/demo-shop/proof/tok1", "guest.public.proof"],
  ["/my", "guest.public.hub"],
];

for (const [path, expected] of routeChecks) {
  assert.equal(resolvePlatformSurfaceId(path), expected, `route ${path}`);
}

assert.ok(getSupportPoint("dashboard.inbox"), "legacy alias resolves support point");
assert.equal(getSupportPoint("dashboard.inbox")?.surfaceId, "tenant.inbox");
assert.equal(canonicalSurfaceId("public.booking"), "guest.public.book");

console.log("platform-surface-registry.test.ts: ok");

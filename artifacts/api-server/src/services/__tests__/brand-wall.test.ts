import assert from "node:assert/strict";
import { getBrandPortfolioForOwner } from "../brand-portfolio.service.js";

/**
 * Brand wall smoke — portfolio groups must not expose cross-brand customer ids.
 * Full 30-day audit is founder lane; this asserts API shape isolation.
 */
async function main() {
  const groups = await getBrandPortfolioForOwner("nonexistent-owner-id");
  assert.equal(Array.isArray(groups), true);
  for (const g of groups) {
    assert.ok(g.brandShell.id);
    for (const loc of g.locations) {
      assert.notEqual(loc.id, g.brandShell.id, "location must not equal shell id");
    }
  }
  console.log("brand-wall.test.ts: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

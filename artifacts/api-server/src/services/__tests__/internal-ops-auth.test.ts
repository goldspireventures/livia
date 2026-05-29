import { strict as assert } from "node:assert";
import { authorizeInternalOps, getInternalOpsSecret } from "../../lib/internal-ops-auth.js";

const prevOps = process.env.INTERNAL_OPS_SECRET;
const prevCron = process.env.INTERNAL_CRON_SECRET;

try {
  process.env.INTERNAL_OPS_SECRET = "ops-test-secret";
  delete process.env.INTERNAL_CRON_SECRET;

  assert.equal(getInternalOpsSecret(), "ops-test-secret");

  assert.equal(
    authorizeInternalOps({
      headers: { "x-internal-ops-secret": "ops-test-secret" },
    } as never),
    true,
  );
  assert.equal(
    authorizeInternalOps({
      headers: { "x-internal-ops-secret": "wrong" },
    } as never),
    false,
  );

  delete process.env.INTERNAL_OPS_SECRET;
  process.env.INTERNAL_CRON_SECRET = "cron-fallback";
  process.env.NODE_ENV = "development";
  assert.equal(getInternalOpsSecret(), "cron-fallback");
  assert.equal(
    authorizeInternalOps({
      headers: { "x-internal-cron-secret": "cron-fallback" },
    } as never),
    true,
  );

  console.log("internal-ops-auth.test.ts: ok");
} finally {
  if (prevOps !== undefined) process.env.INTERNAL_OPS_SECRET = prevOps;
  else delete process.env.INTERNAL_OPS_SECRET;
  if (prevCron !== undefined) process.env.INTERNAL_CRON_SECRET = prevCron;
  else delete process.env.INTERNAL_CRON_SECRET;
}

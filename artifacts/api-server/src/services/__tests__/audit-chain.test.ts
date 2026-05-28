/**
 * Audit log hash-chain verification (ADR 0015).
 * Run: pnpm --filter @workspace/api-server run test
 */
import assert from "node:assert/strict";
import { verifyChain, genesisHash } from "@workspace/audit-log";

const ZERO = genesisHash();

function row(
  id: bigint,
  overrides: Partial<{
    prevHash: Buffer;
    rowHash: Buffer;
    payload: Record<string, unknown>;
  }> = {},
) {
  const base = {
    id,
    businessId: "biz-1",
    occurredAt: new Date("2026-01-01T12:00:00.000Z"),
    actorKind: "human",
    actorId: "user-1",
    onBehalfOfId: null,
    actionClass: "human.booking.create",
    resourceKind: "booking",
    resourceId: "bk-1",
    payload: { ok: true },
    prevHash: ZERO,
    rowHash: ZERO,
  };
  return { ...base, ...overrides };
}

// Intact chain: prev links to prior row_hash (synthetic — verifyChain checks consistency).
const intactPrev = Buffer.alloc(32);
const intactRow = Buffer.alloc(32, 1);
const brokenRow = Buffer.alloc(32, 2);

assert.equal(verifyChain([]), null, "empty chain is valid");

const broken = verifyChain([
  row(1n, { prevHash: ZERO, rowHash: intactRow }),
  row(2n, { prevHash: intactPrev, rowHash: brokenRow }),
]);
assert.ok(broken !== null, "mismatched prev_hash should break the chain");

console.log("audit-chain.test.ts: ok");

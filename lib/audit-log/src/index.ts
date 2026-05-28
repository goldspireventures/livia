/**
 * @workspace/audit-log
 *
 * The trust-amplification surface (per ADR 0015, ADR 0018 unit #4).
 *
 * Append-only, hash-chained per tenant, EU-resident, 7-year retention.
 * Owner-readable + auditor-exportable.
 *
 * v1: writer is a function the api-server / agent-runtime / voice-bridge call.
 * v1.5+: extracts to a separate audit-log service (sellable as a SaaS).
 */
import { createHash } from "node:crypto";
import { z } from "zod";

export * from "./schema";

export const actorKindSchema = z.enum(["liv", "human", "system"]);
export type ActorKind = z.infer<typeof actorKindSchema>;

export const auditEventInputSchema = z.object({
  businessId: z.string().min(1),
  actorKind: actorKindSchema,
  actorId: z.string().min(1),
  onBehalfOfId: z.string().nullish(),
  actionClass: z.string().min(1),
  resourceKind: z.string().min(1),
  resourceId: z.string().nullish(),
  payload: z.record(z.string(), z.unknown()),
});

export type AuditEventInput = z.infer<typeof auditEventInputSchema>;

const ZERO_HASH = Buffer.alloc(32);

/** Canonical JSON: sorted keys, stable serialisation. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(",")}}`;
}

export function computeRowHash(prevHash: Buffer, input: AuditEventInput, occurredAt: Date): Buffer {
  const meta = {
    businessId: input.businessId,
    occurredAt: occurredAt.toISOString(),
    actorKind: input.actorKind,
    actorId: input.actorId,
    onBehalfOfId: input.onBehalfOfId ?? null,
    actionClass: input.actionClass,
    resourceKind: input.resourceKind,
    resourceId: input.resourceId ?? null,
  };
  const body = canonical({ meta, payload: input.payload });
  return createHash("sha256").update(prevHash).update(body).digest();
}

export function genesisHash(): Buffer {
  return ZERO_HASH;
}

/**
 * Verify a chain of audit-log rows for a tenant. Returns null if intact;
 * returns the id of the first broken row otherwise.
 */
export function verifyChain(
  rows: ReadonlyArray<{
    id: bigint;
    businessId: string;
    occurredAt: Date;
    actorKind: string;
    actorId: string;
    onBehalfOfId: string | null;
    actionClass: string;
    resourceKind: string;
    resourceId: string | null;
    payload: Record<string, unknown>;
    prevHash: Buffer;
    rowHash: Buffer;
  }>,
): bigint | null {
  let expectedPrev = ZERO_HASH;
  for (const row of rows) {
    if (!row.prevHash.equals(expectedPrev)) return row.id;
    const input: AuditEventInput = {
      businessId: row.businessId,
      actorKind: row.actorKind as ActorKind,
      actorId: row.actorId,
      onBehalfOfId: row.onBehalfOfId,
      actionClass: row.actionClass,
      resourceKind: row.resourceKind,
      resourceId: row.resourceId,
      payload: row.payload,
    };
    const expectedRow = computeRowHash(expectedPrev, input, row.occurredAt);
    if (!row.rowHash.equals(expectedRow)) return row.id;
    expectedPrev = Buffer.from(row.rowHash);
  }
  return null;
}

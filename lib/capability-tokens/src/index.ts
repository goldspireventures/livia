/**
 * @workspace/capability-tokens
 *
 * Capability tokens for every privileged action (per ADR 0018, pattern #4).
 *
 * Instead of "is this user an Owner?", every action carries a signed capability
 * that says "this membership, with this scope, with these caps, valid until X".
 *
 * Three benefits:
 *   (a) audit-log entries become rich and self-describing.
 *   (b) third-party integrations get scoped tokens cleanly.
 *   (c) impersonation, delegation, and owner-on-holiday become "issue a token" —
 *       not "patch the role logic".
 *
 * v1: HMAC-SHA-256 with a shared secret (CAPABILITY_TOKEN_SIGNING_KEY).
 * v1.5+: rotate to EdDSA with KMS-managed keys.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const capabilityScopeSchema = z.object({
  /** Team IDs this capability is scoped to (for ADM-D / Senior-w-admin). */
  teams: z.array(z.string()).optional(),
  /** Shop IDs (for chain configurations at v1.5+). */
  shops: z.array(z.string()).optional(),
  /** Brand-shell IDs (for multi-brand at v1.5+). */
  brandShells: z.array(z.string()).optional(),
});

export const capabilityCapsSchema = z.object({
  refundEurCents: z.number().int().nonnegative().optional(),
  timeoffDays: z.number().int().nonnegative().optional(),
  /** Per-call max for voice receptionist outbound. */
  voiceCallMinutesMax: z.number().int().nonnegative().optional(),
});

export const capabilityPayloadSchema = z.object({
  /** The membership this capability authorises action on behalf of. */
  membershipId: z.string().min(1),
  /** The business_id; redundant with membership but cheap belt-and-braces. */
  businessId: z.string().min(1),
  scope: capabilityScopeSchema.default({}),
  caps: capabilityCapsSchema.default({}),
  /** ISO-8601 issue and expiry. */
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  /** Human or liv-runtime that issued this. For audit trail. */
  issuedBy: z.string().min(1),
});

export type CapabilityScope = z.infer<typeof capabilityScopeSchema>;
export type CapabilityCaps = z.infer<typeof capabilityCapsSchema>;
export type CapabilityPayload = z.infer<typeof capabilityPayloadSchema>;

export interface CapabilityToken {
  payload: CapabilityPayload;
  signature: string;
}

function canonical(payload: CapabilityPayload): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

export function signCapability(payload: CapabilityPayload, signingKey: string): string {
  const validated = capabilityPayloadSchema.parse(payload);
  const body = Buffer.from(canonical(validated)).toString("base64url");
  const sig = createHmac("sha256", signingKey).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyCapability(token: string, signingKey: string): CapabilityToken {
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("Malformed capability token");
  const expected = createHmac("sha256", signingKey).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Capability token signature invalid");
  }
  const payload = capabilityPayloadSchema.parse(JSON.parse(Buffer.from(body, "base64url").toString()));
  if (new Date(payload.expiresAt) < new Date()) {
    throw new Error("Capability token expired");
  }
  return { payload, signature: sig };
}

export function hasRefundAuthority(token: CapabilityToken, amountEurCents: number): boolean {
  const cap = token.payload.caps.refundEurCents;
  return cap !== undefined && amountEurCents <= cap;
}

export function hasTimeoffAuthority(token: CapabilityToken, days: number): boolean {
  const cap = token.payload.caps.timeoffDays;
  return cap !== undefined && days <= cap;
}

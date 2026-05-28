import { createHash, randomBytes } from "node:crypto";

const PEPPER = process.env.API_KEY_PEPPER ?? "livia-dev-pepper-change-in-prod";

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(`${PEPPER}:${rawKey}`).digest("hex");
}

export function generateApiKey(prefixLabel: "tenant" | "partner"): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const body = randomBytes(24).toString("base64url");
  const rawKey = `livia_${prefixLabel}_${body}`;
  const keyPrefix = rawKey.slice(0, 16);
  return { rawKey, keyPrefix, keyHash: hashApiKey(rawKey) };
}

export function verifyApiKey(rawKey: string, keyHash: string): boolean {
  return hashApiKey(rawKey) === keyHash;
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString("base64url")}`;
}

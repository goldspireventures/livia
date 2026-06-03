import { createHmac, timingSafeEqual } from "node:crypto";
import { MARKETING_DEMO_GATE_TTL_MS } from "@workspace/policy";

type DemoGatePayload = {
  leadId: string;
  email: string;
  exp: number;
};

function gateSecret(): string | null {
  const secret = process.env.LIVIA_MARKETING_DEMO_GATE_SECRET?.trim();
  return secret || null;
}

function bypassKey(): string | null {
  const key = process.env.LIVIA_MARKETING_DEMO_GATE_BYPASS_KEY?.trim();
  return key || null;
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function issueMarketingDemoGateToken(input: {
  leadId: string;
  email: string;
}): string | null {
  const secret = gateSecret();
  if (!secret) return null;

  const payload: DemoGatePayload = {
    leadId: input.leadId,
    email: input.email.trim().toLowerCase(),
    exp: Date.now() + MARKETING_DEMO_GATE_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function verifyMarketingDemoGateToken(token: string): {
  valid: boolean;
  email?: string;
  leadId?: string;
} {
  const trimmed = token.trim();
  if (!trimmed) return { valid: false };

  const bypass = bypassKey();
  if (bypass) {
    try {
      const a = Buffer.from(trimmed);
      const b = Buffer.from(bypass);
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return { valid: true };
      }
    } catch {
      /* fall through */
    }
  }

  const secret = gateSecret();
  if (!secret) return { valid: false };

  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0) return { valid: false };

  const body = trimmed.slice(0, dot);
  const sig = trimmed.slice(dot + 1);
  const expected = sign(body, secret);

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false };
  } catch {
    return { valid: false };
  }

  let payload: DemoGatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as DemoGatePayload;
  } catch {
    return { valid: false };
  }

  if (!payload.email || !payload.leadId || typeof payload.exp !== "number") {
    return { valid: false };
  }
  if (payload.exp < Date.now()) return { valid: false };

  return { valid: true, email: payload.email, leadId: payload.leadId };
}

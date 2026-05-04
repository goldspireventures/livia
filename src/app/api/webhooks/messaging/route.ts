import { NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError, ok } from "@/lib/http";
import { ingestInboundMessageLog } from "@/services/messaging/messageLogService";

const Body = z.object({
  businessId: z.string().min(1),
  provider: z.string().min(1).max(64).optional(),
  channel: z.enum(["EMAIL", "PHONE", "SMS", "EXTERNAL", "OTHER"]),
  from: z.string().min(1).max(512),
  body: z.string().min(1).max(16_000),
  payload: z.any().optional(),
});

function inboundSecret(): string | null {
  const s = process.env.MESSAGING_INBOUND_SECRET?.trim();
  return s && s.length > 0 ? s : null;
}

/** Lightweight probe for deploy scripts; POST remains the real ingest. */
export function GET() {
  const configured = Boolean(inboundSecret());
  return NextResponse.json(
    {
      ok: true,
      configured,
      post: "POST JSON with header x-bliq-messaging-secret (see docs/MESSAGING_AI_CAPACITOR.md).",
    },
    { status: 200 },
  );
}

/**
 * T6 inbound scaffold. When `MESSAGING_INBOUND_SECRET` is set, require header `x-bliq-messaging-secret`
 * matching that value, then persist a `MessageLog` and attempt `ChannelIdentity` match.
 * Without the secret, returns 501 (no fake provider).
 */
export async function POST(req: Request) {
  try {
    const contentLengthRaw = req.headers.get("content-length");
    if (contentLengthRaw) {
      const n = Number(contentLengthRaw);
      if (Number.isFinite(n) && n > 64_000) {
        return NextResponse.json({ ok: false, code: "PAYLOAD_TOO_LARGE", message: "Body too large." }, { status: 413 });
      }
    }

    const secret = inboundSecret();
    if (!secret) {
      return NextResponse.json(
        {
          ok: false,
          code: "NOT_CONFIGURED",
          message: "Set MESSAGING_INBOUND_SECRET to accept signed inbound test payloads. See docs/MESSAGING_AI_CAPACITOR.md.",
        },
        { status: 501 },
      );
    }

    const got = req.headers.get("x-bliq-messaging-secret");
    if (got !== secret) {
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED", message: "Invalid or missing x-bliq-messaging-secret." }, { status: 401 });
    }

    const body = Body.parse(await req.json());
    const row = await ingestInboundMessageLog({
      businessId: body.businessId,
      provider: body.provider,
      channel: body.channel,
      fromValue: body.from,
      body: body.body,
      payload: body.payload ?? null,
    });

    return ok({ id: row.id, status: row.status });
  } catch (err) {
    return handleRouteError(err);
  }
}

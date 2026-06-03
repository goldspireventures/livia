import { Router, type IRouter } from "express";
import { CreateMarketingLeadBody } from "@workspace/api-zod";
import { isMarketingDemoLeadIntent } from "@workspace/policy";
import { createMarketingLead } from "../services/marketing-leads.service";
import {
  issueMarketingDemoGateToken,
  verifyMarketingDemoGateToken,
} from "../lib/marketing-demo-gate-token";
import { logger } from "../lib/logger";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();

type Bucket = { count: number; reset: number };
const ipBuckets = new Map<string, Bucket>();
const recentEmails = new Map<string, number>();

const IP_LIMIT = 5;
const IP_WINDOW_MS = 10 * 60_000;
const EMAIL_DEDUPE_MS = 24 * 60 * 60_000;

function rateLimitOk(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  let b = ipBuckets.get(ip);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + IP_WINDOW_MS };
    ipBuckets.set(ip, b);
  }
  if (b.count >= IP_LIMIT) {
    return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  }
  b.count++;
  return { ok: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [k, b] of ipBuckets) if (now > b.reset) ipBuckets.delete(k);
  for (const [k, t] of recentEmails) if (now - t > EMAIL_DEDUPE_MS) recentEmails.delete(k);
}, 10 * 60_000).unref();

function demoAccessTokenForLead(leadId: string, email: string, data: { source?: string | null; utmSource?: string | null }) {
  if (!isMarketingDemoLeadIntent(data)) return undefined;
  return issueMarketingDemoGateToken({ leadId, email }) ?? undefined;
}

router.get("/public/marketing/demo-gate/verify", (req, res): void => {
  const key = typeof req.query.key === "string" ? req.query.key : "";
  const result = verifyMarketingDemoGateToken(key);
  if (!result.valid) {
    res.status(401).json({ valid: false });
    return;
  }
  res.json({ valid: true });
});

router.post("/public/marketing/leads", async (req, res): Promise<void> => {
  // Honeypot: bots fill every field. Legitimate forms leave `website` blank.
  if (req.body && typeof req.body === "object" && req.body.website) {
    res.status(201).json({ ok: true });
    return;
  }

  const ip = (req.ip || req.socket.remoteAddress || "unknown") as string;
  const limit = rateLimitOk(ip);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfter ?? 60));
    sendError(res, req, 429, "Too many requests. Please try again later.");
    return;
  }

  const parsed = CreateMarketingLeadBody.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, req, 400, "Invalid lead payload");
    return;
  }

  const emailKey = parsed.data.email.trim().toLowerCase();
  const lastSeen = recentEmails.get(emailKey);
  const isDemoLead = isMarketingDemoLeadIntent(parsed.data);

  if (lastSeen && Date.now() - lastSeen < EMAIL_DEDUPE_MS) {
    const demoAccessToken = demoAccessTokenForLead(`dedupe-${emailKey}`, emailKey, parsed.data);
    res.status(201).json({ ok: true, ...(demoAccessToken ? { demoAccessToken } : {}) });
    return;
  }

  try {
    const { id } = await createMarketingLead(parsed.data);
    recentEmails.set(emailKey, Date.now());
    logger.info(
      { lead_id: id, source: parsed.data.source ?? "livia.io", demo: isDemoLead },
      "marketing_lead_captured",
    );
    const demoAccessToken = demoAccessTokenForLead(id, emailKey, parsed.data);
    res.status(201).json({ ok: true, ...(demoAccessToken ? { demoAccessToken } : {}) });
  } catch (err) {
    logger.error({ err }, "marketing_lead_capture_failed");
    sendError(res, req, 500, "Failed to record lead");
  }
});

export default router;

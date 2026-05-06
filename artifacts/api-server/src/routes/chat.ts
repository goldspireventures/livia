import { Router, type IRouter } from "express";
import { handlePublicChat } from "../services/ai-chat.service";

const router: IRouter = Router();

// Lightweight per-IP rate limiter for the unauthenticated AI chat endpoint.
// LLM calls are expensive — cap at 30 requests / 5 min and 120 / hour.
// In-memory only; sufficient for a single Replit instance.
type Bucket = { count5m: number; reset5m: number; count1h: number; reset1h: number };
const buckets = new Map<string, Bucket>();

function rateLimitOk(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b) {
    b = { count5m: 0, reset5m: now + 5 * 60_000, count1h: 0, reset1h: now + 60 * 60_000 };
    buckets.set(ip, b);
  }
  if (now > b.reset5m) { b.count5m = 0; b.reset5m = now + 5 * 60_000; }
  if (now > b.reset1h) { b.count1h = 0; b.reset1h = now + 60 * 60_000; }
  if (b.count5m >= 30) return { ok: false, retryAfter: Math.ceil((b.reset5m - now) / 1000) };
  if (b.count1h >= 120) return { ok: false, retryAfter: Math.ceil((b.reset1h - now) / 1000) };
  b.count5m++;
  b.count1h++;
  return { ok: true };
}

// Periodic cleanup so the map doesn't grow unboundedly.
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of buckets) {
    if (now > b.reset1h && now > b.reset5m && b.count1h === 0) buckets.delete(ip);
  }
}, 10 * 60_000).unref();

router.post("/public/b/:slug/chat", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const { conversationId, message, customerName, customerEmail, customerPhone } = req.body ?? {};

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  if (message.length > 2000) {
    res.status(400).json({ error: "message too long (max 2000 chars)" });
    return;
  }

  const ip = (req.ip || req.socket.remoteAddress || "unknown") as string;
  const limit = rateLimitOk(ip);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfter ?? 60));
    res.status(429).json({ error: "Too many messages. Please wait a moment." });
    return;
  }

  try {
    const result = await handlePublicChat({
      slug,
      conversationId: conversationId ?? undefined,
      message: message.trim(),
      customerName,
      customerEmail,
      customerPhone,
    });
    res.json(result);
  } catch (err: any) {
    if (err?.message === "BUSINESS_NOT_FOUND") {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    if (err?.message === "AI_DISABLED") {
      res.status(400).json({ error: "AI assistant is disabled for this business" });
      return;
    }
    // Anthropic errors / unknown
    // eslint-disable-next-line no-console
    console.error("[chat] error:", err);
    res.status(500).json({ error: err?.message ?? "Chat failed" });
  }
});

export default router;

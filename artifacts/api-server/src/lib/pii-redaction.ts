/** Redact PII from log payloads — phones, emails, message bodies. */
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function redactPii(text: string): string {
  return text
    .replace(PHONE_RE, "[phone]")
    .replace(EMAIL_RE, "[email]");
}

export function redactObject(obj: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (obj == null || typeof obj !== "object") {
    if (typeof obj === "string") return redactPii(obj);
    return obj;
  }
  if (Array.isArray(obj)) return obj.map((v) => redactObject(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = k.toLowerCase();
    if (
      key.includes("phone") ||
      key.includes("email") ||
      key === "body" ||
      key === "content" ||
      key === "message" ||
      key === "text"
    ) {
      out[k] = typeof v === "string" ? redactPii(v) : "[redacted]";
    } else {
      out[k] = redactObject(v, depth + 1);
    }
  }
  return out;
}

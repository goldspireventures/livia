/**
 * Customer-facing copy patterns that must not appear on production surfaces.
 * Used by pls-content-audit.mjs and PLS Playwright captures.
 */
export const FORBIDDEN_CUSTOMER_PATTERNS = [
  { id: "closed-beta", re: /closed beta/i, hint: "Use plain compliance language — no beta framing" },
  { id: "staging-demo", re: /\bstaging demo\b/i, hint: "Remove staging references from guest/owner UI" },
  { id: "dev-port", re: /port 3000/i, hint: "No dev port hints in customer copy" },
  { id: "meta-token", re: /META_ACCESS_TOKEN/i, hint: "Operator env jargon in UI" },
  { id: "staff-row-id", re: /staff row id/i, hint: "Use human label e.g. Staff member ID" },
  { id: "verify-salon", re: /verify salon id/i, hint: "Vertical-neutral identifier copy" },
  { id: "object-object", re: /\[object Object\]/, hint: "Serialized error leaked to UI" },
  { id: "http-raw", re: /\bHTTP \d{3}\b/, hint: "Raw HTTP status in toast or body" },
];

/** Allowed in demo-only surfaces — still flagged on prod build paths when scanned statically. */
export const DEMO_ONLY_PATTERNS = [
  { id: "demo-otp-visible", re: /demo code|staging code|magic otp/i, hint: "OTP helper must be demo/staging gated" },
];

export function scanText(text, patterns = FORBIDDEN_CUSTOMER_PATTERNS) {
  const hits = [];
  for (const p of patterns) {
    if (p.re.test(text)) hits.push({ ...p, match: text.match(p.re)?.[0] ?? "" });
  }
  return hits;
}

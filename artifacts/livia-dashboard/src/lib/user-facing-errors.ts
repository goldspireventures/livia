import { ApiFetchError } from "@/lib/api-fetch";

const HTTP_PREFIX = /^HTTP \d+\s*[^:]*:\s*/i;
const REF_SUFFIX = /\s*\(ref [0-9a-f-]+\)\s*$/i;

function cleanMessage(raw: string): string {
  return raw.replace(HTTP_PREFIX, "").replace(REF_SUFFIX, "").trim();
}

/** Human-readable error for owner/operator surfaces — never raw HTTP status lines. */
export function parseUserFacingError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (err instanceof ApiFetchError) {
    const cleaned = cleanMessage(err.message);
    if (cleaned && !/^HTTP \d+/i.test(cleaned)) return cleaned;
    if (err.code === "GO_LIVE_REQUIRES_TEST_BOOKING") {
      return "Complete a test booking on your public page before finishing setup.";
    }
    return fallback;
  }
  if (err && typeof err === "object") {
    const e = err as { data?: unknown; response?: { data?: unknown }; message?: string };
    const data = e.data ?? e.response?.data;
    if (data && typeof data === "object" && "error" in data) {
      const apiMsg = (data as { error: unknown }).error;
      if (typeof apiMsg === "string" && apiMsg.trim()) return cleanMessage(apiMsg);
    }
    if (typeof e.message === "string" && e.message.trim()) {
      const cleaned = cleanMessage(e.message);
      if (cleaned && !/^HTTP \d+/i.test(cleaned)) return cleaned;
    }
  }
  if (err instanceof Error && err.message.trim()) {
    const cleaned = cleanMessage(err.message);
    if (cleaned && !/^HTTP \d+/i.test(cleaned)) return cleaned;
  }
  return fallback;
}

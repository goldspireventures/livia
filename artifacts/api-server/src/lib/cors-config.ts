import { getCorsAllowedOrigins } from "./public-urls";

const allowed = new Set(getCorsAllowedOrigins());

/** Production-safe CORS: allowlist only; credentials only for known app origins. */
export function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (allowed.has(origin)) {
    callback(null, true);
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    callback(null, true);
    return;
  }
  callback(null, false);
}

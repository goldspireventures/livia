const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

function parseAllowedOrigins(): Set<string> {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();
  const list = raw
    ? raw.split(",").map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ORIGINS;
  if (process.env.LIVIA_DASHBOARD_URL?.trim()) {
    list.push(process.env.LIVIA_DASHBOARD_URL.trim().replace(/\/+$/, ""));
  }
  if (process.env.LIVIA_MARKETING_URL?.trim()) {
    list.push(process.env.LIVIA_MARKETING_URL.trim().replace(/\/+$/, ""));
  }
  return new Set(list);
}

const allowed = parseAllowedOrigins();

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

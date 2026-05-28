/**
 * Resolves the API base URL for mobile fetches.
 *
 * Prefer `EXPO_PUBLIC_API_BASE_URL` (e.g. `http://192.168.1.10:3000` on a
 * physical device). Fall back to `https://${EXPO_PUBLIC_DOMAIN}` for deployed hosts.
 */
export function getApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (!domain) {
    throw new Error(
      "Set EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_DOMAIN in .env (see docs/LOCAL_DEV.md).",
    );
  }

  const host = domain.replace(/^https?:\/\//, "");
  return `https://${host}`;
}

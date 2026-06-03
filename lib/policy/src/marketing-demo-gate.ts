/** W1 marketing /demo concierge — query + session key (validated by API). */
export const MARKETING_DEMO_GATE_QUERY_PARAM = "key";

export const MARKETING_DEMO_GATE_STORAGE_KEY = "livia_demo_gate_key";

/** Personal demo link validity after book-demo request. */
export const MARKETING_DEMO_GATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Demo lead → API may return demoAccessToken in MarketingLeadAck. */
export function isMarketingDemoLeadIntent(input: {
  source?: string | null;
  utmSource?: string | null;
}): boolean {
  const source = (input.source ?? "").toLowerCase();
  const utm = (input.utmSource ?? "").toLowerCase();
  return source.includes("book-demo") || utm.startsWith("demo:") || utm === "demo-request";
}

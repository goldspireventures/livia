import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** True when Replit integration vars or a direct ANTHROPIC_API_KEY are set. */
export function isAnthropicConfigured(): boolean {
  const integrationKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const integrationBaseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const directKey = process.env.ANTHROPIC_API_KEY;
  return Boolean((integrationKey && integrationBaseUrl) || directKey);
}

function resolveAnthropicConfig(): { apiKey: string; baseURL: string } {
  const integrationKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const integrationBaseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const directKey = process.env.ANTHROPIC_API_KEY;

  if (integrationKey && integrationBaseUrl) {
    return { apiKey: integrationKey, baseURL: integrationBaseUrl };
  }

  if (directKey) {
    return {
      apiKey: directKey,
      baseURL: process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com",
    };
  }

  throw new Error(
    "Anthropic is not configured. For Replit, set AI_INTEGRATIONS_ANTHROPIC_API_KEY and AI_INTEGRATIONS_ANTHROPIC_BASE_URL. For local dev, set ANTHROPIC_API_KEY.",
  );
}

/** Lazily creates the Anthropic client on first use so the API can boot without AI env vars. */
export function getAnthropic(): Anthropic {
  if (!client) {
    const { apiKey, baseURL } = resolveAnthropicConfig();
    client = new Anthropic({ apiKey, baseURL });
  }
  return client;
}

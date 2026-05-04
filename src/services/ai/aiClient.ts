import "server-only";

/**
 * Shared AI boundary (T5). Core booking/payment flows must never import this file.
 * Optional OpenAI call — on failure or missing key, callers use deterministic fallbacks.
 */
export async function optionalChatCompletion(input: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<{ text: string | null; model: string | null; error: string | null }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { text: null, model: null, error: "no_api_key" };
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const started = Date.now();

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        max_tokens: input.maxTokens ?? 256,
      }),
    });

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      return {
        text: null,
        model,
        error: json.error?.message ?? `openai_http_${res.status}`,
      };
    }

    const text = json.choices?.[0]?.message?.content?.trim() ?? null;
    void started;
    return { text, model, error: null };
  } catch (e) {
    return {
      text: null,
      model,
      error: e instanceof Error ? e.message : "openai_fetch_failed",
    };
  }
}
